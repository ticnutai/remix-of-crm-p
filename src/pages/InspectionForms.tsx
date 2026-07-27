import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Archive,
  CalendarDays,
  Check,
  CheckSquare2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Circle,
  ClipboardCheck,
  FileCheck2,
  Folder,
  FolderInput,
  FolderOpen,
  FolderPlus,
  Layers3,
  ListChecks,
  Loader2,
  LockKeyhole,
  MoreVertical,
  Pin,
  PinOff,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type IconName =
  "clipboard-check" | "shield-check" | "file-check" | "list-checks";

interface TemplateStep {
  id: string;
  title: string;
  description: string | null;
  position: number;
  is_required: boolean;
}

interface InspectionTemplate {
  id: string;
  name: string;
  description: string | null;
  folder_id: string | null;
  icon_name: IconName;
  color: string;
  is_active: boolean;
  created_at: string;
  steps: TemplateStep[];
}

interface InspectionFolder {
  id: string;
  name: string;
  parent_id: string | null;
  color: string;
  sort_order: number;
  created_at: string;
}

interface FolderOption extends InspectionFolder {
  depth: number;
  path: string;
}

interface RunStep {
  id: string;
  title: string;
  description: string | null;
  position: number;
  is_required: boolean;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
}

interface InspectionRun {
  id: string;
  template_name: string;
  description: string | null;
  icon_name: IconName;
  color: string;
  status: "in_progress" | "completed" | "archived";
  is_pinned: boolean;
  created_by: string | null;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
  steps: RunStep[];
}

interface DraftStep {
  key: string;
  title: string;
  description: string;
}

interface ProfileOption {
  id: string;
  name: string;
}

interface FormTask {
  id: string;
  inspection_run_id: string;
  title: string;
  status: string | null;
  priority: string | null;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
}

interface DraftTaskRow {
  key: string;
  title: string;
  assignedTo: string;
  dueDate: string;
}

const iconOptions: Array<{
  value: IconName;
  label: string;
  icon: typeof ClipboardCheck;
}> = [
  { value: "clipboard-check", label: "בדיקה", icon: ClipboardCheck },
  { value: "shield-check", label: "בקרה", icon: ShieldCheck },
  { value: "file-check", label: "מסמך", icon: FileCheck2 },
  { value: "list-checks", label: "תהליך", icon: ListChecks },
];

const colorOptions = [
  "#d4a72c",
  "#1e3a5f",
  "#0f766e",
  "#7c3aed",
  "#dc2626",
  "#ea580c",
];

const db = supabase as any;

const getIcon = (name: string) =>
  iconOptions.find((option) => option.value === name)?.icon ?? ClipboardCheck;

const sortSteps = <T extends { position: number }>(steps: T[] | null) =>
  [...(steps ?? [])].sort((a, b) => a.position - b.position);

const parsePastedSteps = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/^(?:(?:[•●▪◦‣⁃*-])|(?:\d+[.)])|(?:[א-ת][.)]))\s+/u, "")
        .trim(),
    )
    .filter(Boolean);

const buildFolderOptions = (
  folders: InspectionFolder[],
  parentId: string | null = null,
  depth = 0,
  parentPath = "",
  visited = new Set<string>(),
): FolderOption[] =>
  folders
    .filter(
      (folder) => folder.parent_id === parentId && !visited.has(folder.id),
    )
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order || a.name.localeCompare(b.name, "he"),
    )
    .flatMap((folder) => {
      const nextVisited = new Set(visited).add(folder.id);
      const path = parentPath ? `${parentPath} / ${folder.name}` : folder.name;
      return [
        { ...folder, depth, path },
        ...buildFolderOptions(folders, folder.id, depth + 1, path, nextVisited),
      ];
    });

