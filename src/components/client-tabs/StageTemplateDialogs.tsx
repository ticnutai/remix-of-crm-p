import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Layers,
  FolderOpen,
  Phone,
  Send,
  MapPin,
  FileText,
  Clock,
  CheckSquare,
  Loader2,
  Copy,
  Users,
  Search,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Settings2,
  X,
  Check,
  GripVertical,
} from "lucide-react";
import {
  useStageTemplates,
  StageTemplate,
  ClientStage,
} from "@/hooks/useStageTemplates";
import { useClientFolders, ClientFolder } from "@/hooks/useClientFolders";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Folder, CheckCircle } from "lucide-react";
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

// Icon mapping
const STAGE_ICONS: Record<string, React.ElementType> = {
  Phone,
  FolderOpen,
  Send,
  MapPin,
  FileText,
  Clock,
  CheckSquare,
  Layers,
};

// ============================================
// Save Stage As Template Dialog
// ============================================

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: ClientStage;
  onSaved?: () => void;
}

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
  stage,
  onSaved,
}: SaveAsTemplateDialogProps) {
  const { saveStageAsTemplate } = useStageTemplates();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && stage) {
      setName(stage.stage_name);
      setDescription("");
    }
  }, [open, stage]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    const result = await saveStageAsTemplate(
      stage,
      name,
      description || undefined,
    );
    setSaving(false);

    if (result) {
      onOpenChange(false);
      onSaved?.();
    }
  };

  const Icon = STAGE_ICONS[stage?.stage_icon || "FolderOpen"] || FolderOpen;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            שמור כתבנית
          </DialogTitle>
          <DialogDescription>
            שמור את השלב והמשימות שלו כתבנית לשימוש חוזר
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview */}
          <div className="bg-muted/50 rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-primary" />
              <span className="font-medium">{stage?.stage_name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {stage?.tasks?.length || 0} משימות
            </div>
            {stage?.tasks && stage.tasks.length > 0 && (
              <div className="mt-2 space-y-1">
                {stage.tasks.slice(0, 3).map((task, i) => (
                  <div
                    key={i}
                    className="text-xs text-muted-foreground flex items-center gap-1"
                  >
                    <CheckSquare className="h-3 w-3" />
                    {task.title}
                  </div>
                ))}
                {stage.tasks.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{stage.tasks.length - 3} משימות נוספות
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="template-name">שם התבנית</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: תבנית התקשרות לקוח"
            />
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <Label htmlFor="template-desc">תיאור (אופציונלי)</Label>
            <Textarea
              id="template-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר של התבנית..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            שמור תבנית
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Save All Stages As Template Dialog
// ============================================

interface SaveAllStagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: ClientStage[];
  onSaved?: () => void;
}

export function SaveAllStagesDialog({
  open,
  onOpenChange,
  stages,
  onSaved,
}: SaveAllStagesDialogProps) {
  const { saveMultiStageTemplate } = useStageTemplates();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [includeTaskContent, setIncludeTaskContent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setIncludeTaskContent(false);
      // Select all by default
      setSelectedStages(new Set(stages.map((s) => s.stage_id)));
    }
  }, [open, stages]);

  const toggleStage = (stageId: string) => {
    const newSet = new Set(selectedStages);
    if (newSet.has(stageId)) {
      newSet.delete(stageId);
    } else {
      newSet.add(stageId);
    }
    setSelectedStages(newSet);
  };

  const handleSave = async () => {
    if (!name.trim() || selectedStages.size === 0) {
      console.log("[SaveAllStagesDialog] Validation failed:", {
        name: name.trim(),
        selectedStagesCount: selectedStages.size,
      });
      return;
    }

    const stagesToSave = stages.filter((s) => selectedStages.has(s.stage_id));

    console.log("[SaveAllStagesDialog] Saving template:", {
      name,
      description,
      includeTaskContent,
      stagesToSave: stagesToSave.map((s) => ({
        stage_id: s.stage_id,
        stage_name: s.stage_name,
        stage_icon: s.stage_icon,
        sort_order: s.sort_order,
        tasksCount: s.tasks?.length || 0,
        tasks: s.tasks,
      })),
    });

    setSaving(true);
    const result = await saveMultiStageTemplate(
      stagesToSave,
      name,
      description || undefined,
      includeTaskContent,
    );
    setSaving(false);

    console.log("[SaveAllStagesDialog] Save result:", result);

    if (result) {
      onOpenChange(false);
      onSaved?.();
    }
  };

  const totalTasks = stages
    .filter((s) => selectedStages.has(s.stage_id))
    .reduce((sum, s) => sum + (s.tasks?.length || 0), 0);

  // Count completed tasks for preview
  const completedTasks = stages
    .filter((s) => selectedStages.has(s.stage_id))
    .reduce(
      (sum, s) => sum + (s.tasks?.filter((t: any) => t.completed)?.length || 0),
      0,
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            שמור כל השלבים כתבנית
          </DialogTitle>
          <DialogDescription>
            בחר את השלבים לשמירה ותן שם לתבנית
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="multi-template-name">שם התבנית</Label>
            <Input
              id="multi-template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: תבנית לקוח חדש מלאה"
            />
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <Label htmlFor="multi-template-desc">תיאור (אופציונלי)</Label>
            <Textarea
              id="multi-template-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר של התבנית..."
              rows={2}
            />
          </div>

          {/* Include task content checkbox */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <Checkbox
              id="include-task-content"
              checked={includeTaskContent}
              onCheckedChange={(checked) =>
                setIncludeTaskContent(checked === true)
              }
            />
            <div className="flex-1">
              <Label
                htmlFor="include-task-content"
                className="font-medium cursor-pointer"
              >
                שמור כולל המילוי
              </Label>
              <p className="text-xs text-muted-foreground">
                ישמור את סטטוס השלמת המשימות, צבעים ועיצוב
                {completedTasks > 0 && (
                  <span className="text-primary">
                    {" "}
                    ({completedTasks} משימות מושלמות)
                  </span>
                )}
              </p>
            </div>
          </div>

          <Separator />

          {/* Stages selection */}
          <div className="space-y-2">
            <Label>בחר שלבים ({selectedStages.size} נבחרו)</Label>
            <ScrollArea className="h-[200px] border rounded-lg p-2">
              <div className="space-y-2">
                {stages.map((stage) => {
                  const Icon =
                    STAGE_ICONS[stage.stage_icon || "FolderOpen"] || FolderOpen;
                  return (
                    <div
                      key={stage.stage_id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        selectedStages.has(stage.stage_id)
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted",
                      )}
                      onClick={() => toggleStage(stage.stage_id)}
                    >
                      <Checkbox
                        checked={selectedStages.has(stage.stage_id)}
                        onCheckedChange={() => toggleStage(stage.stage_id)}
                      />
                      <Icon className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {stage.stage_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stage.tasks?.length || 0} משימות
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <Badge variant="secondary">{selectedStages.size} שלבים</Badge>
            <Badge variant="secondary">{totalTasks} משימות</Badge>
            {includeTaskContent && (
              <Badge variant="default" className="bg-primary">
                כולל מילוי
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim() || selectedStages.size === 0}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {includeTaskContent ? "שמור תבנית עם מילוי" : "שמור תבנית"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Apply Template Dialog
// ============================================

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  existingStagesCount: number;
  onApplied?: () => void;
  folderId?: string | null;
}

export function ApplyTemplateDialog({
  open,
  onOpenChange,
  clientId,
  existingStagesCount,
  onApplied,
  folderId,
}: ApplyTemplateDialogProps) {
  const {
    templates,
    loading,
    applyTemplate,
    deleteTemplate,
    updateTemplate,
    addStageToTemplate,
    deleteStageFromTemplate,
    renameStageInTemplate,
    addTaskToTemplateStage,
    deleteTaskFromTemplate,
    renameTaskInTemplate,
    reorderTemplateStages,
  } = useStageTemplates();

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [applying, setApplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showAllTasks, setShowAllTasks] = useState<Record<string, boolean>>({});
  // selectedStagesByTemplate: maps templateId -> Set of selected stage IDs
  const [selectedStagesByTemplate, setSelectedStagesByTemplate] = useState<
    Record<string, Set<string>>
  >();
  // Edit-stages mode: which templateId is being edited
  const [editStagesMode, setEditStagesMode] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState("");
  const [addingStage, setAddingStage] = useState(false);
  const [renamingStage, setRenamingStage] = useState<{
    stageId: string;
    name: string;
  } | null>(null);
  const [deletingStageId, setDeletingStageId] = useState<string | null>(null);
  // Task editing state
  const [expandedEditStage, setExpandedEditStage] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [renamingTask, setRenamingTask] = useState<{
    taskId: string;
    title: string;
  } | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const handleStageDragEnd = async (event: DragEndEvent, template: StageTemplate) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !template.stages) return;
    const oldIndex = template.stages.findIndex((s) => s.id === active.id);
    const newIndex = template.stages.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(template.stages, oldIndex, newIndex);
    await reorderTemplateStages(template.id, reordered.map((s) => s.id));
  };

  const handleAddStage = async (templateId: string) => {
    if (!newStageName.trim()) return;
    setAddingStage(true);
    await addStageToTemplate(templateId, newStageName.trim());
    setNewStageName("");
    setAddingStage(false);
  };

  const handleDeleteStage = async (stageId: string) => {
    setDeletingStageId(stageId);
    await deleteStageFromTemplate(stageId);
    setDeletingStageId(null);
  };

  const handleRenameStage = async (stageId: string) => {
    if (!renamingStage || !renamingStage.name.trim()) return;
    await renameStageInTemplate(stageId, renamingStage.name.trim());
    setRenamingStage(null);
  };

  const handleAddTask = async (templateId: string, stageId: string) => {
    if (!newTaskName.trim()) return;
    setAddingTask(true);
    await addTaskToTemplateStage(templateId, stageId, newTaskName.trim());
    setNewTaskName("");
    setAddingTask(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    setDeletingTaskId(taskId);
    await deleteTaskFromTemplate(taskId);
    setDeletingTaskId(null);
  };

  const handleRenameTask = async (taskId: string) => {
    if (!renamingTask || !renamingTask.title.trim()) return;
    await renameTaskInTemplate(taskId, renamingTask.title.trim());
    setRenamingTask(null);
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Toggle a single stage checkbox for a template
  const toggleStageSelection = (
    templateId: string,
    stageId: string,
    allStageIds: string[],
  ) => {
    setSelectedStagesByTemplate((prev) => {
      const current = prev?.[templateId]
        ? new Set(prev[templateId])
        : new Set(allStageIds); // default: all selected
      if (current.has(stageId)) {
        current.delete(stageId);
      } else {
        current.add(stageId);
      }
      return { ...prev, [templateId]: current };
    });
  };

  // Toggle select-all / deselect-all for a template
  const toggleAllStages = (templateId: string, allStageIds: string[]) => {
    setSelectedStagesByTemplate((prev) => {
      const current = prev?.[templateId];
      const allSelected =
        !current || current.size === allStageIds.length;
      return {
        ...prev,
        [templateId]: allSelected ? new Set() : new Set(allStageIds),
      };
    });
  };

  const handleApply = async (templateId: string, allStageIds: string[]) => {
    // Get selected stages (default = all)
    const selected = selectedStagesByTemplate?.[templateId];
    const selectedIds =
      selected && selected.size < allStageIds.length
        ? Array.from(selected)
        : undefined; // undefined = apply all

    if (selected && selected.size === 0) return; // nothing selected

    setApplying(true);
    const result = await applyTemplate(
      templateId,
      clientId,
      existingStagesCount,
      folderId,
      selectedIds,
    );
    setApplying(false);

    if (result) {
      onOpenChange(false);
      onApplied?.();
    }
  };

  const handleDelete = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("האם למחוק את התבנית?")) {
      await deleteTemplate(templateId);
    }
  };

  const handleStartEdit = (template: StageTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplate(template.id);
    setEditName(template.name);
  };

  const handleSaveEdit = async (templateId: string) => {
    if (editName.trim()) {
      await updateTemplate(templateId, { name: editName });
    }
    setEditingTemplate(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            הוסף מתבנית
          </DialogTitle>
          <DialogDescription>בחר תבנית להוספה ללקוח</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש תבנית..."
              className="pr-9"
            />
          </div>

          {/* Templates list */}
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "לא נמצאו תבניות" : "אין תבניות שמורות"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template) => {
                  const isExpanded = expandedTemplate === template.id;
                  const isEditing = editingTemplate === template.id;
                  const Icon = STAGE_ICONS[template.icon] || Layers;
                  const totalTasks =
                    template.stages?.reduce(
                      (sum, s) => sum + (s.tasks?.length || 0),
                      0,
                    ) ||
                    template.tasks?.length ||
                    0;

                  const allStageIds = (template.stages || []).map(
                    (s) => s.id,
                  );
                  const selectedSet = selectedStagesByTemplate?.[template.id];
                  // If no selection state yet, all stages are considered selected
                  const effectiveSelected =
                    selectedSet ?? new Set(allStageIds);
                  const allChecked =
                    effectiveSelected.size === allStageIds.length;
                  const noneChecked = effectiveSelected.size === 0;

                  return (
                    <div
                      key={template.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div
                        className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() =>
                          setExpandedTemplate(isExpanded ? null : template.id)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleSaveEdit(template.id);
                                  if (e.key === "Escape")
                                    setEditingTemplate(null);
                                }}
                                autoFocus
                                className="h-7"
                              />
                            ) : (
                              <div className="font-medium truncate">
                                {template.name}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              {template.is_multi_stage ? (
                                <>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {template.stages?.length || 0} שלבים
                                  </Badge>
                                  <span>{totalTasks} משימות</span>
                                </>
                              ) : (
                                <span>{totalTasks} משימות</span>
                              )}
                              {template.includes_task_content && (
                                <Badge
                                  variant="default"
                                  className="text-[10px] bg-primary"
                                >
                                  כולל מילוי
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveEdit(template.id);
                                }}
                              >
                                שמור
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={(e) => handleStartEdit(template, e)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={(e) => handleDelete(template.id, e)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div
                          className="border-t bg-muted/30 p-3 text-right"
                          dir="rtl"
                        >
                          {template.description && (
                            <p className="text-sm text-muted-foreground mb-3 text-right">
                              {template.description}
                            </p>
                          )}

                          {/* Toolbar: toggle edit-stages mode */}
                          {template.is_multi_stage && (
                            <div className="flex items-center justify-between mb-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditStagesMode(
                                    editStagesMode === template.id
                                      ? null
                                      : template.id,
                                  );
                                  setNewStageName("");
                                  setRenamingStage(null);
                                }}
                                className={cn(
                                  "flex items-center gap-1.5 text-xs rounded px-2 py-1 transition-colors",
                                  editStagesMode === template.id
                                    ? "bg-primary text-primary-foreground"
                                    : "text-primary hover:bg-primary/10",
                                )}
                              >
                                <Settings2 className="h-3.5 w-3.5" />
                                {editStagesMode === template.id
                                  ? "סיום עריכה"
                                  : "ערוך שלבים"}
                              </button>
                            </div>
                          )}

                          {/* EDIT STAGES MODE */}
                          {editStagesMode === template.id ? (
                            <DndContext
                              sensors={dndSensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleStageDragEnd(event, template)}
                            >
                            <SortableContext
                              items={(template.stages || []).map((s) => s.id)}
                              strategy={verticalListSortingStrategy}
                            >
                            <div className="space-y-2 mb-3 max-h-[350px] overflow-y-auto">
                              {(template.stages || []).map((stage) => {
                                const StageIcon =
                                  STAGE_ICONS[stage.stage_icon] || FolderOpen;
                                const isRenaming =
                                  renamingStage?.stageId === stage.id;
                                const isDeleting = deletingStageId === stage.id;
                                const isStageExpanded = expandedEditStage === stage.id;

                                return (
                                  <div
                                    key={stage.id}
                                    className="bg-background border rounded-lg overflow-hidden"
                                  >
                                    {/* Stage header row */}
                                    <div className="flex items-center gap-2 px-3 py-2">
                                      <StageIcon className="h-4 w-4 text-primary flex-shrink-0" />
                                      {isRenaming ? (
                                        <>
                                          <Input
                                            value={renamingStage.name}
                                            onChange={(e) =>
                                              setRenamingStage({
                                                stageId: stage.id,
                                                name: e.target.value,
                                              })
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter")
                                                handleRenameStage(stage.id);
                                              if (e.key === "Escape")
                                                setRenamingStage(null);
                                            }}
                                            autoFocus
                                            className="h-7 flex-1 text-sm"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-primary hover:text-primary"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRenameStage(stage.id);
                                            }}
                                          >
                                            <Check className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRenamingStage(null);
                                            }}
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          {/* Expand/collapse tasks toggle */}
                                          <button
                                            className="flex-1 text-sm font-medium text-right flex items-center gap-1 hover:text-primary transition-colors"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setExpandedEditStage(isStageExpanded ? null : stage.id);
                                              setNewTaskName("");
                                              setRenamingTask(null);
                                            }}
                                          >
                                            {isStageExpanded ? (
                                              <ChevronUp className="h-3.5 w-3.5 flex-shrink-0" />
                                            ) : (
                                              <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                                            )}
                                            {stage.stage_name}
                                          </button>
                                          <Badge
                                            variant="outline"
                                            className="text-[10px]"
                                          >
                                            {stage.tasks?.length || 0} משימות
                                          </Badge>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRenamingStage({
                                                stageId: stage.id,
                                                name: stage.stage_name,
                                              });
                                            }}
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            disabled={isDeleting}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (
                                                confirm(
                                                  `למחוק את השלב "${stage.stage_name}"?`,
                                                )
                                              ) {
                                                handleDeleteStage(stage.id);
                                              }
                                            }}
                                          >
                                            {isDeleting ? (
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                          </Button>
                                        </>
                                      )}
                                    </div>

                                    {/* Expanded tasks list */}
                                    {isStageExpanded && (
                                      <div className="border-t bg-muted/20 px-3 py-2 space-y-1.5">
                                        {(stage.tasks || []).map((task) => {
                                          const isTaskRenaming = renamingTask?.taskId === task.id;
                                          const isTaskDeleting = deletingTaskId === task.id;

                                          return (
                                            <div
                                              key={task.id}
                                              className="flex items-center gap-2 pr-4"
                                            >
                                              <CheckSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                              {isTaskRenaming ? (
                                                <>
                                                  <Input
                                                    value={renamingTask.title}
                                                    onChange={(e) =>
                                                      setRenamingTask({
                                                        taskId: task.id,
                                                        title: e.target.value,
                                                      })
                                                    }
                                                    onKeyDown={(e) => {
                                                      if (e.key === "Enter") handleRenameTask(task.id);
                                                      if (e.key === "Escape") setRenamingTask(null);
                                                    }}
                                                    autoFocus
                                                    className="h-6 flex-1 text-xs"
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 text-primary"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleRenameTask(task.id);
                                                    }}
                                                  >
                                                    <Check className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setRenamingTask(null);
                                                    }}
                                                  >
                                                    <X className="h-3 w-3" />
                                                  </Button>
                                                </>
                                              ) : (
                                                <>
                                                  <span className="flex-1 text-xs text-foreground">
                                                    {task.title}
                                                  </span>
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                                                    style={{ opacity: 1 }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setRenamingTask({
                                                        taskId: task.id,
                                                        title: task.title,
                                                      });
                                                    }}
                                                  >
                                                    <Pencil className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                                    disabled={isTaskDeleting}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDeleteTask(task.id);
                                                    }}
                                                  >
                                                    {isTaskDeleting ? (
                                                      <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                      <Trash2 className="h-3 w-3" />
                                                    )}
                                                  </Button>
                                                </>
                                              )}
                                            </div>
                                          );
                                        })}

                                        {/* Add new task */}
                                        <div
                                          className="flex items-center gap-2 pr-4 border-t border-dashed pt-1.5 mt-1.5"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Plus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                          <Input
                                            value={newTaskName}
                                            onChange={(e) => setNewTaskName(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter")
                                                handleAddTask(template.id, stage.id);
                                            }}
                                            placeholder="משימה חדשה..."
                                            className="h-6 flex-1 text-xs border-0 bg-transparent focus-visible:ring-0"
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 text-[10px] text-primary px-2"
                                            disabled={!newTaskName.trim() || addingTask}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAddTask(template.id, stage.id);
                                            }}
                                          >
                                            {addingTask ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                              "הוסף"
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Add new stage row */}
                              <div
                                className="flex items-center gap-2 border border-dashed rounded-lg px-3 py-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <Input
                                  value={newStageName}
                                  onChange={(e) =>
                                    setNewStageName(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleAddStage(template.id);
                                  }}
                                  placeholder="שם שלב חדש..."
                                  className="h-7 flex-1 text-sm border-0 bg-transparent focus-visible:ring-0"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-primary"
                                  disabled={
                                    !newStageName.trim() || addingStage
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddStage(template.id);
                                  }}
                                >
                                  {addingStage ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    "הוסף"
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* NORMAL VIEW MODE */
                            <>
                              {template.stages && template.stages.length > 0 && (
                                <div className="space-y-3 mb-3 max-h-[250px] overflow-y-auto">
                                  {/* Select all / Deselect all */}
                                  <div className="flex items-center justify-between pb-1 border-b border-muted">
                                    <span className="text-xs text-muted-foreground">
                                      {effectiveSelected.size} /{" "}
                                      {allStageIds.length} שלבים נבחרו
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAllStages(
                                          template.id,
                                          allStageIds,
                                        );
                                      }}
                                      className="text-xs text-primary hover:underline"
                                    >
                                      {allChecked ? "בטל הכל" : "בחר הכל"}
                                    </button>
                                  </div>

                                  {template.stages.map((stage) => {
                                    const StageIcon =
                                      STAGE_ICONS[stage.stage_icon] ||
                                      FolderOpen;
                                    const stageKey = `${template.id}-${stage.id}`;
                                    const showAll = showAllTasks[stageKey];
                                    const tasksToShow = showAll
                                      ? stage.tasks
                                      : stage.tasks?.slice(0, 3);
                                    const isChecked = effectiveSelected.has(
                                      stage.id,
                                    );

                                    return (
                                      <div
                                        key={stage.id}
                                        className={cn(
                                          "text-sm text-right border-b border-muted pb-2 last:border-b-0 rounded px-1 transition-colors",
                                          isChecked ? "" : "opacity-50",
                                        )}
                                      >
                                        <div className="flex items-center gap-2 font-medium justify-start mb-1">
                                          <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={() => {
                                              toggleStageSelection(
                                                template.id,
                                                stage.id,
                                                allStageIds,
                                              );
                                            }}
                                            onClick={(e) =>
                                              e.stopPropagation()
                                            }
                                            className="h-4 w-4 flex-shrink-0"
                                          />
                                          <StageIcon className="h-4 w-4 text-primary" />
                                          <span>{stage.stage_name}</span>
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] mr-auto"
                                          >
                                            {stage.tasks?.length || 0} משימות
                                          </Badge>
                                        </div>
                                        {stage.tasks &&
                                          stage.tasks.length > 0 && (
                                            <div className="mr-6 mt-1 space-y-1">
                                              {tasksToShow?.map((task) => (
                                                <div
                                                  key={task.id}
                                                  className="text-xs text-muted-foreground flex items-center gap-1.5"
                                                >
                                                  <CheckSquare className="h-3 w-3 text-muted-foreground/60" />
                                                  <span>{task.title}</span>
                                                </div>
                                              ))}
                                              {stage.tasks.length > 3 && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowAllTasks((prev) => ({
                                                      ...prev,
                                                      [stageKey]:
                                                        !prev[stageKey],
                                                    }));
                                                  }}
                                                  className="text-xs text-primary hover:underline mt-1"
                                                >
                                                  {showAll
                                                    ? "הסתר"
                                                    : `+${stage.tasks.length - 3} נוספות`}
                                                </button>
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              <Button
                                className="w-full"
                                onClick={() =>
                                  handleApply(template.id, allStageIds)
                                }
                                disabled={applying || noneChecked}
                              >
                                {applying && (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                {noneChecked
                                  ? "בחר לפחות שלב אחד"
                                  : allChecked
                                    ? `החל תבנית (${allStageIds.length} שלבים, ${totalTasks} משימות)`
                                    : `החל ${effectiveSelected.size} שלבים נבחרים`}
                                {!noneChecked &&
                                  template.includes_task_content &&
                                  " - כולל מילוי"}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Copy Stages From Client Dialog
// ============================================

interface CopyStagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetClientId: string;
  onCopied?: () => void;
  folderId?: string | null;
}

export function CopyStagesDialog({
  open,
  onOpenChange,
  targetClientId,
  onCopied,
  folderId,
}: CopyStagesDialogProps) {
  const { getClientsForCopy, getClientStages, copyStagesFromClient } =
    useStageTemplates();
  const { folders: targetFolders } = useClientFolders(targetClientId);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientStages, setClientStages] = useState<ClientStage[]>([]);
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTargetFolder, setSelectedTargetFolder] = useState<string | null>(folderId || null);
  const [copyWithCompletion, setCopyWithCompletion] = useState(false);

  // Load clients on open
  useEffect(() => {
    if (open) {
      loadClients();
      setSelectedClient(null);
      setClientStages([]);
      setSelectedStages(new Set());
      setSearchQuery("");
      setSelectedTargetFolder(folderId || null);
      setCopyWithCompletion(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadClients = async () => {
    setLoading(true);
    const data = await getClientsForCopy(targetClientId);
    setClients(data);
    setLoading(false);
  };

  const handleClientSelect = async (clientId: string) => {
    setSelectedClient(clientId);
    setLoading(true);
    const stages = await getClientStages(clientId);
    setClientStages(stages);
    setSelectedStages(new Set(stages.map((s) => s.stage_id)));
    setLoading(false);
  };

  const toggleStage = (stageId: string) => {
    const newSet = new Set(selectedStages);
    if (newSet.has(stageId)) {
      newSet.delete(stageId);
    } else {
      newSet.add(stageId);
    }
    setSelectedStages(newSet);
  };

  const handleCopy = async () => {
    if (!selectedClient || selectedStages.size === 0) return;

    setCopying(true);
    const result = await copyStagesFromClient(
      selectedClient,
      targetClientId,
      Array.from(selectedStages),
      selectedTargetFolder,
      copyWithCompletion,
    );
    setCopying(false);

    if (result) {
      onOpenChange(false);
      onCopied?.();
    }
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalTasks = clientStages
    .filter((s) => selectedStages.has(s.stage_id))
    .reduce((sum, s) => sum + (s.tasks?.length || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            העתק שלבים מלקוח אחר
          </DialogTitle>
          <DialogDescription>
            בחר לקוח להעתקת השלבים והמשימות שלו
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client selection */}
          <div className="space-y-2">
            <Label>בחר לקוח מקור</Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש לקוח..."
                className="pr-9"
              />
            </div>
            <ScrollArea className="h-[150px] border rounded-lg">
              {loading && !selectedClient ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className={cn(
                        "p-2 rounded cursor-pointer transition-colors flex items-center gap-2",
                        selectedClient === client.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted",
                      )}
                      onClick={() => handleClientSelect(client.id)}
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{client.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Stages selection */}
          {selectedClient && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>בחר שלבים להעתקה ({selectedStages.size} נבחרו)</Label>
                <ScrollArea className="h-[180px] border rounded-lg p-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : clientStages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      אין שלבים ללקוח זה
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientStages.map((stage) => {
                        const Icon =
                          STAGE_ICONS[stage.stage_icon || "FolderOpen"] ||
                          FolderOpen;
                        return (
                          <div
                            key={stage.stage_id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                              selectedStages.has(stage.stage_id)
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted",
                            )}
                            onClick={() => toggleStage(stage.stage_id)}
                          >
                            <Checkbox
                              checked={selectedStages.has(stage.stage_id)}
                              onCheckedChange={() =>
                                toggleStage(stage.stage_id)
                              }
                            />
                            <Icon className="h-4 w-4 text-primary" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {stage.stage_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {stage.tasks?.length || 0} משימות
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Summary */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="secondary">{selectedStages.size} שלבים</Badge>
                  <Badge variant="secondary">{totalTasks} משימות</Badge>
                </div>
              </div>

              {/* Target folder selection */}
              <Separator />
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-amber-500" />
                  בחר תיקייה יעד
                </Label>
                <Select
                  value={selectedTargetFolder || "__none__"}
                  onValueChange={(val) => setSelectedTargetFolder(val === "__none__" ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ללא תיקייה (שורש)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        ללא תיקייה (שורש)
                      </span>
                    </SelectItem>
                    {targetFolders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <span className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-amber-500" />
                          {folder.folder_name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Copy with completion status */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-sm font-medium">העתק עם סטטוס מילוי</div>
                    <div className="text-xs text-muted-foreground">
                      שמור את סימוני ה"נעשה" מהלקוח המקור
                    </div>
                  </div>
                </div>
                <Switch
                  checked={copyWithCompletion}
                  onCheckedChange={setCopyWithCompletion}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            onClick={handleCopy}
            disabled={copying || !selectedClient || selectedStages.size === 0}
          >
            {copying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            העתק שלבים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
