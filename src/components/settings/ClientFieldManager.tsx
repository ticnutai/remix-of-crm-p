// Client Field Manager - Admin UI for managing client form fields
import React, { useState } from "react";
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
} from "lucide-react";
import { useClientFieldConfig } from "@/hooks/useClientFieldConfig";
import { useClientCustomFields, type NewFieldDefinition, type CustomFieldDefinition } from "@/hooks/useClientCustomFields";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  } = useClientFieldConfig();

  const {
    definitions: customFieldDefs,
    isLoading: customFieldsLoading,
    addField: addCustomField,
    updateField: updateCustomField,
    deleteField: deleteCustomField,
  } = useClientCustomFields();

  const { toast } = useToast();

  // UI state
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
  const [editFieldDialog, setEditFieldDialog] = useState<CustomFieldDefinition | null>(null);
  const [deleteFieldConfirm, setDeleteFieldConfirm] = useState<string | null>(null);

  // New field form
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<NewFieldDefinition["field_type"]>("text");
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldSection, setNewFieldSection] = useState("custom");
  const [newFieldOptions, setNewFieldOptions] = useState("");

  // Edit field form
  const [editLabel, setEditLabel] = useState("");
  const [editType, setEditType] = useState<NewFieldDefinition["field_type"]>("text");
  const [editPlaceholder, setEditPlaceholder] = useState("");
  const [editRequired, setEditRequired] = useState(false);
  const [editOptions, setEditOptions] = useState("");

  const toggleSectionCollapse = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
      section: newFieldSection,
      options: newFieldType === "select" ? newFieldOptions.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
    });
    if (result) {
      setAddFieldDialogOpen(false);
      resetNewFieldForm();
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

  const resetNewFieldForm = () => {
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldPlaceholder("");
    setNewFieldRequired(false);
    setNewFieldSection("custom");
    setNewFieldOptions("");
  };

  const fieldTypeLabels: Record<string, string> = {
    text: "טקסט",
    number: "מספר",
    date: "תאריך",
    select: "בחירה",
    email: "אימייל",
    phone: "טלפון",
    textarea: "טקסט ארוך",
  };

  const sectionIcons: Record<string, React.ReactNode> = {
    basic: <FormInput className="h-4 w-4" />,
    address: <Layers className="h-4 w-4" />,
    realestate: <Settings2 className="h-4 w-4" />,
    aguda: <Shield className="h-4 w-4" />,
    moshav: <Shield className="h-4 w-4" />,
  };

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
                  שליטה בשדות שמוצגים בטופס הוספת לקוח — הסתרה, הצגה והוספת שדות חדשים
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hiddenCount > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  <EyeOff className="h-3 w-3 ml-1" />
                  {hiddenCount} שדות מוסתרים
                </Badge>
              )}
              <Badge variant="outline">
                {visibleCount}/{totalCount + customFieldDefs.length} פעילים
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={showAll}>
              <Eye className="h-4 w-4 ml-1" />
              הצג הכל
            </Button>
            <Button variant="outline" size="sm" onClick={resetDefaults}>
              <RotateCcw className="h-4 w-4 ml-1" />
              איפוס לברירת מחדל
            </Button>
            <Button size="sm" onClick={() => setAddFieldDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-1" />
              הוסף שדה מותאם
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Built-in Fields by Section */}
      {sections.map((section) => {
        const isCollapsed = collapsedSections.has(section.key);
        const sectionVisibleCount = section.fields.filter((f) => f.visible).length;
        const sectionTotalCount = section.fields.length;
        const allVisible = sectionVisibleCount === sectionTotalCount;
        const noneVisible = sectionVisibleCount === 0;

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
                  <Badge variant="outline" className="mr-2 text-xs">
                    {sectionVisibleCount}/{sectionTotalCount}
                  </Badge>
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <div className="flex items-center gap-2">
                  {section.key !== "basic" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSection(section.key, !allVisible)}
                            className="text-xs"
                          >
                            {allVisible ? (
                              <>
                                <EyeOff className="h-3.5 w-3.5 ml-1" />
                                הסתר סקציה
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5 ml-1" />
                                הצג סקציה
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {allVisible ? "הסתר את כל השדות בסקציה" : "הצג את כל השדות בסקציה"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </CardHeader>
            {!isCollapsed && (
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {section.fields.map((field) => (
                    <div
                      key={field.key}
                      className={cn(
                        "flex items-center justify-between py-2 px-3 rounded-lg transition-colors",
                        field.visible ? "bg-background" : "bg-muted/50",
                        "hover:bg-muted/80",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        {field.visible ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground/50" />
                        )}
                        <span className={cn("text-sm", !field.visible && "text-muted-foreground line-through")}>
                          {field.label}
                        </span>
                        {field.required && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            חובה
                          </Badge>
                        )}
                        {field.protected && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Shield className="h-3 w-3 text-amber-500" />
                              </TooltipTrigger>
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
                          onCheckedChange={() => toggleField(field.key)}
                          disabled={field.protected}
                          aria-label={`הצג/הסתר ${field.label}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Custom Fields Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Plus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-base">שדות מותאמים אישית</CardTitle>
                <CardDescription className="text-xs">
                  שדות שנוספו ידנית — נשמרים בענן ומופיעים בטופס הלקוח
                </CardDescription>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setAddFieldDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-1" />
              הוסף שדה
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
                <div
                  key={field.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                    <CheckCircle2 className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">{field.label}</span>
                    {field.is_required && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        חובה
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {fieldTypeLabels[field.field_type] || field.field_type}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditDialog(field)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>עריכת שדה</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteFieldConfirm(field.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>מחיקת שדה</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning if many fields hidden */}
      {hiddenCount > 3 && (
        <Card className="border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm">
                {hiddenCount} שדות מוסתרים — לקוחות חדשים לא יכללו מידע זה.
                נתונים קיימים לא יימחקו.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Field Dialog */}
      <Dialog open={addFieldDialogOpen} onOpenChange={setAddFieldDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              <Plus className="h-5 w-5 text-green-500" />
              הוספת שדה מותאם אישית
            </DialogTitle>
            <DialogDescription className="text-right">
              השדה יופיע בטופס הוספת לקוח ובפרופיל הלקוח
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-right">שם השדה *</Label>
              <Input
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="למשל: מספר רישיון"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right">סוג שדה</Label>
              <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as NewFieldDefinition["field_type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">טקסט</SelectItem>
                  <SelectItem value="number">מספר</SelectItem>
                  <SelectItem value="date">תאריך</SelectItem>
                  <SelectItem value="select">בחירה מרשימה</SelectItem>
                  <SelectItem value="email">אימייל</SelectItem>
                  <SelectItem value="phone">טלפון</SelectItem>
                  <SelectItem value="textarea">טקסט ארוך</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newFieldType === "select" && (
              <div className="space-y-2">
                <Label className="text-right">אפשרויות (מופרד בפסיקים)</Label>
                <Input
                  value={newFieldOptions}
                  onChange={(e) => setNewFieldOptions(e.target.value)}
                  placeholder="אפשרות 1, אפשרות 2, אפשרות 3"
                  className="text-right"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-right">טקסט placeholder</Label>
              <Input
                value={newFieldPlaceholder}
                onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                placeholder="טקסט עזר שיוצג בשדה ריק"
                className="text-right"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-right">שדה חובה</Label>
              <Switch checked={newFieldRequired} onCheckedChange={setNewFieldRequired} />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => { setAddFieldDialogOpen(false); resetNewFieldForm(); }}>
              ביטול
            </Button>
            <Button onClick={handleAddField} disabled={!newFieldLabel.trim()}>
              <Plus className="h-4 w-4 ml-1" />
              הוסף שדה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog open={!!editFieldDialog} onOpenChange={(open) => !open && setEditFieldDialog(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              <Edit2 className="h-5 w-5 text-blue-500" />
              עריכת שדה מותאם
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-right">שם השדה *</Label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right">סוג שדה</Label>
              <Select value={editType} onValueChange={(v) => setEditType(v as NewFieldDefinition["field_type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">טקסט</SelectItem>
                  <SelectItem value="number">מספר</SelectItem>
                  <SelectItem value="date">תאריך</SelectItem>
                  <SelectItem value="select">בחירה מרשימה</SelectItem>
                  <SelectItem value="email">אימייל</SelectItem>
                  <SelectItem value="phone">טלפון</SelectItem>
                  <SelectItem value="textarea">טקסט ארוך</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editType === "select" && (
              <div className="space-y-2">
                <Label className="text-right">אפשרויות (מופרד בפסיקים)</Label>
                <Input
                  value={editOptions}
                  onChange={(e) => setEditOptions(e.target.value)}
                  className="text-right"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-right">טקסט placeholder</Label>
              <Input
                value={editPlaceholder}
                onChange={(e) => setEditPlaceholder(e.target.value)}
                className="text-right"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-right">שדה חובה</Label>
              <Switch checked={editRequired} onCheckedChange={setEditRequired} />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setEditFieldDialog(null)}>
              ביטול
            </Button>
            <Button onClick={handleEditField} disabled={!editLabel.trim()}>
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteFieldConfirm} onOpenChange={(open) => !open && setDeleteFieldConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">מחיקת שדה מותאם</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              פעולה זו תמחק את הגדרת השדה. נתונים שכבר הוזנו בשדה זה ללקוחות קיימים יישמרו אך לא יוצגו בטופס.
              <br />
              <strong>האם להמשיך?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteField} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="h-4 w-4 ml-1" />
              מחק שדה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