export default function InspectionForms() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [folders, setFolders] = useState<InspectionFolder[]>([]);
  const [runs, setRuns] = useState<InspectionRun[]>([]);
  const [formTasks, setFormTasks] = useState<FormTask[]>([]);
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [profileOptions, setProfileOptions] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [openRunIds, setOpenRunIds] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderParentId, setFolderParentId] = useState("root");
  const [folderColor, setFolderColor] = useState(colorOptions[0]);
  const [selectedFolderId, setSelectedFolderId] = useState("all");
  const [draftTemplateFolderId, setDraftTemplateFolderId] = useState("unfiled");
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(),
  );
  const [taskDialogRun, setTaskDialogRun] = useState<InspectionRun | null>(
    null,
  );
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [draftTaskRows, setDraftTaskRows] = useState<DraftTaskRow[]>([]);
  const [bulkStepsDialogOpen, setBulkStepsDialogOpen] = useState(false);
  const [bulkStepsText, setBulkStepsText] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftIcon, setDraftIcon] = useState<IconName>("clipboard-check");
  const [draftColor, setDraftColor] = useState(colorOptions[0]);
  const [draftSteps, setDraftSteps] = useState<DraftStep[]>([
    { key: crypto.randomUUID(), title: "", description: "" },
    { key: crypto.randomUUID(), title: "", description: "" },
  ]);
  const parsedBulkSteps = parsePastedSteps(bulkStepsText);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        templatesResult,
        runsResult,
        profilesResult,
        tasksResult,
        foldersResult,
      ] = await Promise.all([
        db
          .from("inspection_form_templates")
          .select(
            "*, steps:inspection_form_template_steps(id, title, description, position, is_required)",
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        db
          .from("inspection_form_runs")
          .select(
            "*, steps:inspection_form_run_steps(id, title, description, position, is_required, is_completed, completed_by, completed_at)",
          )
          .neq("status", "archived")
          .order("is_pinned", { ascending: false })
          .order("updated_at", { ascending: false }),
        db
          .from("profiles")
          .select("id, full_name, email")
          .eq("is_active", true),
        db
          .from("tasks")
          .select(
            "id, inspection_run_id, title, status, priority, assigned_to, due_date, created_at",
          )
          .not("inspection_run_id", "is", null)
          .order("created_at", { ascending: false }),
        db
          .from("inspection_form_folders")
          .select("id, name, parent_id, color, sort_order, created_at")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
      ]);

      if (templatesResult.error) throw templatesResult.error;
      if (runsResult.error) throw runsResult.error;
      if (foldersResult.error) throw foldersResult.error;

      setTemplates(
        (templatesResult.data ?? []).map((template: InspectionTemplate) => ({
          ...template,
          steps: sortSteps(template.steps),
        })),
      );
      setFolders((foldersResult.data ?? []) as InspectionFolder[]);

      const nextRuns = (runsResult.data ?? []).map((run: InspectionRun) => ({
        ...run,
        steps: sortSteps(run.steps),
      }));
      setRuns(nextRuns);
      if (tasksResult.error) throw tasksResult.error;
      setFormTasks((tasksResult.data ?? []) as FormTask[]);
      setOpenRunIds((current) => {
        const next = new Set(current);
        nextRuns
          .filter((run: InspectionRun) => run.is_pinned)
          .forEach((run: InspectionRun) => next.add(run.id));
        return next;
      });

      if (!profilesResult.error) {
        const nextProfiles = (profilesResult.data ?? []).map(
          (item: { id: string; full_name: string | null; email: string }) => ({
            id: item.id,
            name: item.full_name || item.email,
          }),
        );
        setProfileOptions(nextProfiles);
        setProfileNames(
          Object.fromEntries(
            nextProfiles.map((item: ProfileOption) => [item.id, item.name]),
          ),
        );
      }
    } catch (error) {
      console.error("Failed to load inspection forms", error);
      toast.error("לא ניתן לטעון את טפסי הבדיקה");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeRuns = useMemo(
    () => runs.filter((run) => run.status === "in_progress"),
    [runs],
  );
  const completedRuns = useMemo(
    () => runs.filter((run) => run.status === "completed"),
    [runs],
  );
  const completedStepCount = useMemo(
    () =>
      runs.reduce(
        (sum, run) =>
          sum + run.steps.filter((step) => step.is_completed).length,
        0,
      ),
    [runs],
  );
  const folderOptions = useMemo(() => buildFolderOptions(folders), [folders]);
  const folderTemplateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const countFolder = (folderId: string, visited = new Set<string>()) => {
      if (visited.has(folderId)) return 0;
      const nextVisited = new Set(visited).add(folderId);
      const directCount = templates.filter(
        (template) => template.folder_id === folderId,
      ).length;
      const childCount = folders
        .filter((folder) => folder.parent_id === folderId)
        .reduce((sum, child) => sum + countFolder(child.id, nextVisited), 0);
      return directCount + childCount;
    };
    folders.forEach((folder) => counts.set(folder.id, countFolder(folder.id)));
    return counts;
  }, [folders, templates]);
  const visibleTemplates = useMemo(() => {
    if (selectedFolderId === "all") return templates;
    if (selectedFolderId === "unfiled") {
      return templates.filter((template) => !template.folder_id);
    }

    const descendantIds = new Set<string>([selectedFolderId]);
    let changed = true;
    while (changed) {
      changed = false;
      folders.forEach((folder) => {
        if (
          folder.parent_id &&
          descendantIds.has(folder.parent_id) &&
          !descendantIds.has(folder.id)
        ) {
          descendantIds.add(folder.id);
          changed = true;
        }
      });
    }
    return templates.filter(
      (template) => template.folder_id && descendantIds.has(template.folder_id),
    );
  }, [folders, selectedFolderId, templates]);

  const resetDraft = () => {
    setDraftName("");
    setDraftDescription("");
    setDraftIcon("clipboard-check");
    setDraftColor(colorOptions[0]);
    setDraftTemplateFolderId("unfiled");
    setDraftSteps([
      { key: crypto.randomUUID(), title: "", description: "" },
      { key: crypto.randomUUID(), title: "", description: "" },
    ]);
  };

  const openTemplateDialog = () => {
    setDraftTemplateFolderId(
      selectedFolderId !== "all" ? selectedFolderId : "unfiled",
    );
    setCreateDialogOpen(true);
  };

  const emptyTaskRow = (): DraftTaskRow => ({
    key: crypto.randomUUID(),
    title: "",
    assignedTo: user?.id ?? "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
  });

  const openTaskDialog = (run: InspectionRun) => {
    setTaskDialogRun(run);
    setDraftTaskRows([emptyTaskRow(), emptyTaskRow(), emptyTaskRow()]);
  };

  const openBulkStepsDialog = () => {
    setBulkStepsText("");
    setBulkStepsDialogOpen(true);
  };

  const addBulkStepsToDraft = () => {
    if (parsedBulkSteps.length === 0) {
      toast.error("יש להדביק לפחות שורה אחת");
      return;
    }

    setDraftSteps((steps) => [
      ...steps.filter((step) => step.title.trim() || step.description.trim()),
      ...parsedBulkSteps.map((title) => ({
        key: crypto.randomUUID(),
        title,
        description: "",
      })),
    ]);
    setBulkStepsDialogOpen(false);
    setBulkStepsText("");
    toast.success(
      parsedBulkSteps.length === 1
        ? "השלב נוסף לטופס"
        : `${parsedBulkSteps.length} שלבים נוספו לטופס`,
    );
  };

  const updateTaskRow = (
    key: string,
    field: keyof Omit<DraftTaskRow, "key">,
    value: string,
  ) => {
    setDraftTaskRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  };

  const createFormTasks = async () => {
    if (!user || !taskDialogRun) return;

    const rows = draftTaskRows
      .map((row) => ({ ...row, title: row.title.trim() }))
      .filter((row) => row.title);

    if (rows.length === 0) {
      toast.error("יש להזין לפחות משימה אחת");
      return;
    }

    setCreatingTasks(true);
    try {
      const { error } = await db.from("tasks").insert(
        rows.map((row) => ({
          title: row.title,
          status: "pending",
          priority: "medium",
          created_by: user.id,
          assigned_to: row.assignedTo || user.id,
          due_date: row.dueDate ? `${row.dueDate}T23:59:59` : null,
          inspection_run_id: taskDialogRun.id,
        })),
      );
      if (error) throw error;

      toast.success(
        rows.length === 1
          ? "המשימה נוספה לטופס"
          : `${rows.length} משימות נוספו לטופס`,
      );
      setTaskDialogRun(null);
      setDraftTaskRows([]);
      await fetchData();
    } catch (error) {
      console.error("Failed to create inspection form tasks", error);
      toast.error("לא ניתן ליצור את משימות הטופס");
    } finally {
      setCreatingTasks(false);
    }
  };

  const createTemplate = async () => {
    const cleanSteps = draftSteps
      .map((step) => ({
        ...step,
        title: step.title.trim(),
        description: step.description.trim(),
      }))
      .filter((step) => step.title);

    if (!draftName.trim()) {
      toast.error("יש להזין שם לטופס");
      return;
    }
    if (cleanSteps.length === 0) {
      toast.error("יש להוסיף לפחות שלב אחד");
      return;
    }

    setSaving(true);
    try {
      const { data: template, error: templateError } = await db
        .from("inspection_form_templates")
        .insert({
          name: draftName.trim(),
          description: draftDescription.trim() || null,
          folder_id:
            draftTemplateFolderId !== "unfiled" ? draftTemplateFolderId : null,
          icon_name: draftIcon,
          color: draftColor,
          created_by: user?.id,
        })
        .select("id")
        .single();
      if (templateError) throw templateError;

      const { error: stepsError } = await db
        .from("inspection_form_template_steps")
        .insert(
          cleanSteps.map((step, position) => ({
            template_id: template.id,
            title: step.title,
            description: step.description || null,
            position,
            is_required: true,
          })),
        );
      if (stepsError) {
        await db
          .from("inspection_form_templates")
          .delete()
          .eq("id", template.id);
        throw stepsError;
      }

      toast.success("טופס הבדיקה נוסף לספרייה");
      setCreateDialogOpen(false);
      resetDraft();
      await fetchData();
    } catch (error) {
      console.error("Failed to create inspection template", error);
      toast.error("יצירת הטופס נכשלה");
    } finally {
      setSaving(false);
    }
  };

  const startRun = async (template: InspectionTemplate) => {
    setBusyId(template.id);
    try {
      const { data, error } = await db.rpc("start_inspection_form", {
        p_template_id: template.id,
      });
      if (error) throw error;
      setActiveTab("active");
      setOpenRunIds((current) => new Set(current).add(data));
      toast.success(`הטופס „${template.name}” נפתח לבדיקה`);
      await fetchData();
    } catch (error) {
      console.error("Failed to start inspection form", error);
      toast.error("לא ניתן לפתוח את הטופס");
    } finally {
      setBusyId(null);
    }
  };

  const toggleStep = async (run: InspectionRun, step: RunStep) => {
    const firstOpenRequired = run.steps.find(
      (item) => item.is_required && !item.is_completed,
    );
    const lastCompleted = [...run.steps]
      .reverse()
      .find((item) => item.is_completed);
    const canChange = step.is_completed
      ? lastCompleted?.id === step.id
      : !step.is_required || firstOpenRequired?.id === step.id;

    if (!canChange) {
      toast.info(
        step.is_completed
          ? "כדי לחזור אחורה, בטל תחילה את השלב האחרון שסומן"
          : "יש להשלים את השלבים לפי הסדר",
      );
      return;
    }

    setBusyId(step.id);
    try {
      const { error } = await db.rpc("set_inspection_step_completion", {
        p_step_id: step.id,
        p_completed: !step.is_completed,
      });
      if (error) throw error;
      toast.success(step.is_completed ? "השלב נפתח מחדש" : "השלב סומן כהושלם");
      await fetchData();
    } catch (error) {
      console.error("Failed to update inspection step", error);
      toast.error("לא ניתן לעדכן את השלב");
    } finally {
      setBusyId(null);
    }
  };

  const togglePin = async (run: InspectionRun) => {
    setBusyId(run.id);
    try {
      const { error } = await db
        .from("inspection_form_runs")
        .update({ is_pinned: !run.is_pinned })
        .eq("id", run.id);
      if (error) throw error;
      if (!run.is_pinned) {
        setOpenRunIds((current) => new Set(current).add(run.id));
      }
      toast.success(run.is_pinned ? "הנעיצה הוסרה" : "הטופס ננעץ ונשאר פתוח");
      await fetchData();
    } catch (error) {
      console.error("Failed to pin inspection run", error);
      toast.error("לא ניתן לעדכן את הנעיצה");
    } finally {
      setBusyId(null);
    }
  };

  const archiveRun = async (run: InspectionRun) => {
    setBusyId(run.id);
    try {
      const { error } = await db
        .from("inspection_form_runs")
        .update({ status: "archived", is_pinned: false })
        .eq("id", run.id);
      if (error) throw error;
      toast.success("הטופס הועבר לארכיון");
      await fetchData();
    } catch (error) {
      console.error("Failed to archive inspection run", error);
      toast.error("לא ניתן להעביר את הטופס לארכיון");
    } finally {
      setBusyId(null);
    }
  };

  const deactivateTemplate = async (template: InspectionTemplate) => {
    setBusyId(template.id);
    try {
      const { error } = await db
        .from("inspection_form_templates")
        .update({ is_active: false })
        .eq("id", template.id);
      if (error) throw error;
      toast.success("התבנית הוסרה מהספרייה");
      await fetchData();
    } catch (error) {
      console.error("Failed to deactivate inspection template", error);
      toast.error("לא ניתן להסיר את התבנית");
    } finally {
      setBusyId(null);
    }
  };

  const openFolderDialog = (parentId: string | null = null) => {
    setFolderName("");
    setFolderParentId(parentId ?? "root");
    setFolderColor(
      parentId
        ? folders.find((folder) => folder.id === parentId)?.color ||
            colorOptions[0]
        : colorOptions[0],
    );
    setFolderDialogOpen(true);
  };

  const createFolder = async () => {
    if (!folderName.trim()) {
      toast.error("יש להזין שם לתיקייה");
      return;
    }

    setSaving(true);
    try {
      const parentId = folderParentId === "root" ? null : folderParentId;
      const { data, error } = await db
        .from("inspection_form_folders")
        .insert({
          name: folderName.trim(),
          parent_id: parentId,
          color: folderColor,
          created_by: user?.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (parentId) {
        setExpandedFolderIds((current) => new Set(current).add(parentId));
      }
      setSelectedFolderId(data.id);
      setFolderDialogOpen(false);
      toast.success("התיקייה נוצרה");
      await fetchData();
    } catch (error) {
      console.error("Failed to create inspection folder", error);
      toast.error("לא ניתן ליצור את התיקייה");
    } finally {
      setSaving(false);
    }
  };

  const moveTemplateToFolder = async (
    template: InspectionTemplate,
    folderId: string | null,
  ) => {
    setBusyId(template.id);
    try {
      const { error } = await db
        .from("inspection_form_templates")
        .update({ folder_id: folderId })
        .eq("id", template.id);
      if (error) throw error;
      toast.success(
        folderId ? "הטופס הועבר לתיקייה" : "הטופס הועבר לללא תיקייה",
      );
      await fetchData();
    } catch (error) {
      console.error("Failed to move inspection template", error);
      toast.error("לא ניתן להעביר את הטופס");
    } finally {
      setBusyId(null);
    }
  };

  const deleteFolder = async (folder: InspectionFolder) => {
    if (
      !window.confirm(
        `למחוק את התיקייה „${folder.name}”? הטפסים שבתוכה יעברו ל„ללא תיקייה”, ותיקיות המשנה יעברו לרמה הראשית.`,
      )
    ) {
      return;
    }

    setBusyId(folder.id);
    try {
      const { error } = await db
        .from("inspection_form_folders")
        .delete()
        .eq("id", folder.id);
      if (error) throw error;
      if (selectedFolderId === folder.id) setSelectedFolderId("all");
      toast.success("התיקייה נמחקה בלי למחוק את הטפסים");
      await fetchData();
    } catch (error) {
      console.error("Failed to delete inspection folder", error);
      toast.error("לא ניתן למחוק את התיקייה");
    } finally {
      setBusyId(null);
    }
  };

  const toggleRunOpen = (run: InspectionRun) => {
    if (run.is_pinned) return;
    setOpenRunIds((current) => {
      const next = new Set(current);
      if (next.has(run.id)) next.delete(run.id);
      else next.add(run.id);
      return next;
    });
  };

  if (!authLoading && !user) return null;

  return (
    <AppLayout title="בדיקת טפסים">
      <div className="space-y-6 p-4 md:p-8" dir="rtl">
        <section className="overflow-hidden rounded-3xl border-2 border-[hsl(45,80%,45%)] bg-gradient-to-l from-[hsl(220,60%,24%)] to-[hsl(214,52%,34%)] p-5 text-white shadow-xl md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[hsl(45,80%,55%)] text-[hsl(220,60%,20%)] shadow-lg">
                <ClipboardCheck className="h-8 w-8" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h1 className="text-2xl font-bold md:text-3xl">
                    מרכז בדיקת טפסים
                  </h1>
                  <Sparkles className="h-5 w-5 text-[hsl(45,85%,60%)]" />
                </div>
                <p className="max-w-2xl text-sm text-white/75 md:text-base">
                  עוברים שלב אחר שלב, מאשרים לפי הסדר ושומרים תיעוד ברור של מי
                  בדק כל פרט ומתי.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="lg"
                onClick={openTemplateDialog}
                className="h-12 rounded-xl bg-[hsl(45,80%,55%)] px-6 font-bold text-[hsl(220,60%,20%)] hover:bg-[hsl(45,85%,62%)]"
              >
                <Plus className="ml-2 h-5 w-5" />
                טופס בדיקה חדש
              </Button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "טפסים פעילים",
              value: activeRuns.length,
              icon: ListChecks,
              color: "text-blue-700 bg-blue-50",
            },
            {
              label: "טפסים נעוצים",
              value: runs.filter((run) => run.is_pinned).length,
              icon: Pin,
              color: "text-amber-700 bg-amber-50",
            },
            {
              label: "שלבים שאושרו",
              value: completedStepCount,
              icon: CheckCircle2,
              color: "text-emerald-700 bg-emerald-50",
            },
            {
              label: "תבניות זמינות",
              value: templates.length,
              icon: FileCheck2,
              color: "text-violet-700 bg-violet-50",
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              className="border-2 border-[hsl(45,80%,45%)]/60 shadow-sm"
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl",
                    stat.color,
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[hsl(220,60%,23%)]">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-[hsl(45,80%,45%)] bg-background p-1 md:w-[620px]">
            <TabsTrigger value="active" className="rounded-xl py-2.5">
              פעילים
              <Badge variant="secondary" className="mr-2">
                {activeRuns.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="library" className="rounded-xl py-2.5">
              ספריית טפסים
              <Badge variant="secondary" className="mr-2">
                {templates.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl py-2.5">
              הושלמו
              <Badge variant="secondary" className="mr-2">
                {completedRuns.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-[hsl(45,80%,45%)]" />
            </div>
          ) : (
            <>
              <TabsContent value="active" className="mt-5 space-y-4">
                {activeRuns.length === 0 ? (
                  <EmptyState
                    title="אין כרגע טפסים פעילים"
                    description="בחר תבנית מספריית הטפסים והתחל בדיקה חדשה."
                    onAction={() => setActiveTab("library")}
                    actionLabel="לספריית הטפסים"
                  />
                ) : (
                  activeRuns.map((run) => (
                    <RunCard
                      key={run.id}
                      run={run}
                      isOpen={openRunIds.has(run.id)}
                      busyId={busyId}
                      profileNames={profileNames}
                      tasks={formTasks.filter(
                        (task) => task.inspection_run_id === run.id,
                      )}
                      currentUserName={
                        profile?.full_name || user?.email || "משתמש"
                      }
                      onToggleOpen={() => toggleRunOpen(run)}
                      onTogglePin={() => togglePin(run)}
                      onToggleStep={(step) => toggleStep(run, step)}
                      onArchive={() => archiveRun(run)}
                      onAddTasks={() => openTaskDialog(run)}
                      onOpenTask={(task) => navigate(`/tasks?id=${task.id}`)}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="library" className="mt-5">
                <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <aside className="self-start rounded-2xl border-2 border-[hsl(45,80%,45%)] bg-background p-3 shadow-sm lg:sticky lg:top-4">
                    <div className="mb-3 flex items-center justify-between gap-2 px-1">
                      <div>
                        <h3 className="flex items-center gap-2 font-bold text-[hsl(220,60%,23%)]">
                          <FolderOpen className="h-5 w-5 text-[hsl(45,80%,45%)]" />
                          תיקיות
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          תיקיות ותתי־תיקיות
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 border-[hsl(45,80%,45%)]"
                        title="תיקייה חדשה"
                        onClick={() => openFolderDialog()}
                      >
                        <FolderPlus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setSelectedFolderId("all")}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-sm transition-colors",
                          selectedFolderId === "all"
                            ? "bg-[hsl(220,60%,25%)] font-semibold text-white"
                            : "hover:bg-muted",
                        )}
                      >
                        <Layers3 className="h-4 w-4" />
                        <span className="flex-1">כל הטפסים</span>
                        <Badge variant="secondary">{templates.length}</Badge>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedFolderId("unfiled")}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-sm transition-colors",
                          selectedFolderId === "unfiled"
                            ? "bg-[hsl(220,60%,25%)] font-semibold text-white"
                            : "hover:bg-muted",
                        )}
                      >
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">ללא תיקייה</span>
                        <Badge variant="secondary">
                          {
                            templates.filter((template) => !template.folder_id)
                              .length
                          }
                        </Badge>
                      </button>

                      {folders
                        .filter((folder) => !folder.parent_id)
                        .sort(
                          (a, b) =>
                            a.sort_order - b.sort_order ||
                            a.name.localeCompare(b.name, "he"),
                        )
                        .map((folder) => (
                          <FolderTreeItem
                            key={folder.id}
                            folder={folder}
                            folders={folders}
                            count={folderTemplateCounts.get(folder.id) ?? 0}
                            counts={folderTemplateCounts}
                            selectedFolderId={selectedFolderId}
                            expandedFolderIds={expandedFolderIds}
                            busyId={busyId}
                            onSelect={setSelectedFolderId}
                            onToggle={(folderId) =>
                              setExpandedFolderIds((current) => {
                                const next = new Set(current);
                                if (next.has(folderId)) next.delete(folderId);
                                else next.add(folderId);
                                return next;
                              })
                            }
                            onAddChild={openFolderDialog}
                            onDelete={deleteFolder}
                          />
                        ))}
                    </div>
                  </aside>

                  <div className="min-w-0">
                    <div className="mb-4 flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-[hsl(220,60%,23%)]">
                          <FolderOpen className="h-5 w-5 text-[hsl(45,80%,45%)]" />
                          {selectedFolderId === "all"
                            ? "כל הטפסים"
                            : selectedFolderId === "unfiled"
                              ? "ללא תיקייה"
                              : folderOptions.find(
                                  (folder) => folder.id === selectedFolderId,
                                )?.path || "תיקייה"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {visibleTemplates.length} טפסים בתצוגה
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedFolderId !== "all" &&
                          selectedFolderId !== "unfiled" && (
                            <Button
                              variant="outline"
                              onClick={() => openFolderDialog(selectedFolderId)}
                            >
                              <FolderPlus className="ml-2 h-4 w-4" />
                              תת־תיקייה
                            </Button>
                          )}
                        <Button
                          onClick={openTemplateDialog}
                          className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,20%)]"
                        >
                          <Plus className="ml-2 h-4 w-4" />
                          טופס חדש כאן
                        </Button>
                      </div>
                    </div>

                    {visibleTemplates.length === 0 ? (
                      <EmptyState
                        title="אין טפסים בתיקייה הזו"
                        description="צור טופס חדש כאן או העבר לכאן טופס קיים."
                        onAction={openTemplateDialog}
                        actionLabel="יצירת טופס"
                      />
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {visibleTemplates.map((template) => {
                          const TemplateIcon = getIcon(template.icon_name);
                          const templateFolder = folderOptions.find(
                            (folder) => folder.id === template.folder_id,
                          );
                          return (
                            <Card
                              key={template.id}
                              className="group overflow-hidden border-2 border-[hsl(45,80%,45%)] transition-all hover:-translate-y-0.5 hover:shadow-xl"
                            >
                              <div
                                className="h-1.5"
                                style={{ backgroundColor: template.color }}
                              />
                              <CardContent className="p-5">
                                <div className="mb-4 flex items-start justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div
                                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                                      style={{
                                        backgroundColor: template.color,
                                      }}
                                    >
                                      <TemplateIcon className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                      <h3 className="truncate text-lg font-bold text-[hsl(220,60%,23%)]">
                                        {template.name}
                                      </h3>
                                      <p className="text-sm text-muted-foreground">
                                        {template.steps.length} שלבים לפי הסדר
                                      </p>
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={busyId === template.id}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" dir="rtl">
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                          <FolderInput className="ml-2 h-4 w-4" />
                                          העבר לתיקייה
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent
                                          className="max-h-72 overflow-y-auto"
                                          dir="rtl"
                                        >
                                          <DropdownMenuLabel>
                                            בחר מיקום
                                          </DropdownMenuLabel>
                                          <DropdownMenuItem
                                            disabled={!template.folder_id}
                                            onClick={() =>
                                              moveTemplateToFolder(
                                                template,
                                                null,
                                              )
                                            }
                                          >
                                            <Folder className="ml-2 h-4 w-4" />
                                            ללא תיקייה
                                          </DropdownMenuItem>
                                          {folderOptions.map((folder) => (
                                            <DropdownMenuItem
                                              key={folder.id}
                                              disabled={
                                                template.folder_id === folder.id
                                              }
                                              onClick={() =>
                                                moveTemplateToFolder(
                                                  template,
                                                  folder.id,
                                                )
                                              }
                                            >
                                              <span
                                                className="ml-2 h-3 w-3 rounded-sm"
                                                style={{
                                                  backgroundColor: folder.color,
                                                }}
                                              />
                                              <span
                                                style={{
                                                  paddingRight:
                                                    folder.depth * 10,
                                                }}
                                              >
                                                {folder.path}
                                              </span>
                                            </DropdownMenuItem>
                                          ))}
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() =>
                                          deactivateTemplate(template)
                                        }
                                      >
                                        <Trash2 className="ml-2 h-4 w-4" />
                                        הסר מהספרייה
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                {templateFolder && (
                                  <Badge
                                    variant="outline"
                                    className="mb-3 max-w-full"
                                    style={{
                                      borderColor: templateFolder.color,
                                      color: templateFolder.color,
                                    }}
                                  >
                                    <Folder className="ml-1 h-3 w-3" />
                                    <span className="truncate">
                                      {templateFolder.path}
                                    </span>
                                  </Badge>
                                )}
                                {template.description && (
                                  <p className="mb-4 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                                    {template.description}
                                  </p>
                                )}
                                <div className="mb-5 space-y-2 rounded-xl bg-muted/45 p-3">
                                  {template.steps
                                    .slice(0, 3)
                                    .map((step, index) => (
                                      <div
                                        key={step.id}
                                        className="flex items-center gap-2 text-sm"
                                      >
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-bold text-[hsl(220,60%,25%)] shadow-sm">
                                          {index + 1}
                                        </span>
                                        <span className="truncate">
                                          {step.title}
                                        </span>
                                      </div>
                                    ))}
                                  {template.steps.length > 3 && (
                                    <p className="pr-7 text-xs text-muted-foreground">
                                      ועוד {template.steps.length - 3} שלבים…
                                    </p>
                                  )}
                                </div>
                                <Button
                                  className="w-full rounded-xl bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,20%)]"
                                  disabled={busyId === template.id}
                                  onClick={() => startRun(template)}
                                >
                                  {busyId === template.id ? (
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <ClipboardCheck className="ml-2 h-4 w-4" />
                                  )}
                                  התחל בדיקה
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="completed" className="mt-5 space-y-4">
                {completedRuns.length === 0 ? (
                  <EmptyState
                    title="עדיין אין טפסים שהושלמו"
                    description="טופס יופיע כאן לאחר שכל שלבי החובה יאושרו."
                  />
                ) : (
                  completedRuns.map((run) => (
                    <RunCard
                      key={run.id}
                      run={run}
                      isOpen={openRunIds.has(run.id)}
                      busyId={busyId}
                      profileNames={profileNames}
                      tasks={formTasks.filter(
                        (task) => task.inspection_run_id === run.id,
                      )}
                      currentUserName={
                        profile?.full_name || user?.email || "משתמש"
                      }
                      onToggleOpen={() => toggleRunOpen(run)}
                      onTogglePin={() => togglePin(run)}
                      onToggleStep={(step) => toggleStep(run, step)}
                      onArchive={() => archiveRun(run)}
                      onAddTasks={() => openTaskDialog(run)}
                      onOpenTask={(task) => navigate(`/tasks?id=${task.id}`)}
                    />
                  ))
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent
          dir="rtl"
          className="max-h-[92vh] max-w-3xl overflow-y-auto border-2 border-[hsl(45,80%,45%)]"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(220,60%,25%)] text-[hsl(45,80%,55%)]">
                <Plus className="h-5 w-5" />
              </span>
              יצירת טופס בדיקה חדש
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inspection-name">שם הטופס</Label>
                <Input
                  id="inspection-name"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="לדוגמה: טופס תנאי סף"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>איקון הטופס</Label>
                <div className="grid grid-cols-4 gap-2">
                  {iconOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-11 px-2",
                        draftIcon === option.value &&
                          "border-[hsl(45,80%,45%)] bg-[hsl(45,100%,94%)] text-[hsl(220,60%,25%)] ring-1 ring-[hsl(45,80%,45%)]",
                      )}
                      title={option.label}
                      onClick={() => setDraftIcon(option.value)}
                    >
                      <option.icon className="h-5 w-5" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>שמירה בתיקייה</Label>
              <Select
                value={draftTemplateFolderId}
                onValueChange={setDraftTemplateFolderId}
              >
                <SelectTrigger className="h-11 text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl" className="max-h-72">
                  <SelectItem value="unfiled">ללא תיקייה</SelectItem>
                  {folderOptions.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <span style={{ paddingRight: folder.depth * 12 }}>
                        {folder.path}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspection-description">תיאור קצר</Label>
              <Textarea
                id="inspection-description"
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                placeholder="מה בודקים ולמה חשוב לבצע לפי הסדר?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>צבע מזהה</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`בחירת צבע ${color}`}
                    className={cn(
                      "h-9 w-9 rounded-full border-4 border-background shadow-md transition-transform hover:scale-110",
                      draftColor === color &&
                        "ring-2 ring-[hsl(220,60%,25%)] ring-offset-2",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setDraftColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">שלבי הבדיקה</Label>
                  <p className="text-xs text-muted-foreground">
                    העובדים יוכלו לסמן כל שלב רק לאחר שהקודם הושלם.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[hsl(45,80%,45%)]"
                    onClick={openBulkStepsDialog}
                  >
                    <Layers3 className="ml-1 h-4 w-4" />
                    הוסף שלבים
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[hsl(45,80%,45%)]"
                    onClick={() =>
                      setDraftSteps((steps) => [
                        ...steps,
                        {
                          key: crypto.randomUUID(),
                          title: "",
                          description: "",
                        },
                      ])
                    }
                  >
                    <Plus className="ml-1 h-4 w-4" />
                    הוסף שלב
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {draftSteps.map((step, index) => (
                  <div
                    key={step.key}
                    className="grid gap-2 rounded-2xl border bg-muted/35 p-3 md:grid-cols-[40px_1fr_1fr_36px] md:items-center"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(220,60%,25%)] text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <Input
                      value={step.title}
                      onChange={(event) =>
                        setDraftSteps((steps) =>
                          steps.map((item) =>
                            item.key === step.key
                              ? { ...item, title: event.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="שם השלב"
                    />
                    <Input
                      value={step.description}
                      onChange={(event) =>
                        setDraftSteps((steps) =>
                          steps.map((item) =>
                            item.key === step.key
                              ? { ...item, description: event.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="הנחיה קצרה (לא חובה)"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={draftSteps.length === 1}
                      onClick={() =>
                        setDraftSteps((steps) =>
                          steps.filter((item) => item.key !== step.key),
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              onClick={createTemplate}
              disabled={saving}
              className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,20%)]"
            >
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              שמור בספריית הטפסים
            </Button>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={folderDialogOpen}
        onOpenChange={(open) => {
          if (!saving) setFolderDialogOpen(open);
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-w-lg border-2 border-[hsl(45,80%,45%)]"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(45,100%,93%)] text-[hsl(45,80%,38%)]">
                <FolderPlus className="h-5 w-5" />
              </span>
              תיקייה חדשה
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-3">
            <div className="space-y-2">
              <Label htmlFor="inspection-folder-name">שם התיקייה</Label>
              <Input
                id="inspection-folder-name"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                placeholder="לדוגמה: היתרי בנייה"
                className="h-11"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter") createFolder();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>מיקום התיקייה</Label>
              <Select value={folderParentId} onValueChange={setFolderParentId}>
                <SelectTrigger className="h-11 text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl" className="max-h-72">
                  <SelectItem value="root">רמה ראשית</SelectItem>
                  {folderOptions.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <span style={{ paddingRight: folder.depth * 12 }}>
                        {folder.path}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                בחירת תיקייה קיימת תיצור בתוכה תת־תיקייה.
              </p>
            </div>

            <div className="space-y-2">
              <Label>צבע לזיהוי מהיר</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`בחר צבע ${color}`}
                    onClick={() => setFolderColor(color)}
                    className={cn(
                      "h-9 w-9 rounded-xl border-2 transition-transform hover:scale-105",
                      folderColor === color
                        ? "border-[hsl(220,60%,20%)] ring-2 ring-[hsl(45,80%,55%)] ring-offset-2"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              onClick={createFolder}
              disabled={saving || !folderName.trim()}
              className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,20%)]"
            >
              {saving ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <FolderPlus className="ml-2 h-4 w-4" />
              )}
              צור תיקייה
            </Button>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setFolderDialogOpen(false)}
            >
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkStepsDialogOpen}
        onOpenChange={(open) => {
          setBulkStepsDialogOpen(open);
          if (!open) setBulkStepsText("");
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-h-[92vh] max-w-3xl overflow-hidden border-2 border-[hsl(45,80%,45%)] p-0"
        >
          <DialogHeader className="border-b bg-gradient-to-l from-[hsl(220,60%,24%)] to-[hsl(214,52%,34%)] px-6 py-5 text-white">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(45,80%,55%)] text-[hsl(220,60%,20%)]">
                <Layers3 className="h-5 w-5" />
              </span>
              הוספת מספר שלבים
            </DialogTitle>
            <p className="pr-[52px] text-sm text-white/70">
              העתק רשימה מ־Word והדבק כאן. כל שורה תהפוך לשלב נפרד.
            </p>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="bulk-inspection-steps" className="text-base">
                  הדבק את רשימת השלבים
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  מספור ותבליטים רגילים מ־Word יוסרו אוטומטית. שורות ריקות
                  ידולגו.
                </p>
              </div>
              <Badge
                variant="secondary"
                className="shrink-0 rounded-full px-3 py-1.5 text-sm"
              >
                {parsedBulkSteps.length} שלבים
              </Badge>
            </div>

            <Textarea
              id="bulk-inspection-steps"
              value={bulkStepsText}
              onChange={(event) => setBulkStepsText(event.target.value)}
              placeholder={
                "בדיקת פרטי הלקוח\nאימות המסמכים שהתקבלו\nבדיקת חתימות\nאישור סופי"
              }
              className="min-h-[330px] resize-y rounded-2xl border-2 bg-background p-4 text-base leading-8 focus-visible:border-[hsl(45,80%,45%)]"
              autoFocus
            />

            {parsedBulkSteps.length > 0 && (
              <p className="rounded-xl bg-[hsl(45,90%,94%)] px-4 py-3 text-sm text-[hsl(220,60%,25%)]">
                לאחר ההוספה כל שלב יופיע ברשימה הראשית, ושם ניתן להוסיף לידו
                הנחיה קצרה.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-start">
            <Button
              type="button"
              onClick={addBulkStepsToDraft}
              disabled={parsedBulkSteps.length === 0}
              className="min-w-40 bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,20%)]"
            >
              <Layers3 className="ml-2 h-4 w-4" />
              {parsedBulkSteps.length > 0
                ? `צור ${parsedBulkSteps.length} שלבים`
                : "צור שלבים"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkStepsDialogOpen(false)}
            >
              ביטול
            </Button>
            <span className="self-center text-xs text-muted-foreground">
              אפשר להדביק גם עשרות שורות בפעולה אחת
            </span>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(taskDialogRun)}
        onOpenChange={(open) => {
          if (!open && !creatingTasks) {
            setTaskDialogRun(null);
            setDraftTaskRows([]);
          }
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-h-[92vh] max-w-5xl overflow-hidden border-2 border-[hsl(45,80%,45%)] p-0"
        >
          <DialogHeader className="border-b bg-gradient-to-l from-[hsl(220,60%,24%)] to-[hsl(214,52%,34%)] px-6 py-5 text-white">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(45,80%,55%)] text-[hsl(220,60%,20%)]">
                <CheckSquare2 className="h-5 w-5" />
              </span>
              <span>
                הוספת משימות
                {taskDialogRun && (
                  <span className="mr-2 text-sm font-normal text-white/70">
                    לטופס „{taskDialogRun.template_name}”
                  </span>
                )}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[62vh] space-y-3 overflow-y-auto px-5 py-5 md:px-6">
            <div className="hidden grid-cols-[minmax(0,1fr)_220px_170px_40px] gap-3 px-2 text-xs font-medium text-muted-foreground md:grid">
              <span>שם המשימה</span>
              <span>עובד אחראי</span>
              <span>תאריך יעד</span>
              <span />
            </div>

            {draftTaskRows.map((row, index) => (
              <div
                key={row.key}
                className="grid gap-3 rounded-2xl border bg-muted/25 p-3 md:grid-cols-[minmax(0,1fr)_220px_170px_40px] md:items-center"
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`inspection-task-${row.key}`}
                    className="text-xs md:hidden"
                  >
                    משימה {index + 1}
                  </Label>
                  <Input
                    id={`inspection-task-${row.key}`}
                    value={row.title}
                    onChange={(event) =>
                      updateTaskRow(row.key, "title", event.target.value)
                    }
                    placeholder={`שם משימה ${index + 1}`}
                    className="h-11 bg-background"
                    autoFocus={index === 0}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs md:hidden">עובד אחראי</Label>
                  <Select
                    value={row.assignedTo}
                    onValueChange={(value) =>
                      updateTaskRow(row.key, "assignedTo", value)
                    }
                  >
                    <SelectTrigger className="h-11 bg-background text-right">
                      <SelectValue placeholder="בחר עובד" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {profileOptions.map((profileOption) => (
                        <SelectItem
                          key={profileOption.id}
                          value={profileOption.id}
                        >
                          {profileOption.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs md:hidden">תאריך יעד</Label>
                  <Input
                    type="date"
                    value={row.dueDate}
                    onChange={(event) =>
                      updateTaskRow(row.key, "dueDate", event.target.value)
                    }
                    className="h-11 bg-background"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="הסר שורה"
                  disabled={draftTaskRows.length === 1}
                  onClick={() =>
                    setDraftTaskRows((rows) =>
                      rows.filter((item) => item.key !== row.key),
                    )
                  }
                  className="h-10 w-10 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl border-dashed border-[hsl(45,80%,45%)]"
              onClick={() =>
                setDraftTaskRows((rows) => [...rows, emptyTaskRow()])
              }
            >
              <Plus className="ml-2 h-4 w-4" />
              הוסף שורה נוספת
            </Button>
          </div>

          <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-start">
            <Button
              onClick={createFormTasks}
              disabled={
                creatingTasks ||
                !draftTaskRows.some((row) => row.title.trim().length > 0)
              }
              className="min-w-40 bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,20%)]"
            >
              {creatingTasks ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckSquare2 className="ml-2 h-4 w-4" />
              )}
              צור את כל המשימות
            </Button>
            <Button
              variant="outline"
              disabled={creatingTasks}
              onClick={() => {
                setTaskDialogRun(null);
                setDraftTaskRows([]);
              }}
            >
              ביטול
            </Button>
            <span className="self-center text-xs text-muted-foreground">
              שורות ריקות לא יישמרו
            </span>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function FolderTreeItem({
  folder,
  folders,
  count,
  counts,
  selectedFolderId,
  expandedFolderIds,
  busyId,
  depth = 0,
  onSelect,
  onToggle,
  onAddChild,
  onDelete,
}: {
  folder: InspectionFolder;
  folders: InspectionFolder[];
  count: number;
  counts: Map<string, number>;
  selectedFolderId: string;
  expandedFolderIds: Set<string>;
  busyId: string | null;
  depth?: number;
  onSelect: (folderId: string) => void;
  onToggle: (folderId: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (folder: InspectionFolder) => void;
}) {
  const children = folders
    .filter((item) => item.parent_id === folder.id)
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order || a.name.localeCompare(b.name, "he"),
    );
  const expanded = expandedFolderIds.has(folder.id);
  const selected = selectedFolderId === folder.id;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-xl transition-colors",
          selected
            ? "bg-[hsl(45,100%,93%)] text-[hsl(220,60%,23%)]"
            : "hover:bg-muted",
        )}
        style={{ paddingRight: depth * 14 }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-7 shrink-0",
            children.length === 0 && "invisible",
          )}
          title={expanded ? "כווץ תיקייה" : "פתח תיקייה"}
          onClick={() => onToggle(folder.id)}
        >
          <ChevronLeft
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              expanded && "-rotate-90",
            )}
          />
        </Button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 py-2 text-right text-sm"
          onClick={() => {
            onSelect(folder.id);
            if (children.length > 0 && !expanded) onToggle(folder.id);
          }}
        >
          {expanded ? (
            <FolderOpen
              className="h-4 w-4 shrink-0"
              style={{ color: folder.color }}
            />
          ) : (
            <Folder
              className="h-4 w-4 shrink-0"
              style={{ color: folder.color }}
            />
          )}
          <span className="truncate font-medium">{folder.name}</span>
          <Badge variant="secondary" className="mr-auto shrink-0">
            {count}
          </Badge>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-7 shrink-0 opacity-60 group-hover:opacity-100"
              disabled={busyId === folder.id}
              title="אפשרויות תיקייה"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" dir="rtl">
            <DropdownMenuItem onClick={() => onAddChild(folder.id)}>
              <FolderPlus className="ml-2 h-4 w-4" />
              הוסף תת־תיקייה
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(folder)}
            >
              <Trash2 className="ml-2 h-4 w-4" />
              מחק תיקייה
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded &&
        children.map((child) => (
          <FolderTreeItem
            key={child.id}
            folder={child}
            folders={folders}
            count={counts.get(child.id) ?? 0}
            counts={counts}
            selectedFolderId={selectedFolderId}
            expandedFolderIds={expandedFolderIds}
            busyId={busyId}
            depth={depth + 1}
            onSelect={onSelect}
            onToggle={onToggle}
            onAddChild={onAddChild}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

function RunCard({
  run,
  isOpen,
  busyId,
  profileNames,
  tasks,
  currentUserName,
  onToggleOpen,
  onTogglePin,
  onToggleStep,
  onArchive,
  onAddTasks,
  onOpenTask,
}: {
  run: InspectionRun;
  isOpen: boolean;
  busyId: string | null;
  profileNames: Record<string, string>;
  tasks: FormTask[];
  currentUserName: string;
  onToggleOpen: () => void;
  onTogglePin: () => void;
  onToggleStep: (step: RunStep) => void;
  onArchive: () => void;
  onAddTasks: () => void;
  onOpenTask: (task: FormTask) => void;
}) {
  const RunIcon = getIcon(run.icon_name);
  const completedCount = run.steps.filter((step) => step.is_completed).length;
  const progress =
    run.steps.length > 0
      ? Math.round((completedCount / run.steps.length) * 100)
      : 0;
  const firstOpenRequired = run.steps.find(
    (step) => step.is_required && !step.is_completed,
  );
  const lastCompleted = [...run.steps]
    .reverse()
    .find((step) => step.is_completed);
  const expanded = isOpen || run.is_pinned;

  return (
    <Card
      className={cn(
        "overflow-hidden border-2 transition-all",
        run.is_pinned
          ? "border-[hsl(45,80%,45%)] shadow-[0_12px_35px_rgba(30,58,95,0.15)]"
          : "border-border hover:border-[hsl(45,80%,45%)]/70",
      )}
    >
      <div className="flex items-center gap-2 p-3 md:gap-3 md:p-4">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-right"
          onClick={onToggleOpen}
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
            style={{ backgroundColor: run.color }}
          >
            <RunIcon className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate text-lg font-bold text-[hsl(220,60%,23%)]">
                {run.template_name}
              </span>
              {run.is_pinned && (
                <Badge className="bg-[hsl(45,80%,55%)] text-[hsl(220,60%,20%)]">
                  <Pin className="ml-1 h-3 w-3" />
                  נעוץ
                </Badge>
              )}
              {run.status === "completed" && (
                <Badge className="bg-emerald-600 text-white">
                  <CheckCircle2 className="ml-1 h-3 w-3" />
                  הושלם
                </Badge>
              )}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              נפתח{" "}
              {format(new Date(run.started_at), "d בMMMM yyyy, HH:mm", {
                locale: he,
              })}
            </span>
          </span>
          <span className="hidden min-w-[190px] items-center gap-3 md:flex">
            <Progress value={progress} className="h-2" />
            <span className="w-12 text-left text-sm font-bold text-[hsl(220,60%,25%)]">
              {progress}%
            </span>
          </span>
        </button>

        <Button
          type="button"
          size="sm"
          onClick={onAddTasks}
          className="h-10 shrink-0 bg-[hsl(220,60%,25%)] px-3 hover:bg-[hsl(220,60%,20%)]"
          title="הוסף מספר משימות לטופס"
        >
          <Plus className="h-4 w-4 md:ml-1" />
          <span className="hidden md:inline">הוסף משימות</span>
        </Button>

        <button
          type="button"
          aria-label={expanded ? "כווץ טופס" : "פתח טופס"}
          onClick={onToggleOpen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="border-t bg-gradient-to-b from-muted/30 to-background px-4 pb-5 pt-4 md:px-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">
                  {completedCount} מתוך {run.steps.length} שלבים הושלמו
                </span>
                <span className="font-bold text-[hsl(220,60%,25%)]">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-2.5" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "border-[hsl(45,80%,45%)]",
                  run.is_pinned && "bg-[hsl(45,100%,94%)]",
                )}
                disabled={busyId === run.id}
                onClick={onTogglePin}
              >
                {run.is_pinned ? (
                  <PinOff className="ml-1 h-4 w-4" />
                ) : (
                  <Pin className="ml-1 h-4 w-4" />
                )}
                {run.is_pinned ? "הסר נעיצה" : "נעץ פתוח"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                disabled={busyId === run.id}
                onClick={onArchive}
              >
                <Archive className="ml-1 h-4 w-4" />
                ארכיון
              </Button>
            </div>
          </div>

          {run.description && (
            <p className="mb-4 rounded-xl border bg-background p-3 text-sm text-muted-foreground">
              {run.description}
            </p>
          )}

          <div className="relative space-y-2">
            <div className="absolute bottom-5 right-[21px] top-5 w-0.5 bg-border" />
            {run.steps.map((step, index) => {
              const isCurrent = firstOpenRequired?.id === step.id;
              const canReopen =
                step.is_completed && lastCompleted?.id === step.id;
              const locked =
                !step.is_completed && step.is_required && !isCurrent;
              const actor = step.completed_by
                ? profileNames[step.completed_by] || "עובד"
                : currentUserName;

              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={locked || busyId === step.id}
                  onClick={() => onToggleStep(step)}
                  className={cn(
                    "relative z-10 flex w-full items-start gap-3 rounded-2xl border p-3 text-right transition-all md:p-4",
                    step.is_completed &&
                      "border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100/80",
                    isCurrent &&
                      "border-[hsl(45,80%,45%)] bg-[hsl(45,100%,96%)] shadow-sm",
                    locked && "cursor-not-allowed bg-muted/40 opacity-65",
                    canReopen && "hover:border-amber-400",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-background",
                      step.is_completed &&
                        "border-emerald-500 bg-emerald-500 text-white",
                      isCurrent &&
                        "border-[hsl(45,80%,45%)] text-[hsl(45,80%,38%)]",
                    )}
                  >
                    {busyId === step.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : step.is_completed ? (
                      <Check className="h-5 w-5" />
                    ) : locked ? (
                      <LockKeyhole className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "font-semibold",
                          step.is_completed && "text-emerald-800",
                        )}
                      >
                        {index + 1}. {step.title}
                      </span>
                      {isCurrent && (
                        <Badge
                          variant="outline"
                          className="border-[hsl(45,80%,45%)] text-[hsl(45,80%,35%)]"
                        >
                          השלב הבא
                        </Badge>
                      )}
                    </span>
                    {step.description && (
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {step.description}
                      </span>
                    )}
                    {step.is_completed && step.completed_at && (
                      <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-emerald-700">
                        <Users className="h-3.5 w-3.5" />
                        אושר על ידי {actor}
                        <span aria-hidden="true">•</span>
                        {format(
                          new Date(step.completed_at),
                          "d בMMMM yyyy, HH:mm",
                          { locale: he },
                        )}
                        {canReopen && (
                          <span className="flex items-center gap-1 text-amber-700">
                            <RotateCcw className="h-3 w-3" />
                            ניתן לפתוח מחדש
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border bg-background p-3 md:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(45,100%,93%)] text-[hsl(45,80%,38%)]">
                  <CheckSquare2 className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="font-bold text-[hsl(220,60%,23%)]">
                    משימות הטופס
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {tasks.length
                      ? `${tasks.filter((task) => task.status === "completed").length} מתוך ${tasks.length} הושלמו`
                      : "עדיין לא נוספו משימות"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[hsl(45,80%,45%)]"
                onClick={onAddTasks}
              >
                <Plus className="ml-1 h-4 w-4" />
                הוסף
              </Button>
            </div>

            {tasks.length > 0 && (
              <div className="grid gap-2 lg:grid-cols-2">
                {tasks.map((task) => {
                  const completed = task.status === "completed";
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onOpenTask(task)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 text-right transition-colors hover:border-[hsl(45,80%,45%)] hover:bg-[hsl(45,100%,97%)]",
                        completed && "bg-emerald-50/60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                          completed
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "bg-background text-muted-foreground",
                        )}
                      >
                        {completed ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-semibold",
                            completed &&
                              "text-emerald-800 line-through decoration-emerald-500",
                          )}
                        >
                          {task.title}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <UserRound className="h-3 w-3" />
                            {task.assigned_to
                              ? profileNames[task.assigned_to] || "עובד"
                              : "ללא שיוך"}
                          </span>
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(new Date(task.due_date), "dd/MM/yyyy")}
                            </span>
                          )}
                        </span>
                      </span>
                      <Badge
                        variant={completed ? "default" : "secondary"}
                        className={cn(
                          "shrink-0",
                          completed && "bg-emerald-600",
                        )}
                      >
                        {completed ? "הושלמה" : "פתוחה"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[hsl(45,80%,45%)]/60 bg-muted/20 p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(45,100%,93%)] text-[hsl(45,80%,38%)]">
        <ClipboardCheck className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-[hsl(220,60%,23%)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          className="mt-5 bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,20%)]"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
