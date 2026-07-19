import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SmartDateTimePicker } from "@/components/ui/SmartDateTimePicker";
import { useDialogTheme, DialogThemeSwitcher } from "@/components/shared/DialogThemeSwitcher";
import {
  Phone,
  FolderOpen,
  Send,
  MapPin,
  Plus,
  Hash,
  Loader2,
  Bell,
  Pencil,
  Trash2,
  ListPlus,
  X,
  Maximize2,
  CheckCircle2,
  GripVertical,
  LayoutList,
  Table2,
  Settings2,
  ChevronUp,
  ChevronDown,
  Save,
  Copy,
  Layers,
  BookTemplate,
  Eye,
  EyeOff,
  Clipboard,
  ListChecks,
  ClipboardPaste,
  Palette,
  Type,
  Bold,
  Timer,
  Play,
  Square,
  CalendarIcon,
  Link2,
  UserRound,
  Building2,
  Check,
  RotateCcw,
  LayoutGrid,
  List,
  Table,
  Wallet,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TaskTitleWithConsultants } from "@/components/consultants/TaskTitleWithConsultants";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { DayCounterCell } from "@/components/tables/DayCounterCell";
import { cn } from "@/lib/utils";
import {
  useClientStages,
  ClientStage,
  ClientStageTask,
} from "@/hooks/useClientStages";
import { AddReminderDialog } from "@/components/reminders/AddReminderDialog";
import {
  StageTaskActionsPopup,
  StageTaskIndicator,
} from "./StageTaskActionsPopup";
import { StageTimerDisplay, TaskTimerBadge } from "./StageTimerDisplay";
import {
  SaveAsTemplateDialog,
  SaveAllStagesDialog,
  ApplyTemplateDialog,
  CopyStagesDialog,
} from "./StageTemplateDialogs";
import { useClientFolders } from "@/hooks/useClientFolders";
import { TaskPaymentBadge } from "./TaskPaymentBadge";
import { Folder, FolderPlus, ChevronRight, ChevronLeft } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface ClientStagesBoardProps {
  clientId: string;
  viewMode?: "board" | "list" | "table";
  onViewModeChange?: (mode: "board" | "list" | "table") => void;
  linkedProjectTemplateId?: string | null;
}

// Icon mapping
const iconMap: Record<
  string,
  React.ComponentType<{
    className?: string;
  }>
> = {
  Phone: Phone,
  FolderOpen: FolderOpen,
  Send: Send,
  MapPin: MapPin,
};
const iconOptions = [
  {
    value: "Phone",
    icon: Phone,
    label: "טלפון",
  },
  {
    value: "FolderOpen",
    icon: FolderOpen,
    label: "תיקיה",
  },
  {
    value: "Send",
    icon: Send,
    label: "שליחה",
  },
  {
    value: "MapPin",
    icon: MapPin,
    label: "מיקום",
  },
];

// Predefined colors for background and text
const BACKGROUND_COLORS = [
  {
    value: null,
    label: "ללא",
    color: "transparent",
  },
  {
    value: "#fef3c7",
    label: "צהוב",
    color: "#fef3c7",
  },
  {
    value: "#dcfce7",
    label: "ירוק",
    color: "#dcfce7",
  },
  {
    value: "#dbeafe",
    label: "כחול",
    color: "#dbeafe",
  },
  {
    value: "#fce7f3",
    label: "ורוד",
    color: "#fce7f3",
  },
  {
    value: "#fed7aa",
    label: "כתום",
    color: "#fed7aa",
  },
  {
    value: "#e9d5ff",
    label: "סגול",
    color: "#e9d5ff",
  },
  {
    value: "#fecaca",
    label: "אדום",
    color: "#fecaca",
  },
  {
    value: "#d1d5db",
    label: "אפור",
    color: "#d1d5db",
  },
];
const TEXT_COLORS = [
  {
    value: null,
    label: "רגיל",
    color: "inherit",
  },
  {
    value: "#dc2626",
    label: "אדום",
    color: "#dc2626",
  },
  {
    value: "#16a34a",
    label: "ירוק",
    color: "#16a34a",
  },
  {
    value: "#2563eb",
    label: "כחול",
    color: "#2563eb",
  },
  {
    value: "#d97706",
    label: "כתום",
    color: "#d97706",
  },
  {
    value: "#9333ea",
    label: "סגול",
    color: "#9333ea",
  },
  {
    value: "#0891b2",
    label: "טורקיז",
    color: "#0891b2",
  },
];

// Predefined target days for common task types
const TARGET_DAYS_OPTIONS = [
  {
    value: 7,
    label: "7 ימי עבודה",
  },
  {
    value: 14,
    label: "14 ימי עבודה",
  },
  {
    value: 21,
    label: "21 ימי עבודה",
  },
  {
    value: 30,
    label: "30 ימי עבודה",
  },
  {
    value: 45,
    label: "45 ימי עבודה (בקרה מרחבית)",
  },
  {
    value: 60,
    label: "60 ימי עבודה",
  },
  {
    value: 90,
    label: "90 ימי עבודה",
  },
];

const TIMER_TAB_PRESET_COUNT = 6;
const TIMER_TAB_PRESET_DEFAULTS = [7, 14, 21, 30, 45, 60];

const normalizeTimerTabDayPresets = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [...TIMER_TAB_PRESET_DEFAULTS];

  const parsed = value
    .map((item) => Number.parseInt(String(item), 10))
    .filter((days) => Number.isFinite(days) && days > 0 && days <= 365);

  const normalized: number[] = [];
  parsed.forEach((days) => {
    if (!normalized.includes(days)) normalized.push(days);
  });

  TIMER_TAB_PRESET_DEFAULTS.forEach((fallback) => {
    if (
      normalized.length < TIMER_TAB_PRESET_COUNT &&
      !normalized.includes(fallback)
    ) {
      normalized.push(fallback);
    }
  });

  return normalized.slice(0, TIMER_TAB_PRESET_COUNT);
};

interface StageBoardTheme {
  id: string;
  name: string;
  borderColor: string;
  cardBackgroundColor: string;
  headerFromColor: string;
  headerToColor: string;
  headerTextColor: string;
  iconBackgroundColor: string;
  iconColor: string;
  progressTrackColor: string;
  progressColor: string;
  badgeBackgroundColor: string;
  badgeTextColor: string;
  activeBorderColor: string;
  activeCardBackgroundColor: string;
  activeHeaderFromColor: string;
  activeHeaderToColor: string;
  activeHeaderTextColor: string;
  activeProgressColor: string;
  activeBadgeBackgroundColor: string;
  activeBadgeTextColor: string;
  activeGlowColor: string;
}

const STAGE_THEME_PRESETS: StageBoardTheme[] = [
  {
    id: "classic-gold",
    name: "זהב קלאסי",
    borderColor: "#d4a843",
    cardBackgroundColor: "#fffdf6",
    headerFromColor: "#f5d25f",
    headerToColor: "#d9a623",
    headerTextColor: "#1f2937",
    iconBackgroundColor: "#fff4cc",
    iconColor: "#a16207",
    progressTrackColor: "#f3e8c4",
    progressColor: "#d4a843",
    badgeBackgroundColor: "#fff0bf",
    badgeTextColor: "#7c5600",
    activeBorderColor: "#a16207",
    activeCardBackgroundColor: "#fffbeb",
    activeHeaderFromColor: "#a16207",
    activeHeaderToColor: "#d4a843",
    activeHeaderTextColor: "#f8fafc",
    activeProgressColor: "#f59e0b",
    activeBadgeBackgroundColor: "#fcd34d",
    activeBadgeTextColor: "#1f2937",
    activeGlowColor: "#f59e0b",
  },
  {
    id: "deep-ocean",
    name: "אוקיינוס עמוק",
    borderColor: "#1d4ed8",
    cardBackgroundColor: "#f4f8ff",
    headerFromColor: "#1e40af",
    headerToColor: "#2563eb",
    headerTextColor: "#eff6ff",
    iconBackgroundColor: "#dbeafe",
    iconColor: "#1e3a8a",
    progressTrackColor: "#bfdbfe",
    progressColor: "#1d4ed8",
    badgeBackgroundColor: "#dbeafe",
    badgeTextColor: "#1e3a8a",
    activeBorderColor: "#1e3a8a",
    activeCardBackgroundColor: "#e8f1ff",
    activeHeaderFromColor: "#1e3a8a",
    activeHeaderToColor: "#2563eb",
    activeHeaderTextColor: "#eff6ff",
    activeProgressColor: "#2563eb",
    activeBadgeBackgroundColor: "#93c5fd",
    activeBadgeTextColor: "#1e3a8a",
    activeGlowColor: "#3b82f6",
  },
  {
    id: "emerald-flow",
    name: "אמרלד מודרני",
    borderColor: "#059669",
    cardBackgroundColor: "#f2fcf8",
    headerFromColor: "#047857",
    headerToColor: "#10b981",
    headerTextColor: "#ecfdf5",
    iconBackgroundColor: "#d1fae5",
    iconColor: "#065f46",
    progressTrackColor: "#a7f3d0",
    progressColor: "#059669",
    badgeBackgroundColor: "#d1fae5",
    badgeTextColor: "#065f46",
    activeBorderColor: "#065f46",
    activeCardBackgroundColor: "#dcfce7",
    activeHeaderFromColor: "#065f46",
    activeHeaderToColor: "#10b981",
    activeHeaderTextColor: "#ecfdf5",
    activeProgressColor: "#10b981",
    activeBadgeBackgroundColor: "#6ee7b7",
    activeBadgeTextColor: "#064e3b",
    activeGlowColor: "#10b981",
  },
];

const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);

const sanitizeStageTheme = (
  candidate: Partial<StageBoardTheme>,
  fallback: StageBoardTheme,
  fallbackId: string,
  fallbackName: string,
): StageBoardTheme => ({
  id:
    typeof candidate.id === "string" && candidate.id.trim()
      ? candidate.id.trim()
      : fallbackId,
  name:
    typeof candidate.name === "string" && candidate.name.trim()
      ? candidate.name.trim()
      : fallbackName,
  borderColor: isHexColor(candidate.borderColor)
    ? candidate.borderColor
    : fallback.borderColor,
  cardBackgroundColor: isHexColor(candidate.cardBackgroundColor)
    ? candidate.cardBackgroundColor
    : fallback.cardBackgroundColor,
  headerFromColor: isHexColor(candidate.headerFromColor)
    ? candidate.headerFromColor
    : fallback.headerFromColor,
  headerToColor: isHexColor(candidate.headerToColor)
    ? candidate.headerToColor
    : fallback.headerToColor,
  headerTextColor: isHexColor(candidate.headerTextColor)
    ? candidate.headerTextColor
    : fallback.headerTextColor,
  iconBackgroundColor: isHexColor(candidate.iconBackgroundColor)
    ? candidate.iconBackgroundColor
    : fallback.iconBackgroundColor,
  iconColor: isHexColor(candidate.iconColor)
    ? candidate.iconColor
    : fallback.iconColor,
  progressTrackColor: isHexColor(candidate.progressTrackColor)
    ? candidate.progressTrackColor
    : fallback.progressTrackColor,
  progressColor: isHexColor(candidate.progressColor)
    ? candidate.progressColor
    : fallback.progressColor,
  badgeBackgroundColor: isHexColor(candidate.badgeBackgroundColor)
    ? candidate.badgeBackgroundColor
    : fallback.badgeBackgroundColor,
  badgeTextColor: isHexColor(candidate.badgeTextColor)
    ? candidate.badgeTextColor
    : fallback.badgeTextColor,
  activeBorderColor: isHexColor(candidate.activeBorderColor)
    ? candidate.activeBorderColor
    : fallback.activeBorderColor,
  activeCardBackgroundColor: isHexColor(candidate.activeCardBackgroundColor)
    ? candidate.activeCardBackgroundColor
    : fallback.activeCardBackgroundColor,
  activeHeaderFromColor: isHexColor(candidate.activeHeaderFromColor)
    ? candidate.activeHeaderFromColor
    : fallback.activeHeaderFromColor,
  activeHeaderToColor: isHexColor(candidate.activeHeaderToColor)
    ? candidate.activeHeaderToColor
    : fallback.activeHeaderToColor,
  activeHeaderTextColor: isHexColor(candidate.activeHeaderTextColor)
    ? candidate.activeHeaderTextColor
    : fallback.activeHeaderTextColor,
  activeProgressColor: isHexColor(candidate.activeProgressColor)
    ? candidate.activeProgressColor
    : fallback.activeProgressColor,
  activeBadgeBackgroundColor: isHexColor(candidate.activeBadgeBackgroundColor)
    ? candidate.activeBadgeBackgroundColor
    : fallback.activeBadgeBackgroundColor,
  activeBadgeTextColor: isHexColor(candidate.activeBadgeTextColor)
    ? candidate.activeBadgeTextColor
    : fallback.activeBadgeTextColor,
  activeGlowColor: isHexColor(candidate.activeGlowColor)
    ? candidate.activeGlowColor
    : fallback.activeGlowColor,
});

const normalizeStageThemes = (value: unknown): StageBoardTheme[] => {
  const fallbackList = STAGE_THEME_PRESETS.map((theme) => ({ ...theme }));
  if (!Array.isArray(value)) return fallbackList;

  const mapped = value
    .map((item, index) => {
      const fallback =
        STAGE_THEME_PRESETS[index % STAGE_THEME_PRESETS.length] ||
        STAGE_THEME_PRESETS[0];
      const source =
        item && typeof item === "object"
          ? (item as Partial<StageBoardTheme>)
          : {};

      return sanitizeStageTheme(
        source,
        fallback,
        typeof source.id === "string" && source.id.trim()
          ? source.id.trim()
          : `stage-theme-${index + 1}`,
        typeof source.name === "string" && source.name.trim()
          ? source.name.trim()
          : `ערכת נושא ${index + 1}`,
      );
    })
    .filter((theme) => theme.id.length > 0);

  const unique: StageBoardTheme[] = [];
  mapped.forEach((theme) => {
    if (!unique.some((existing) => existing.id === theme.id)) {
      unique.push(theme);
    }
  });

  return unique.length > 0 ? unique : fallbackList;
};

type StageThemeColorKey = Exclude<keyof StageBoardTheme, "id" | "name">;

const STAGE_THEME_COLOR_FIELDS: Array<{
  key: StageThemeColorKey;
  label: string;
}> = [
  { key: "borderColor", label: "צבע מסגרת" },
  { key: "cardBackgroundColor", label: "רקע כרטיס" },
  { key: "headerFromColor", label: "גרדיאנט כותרת - התחלה" },
  { key: "headerToColor", label: "גרדיאנט כותרת - סיום" },
  { key: "headerTextColor", label: "טקסט בכותרת" },
  { key: "iconBackgroundColor", label: "רקע אייקון" },
  { key: "iconColor", label: "צבע אייקון" },
  { key: "progressTrackColor", label: "רקע מד התקדמות" },
  { key: "progressColor", label: "צבע מד התקדמות" },
  { key: "badgeBackgroundColor", label: "רקע תג" },
  { key: "badgeTextColor", label: "טקסט תג" },
  { key: "activeBorderColor", label: "[שלב פעיל] צבע מסגרת" },
  { key: "activeCardBackgroundColor", label: "[שלב פעיל] רקע כרטיס" },
  { key: "activeHeaderFromColor", label: "[שלב פעיל] כותרת - התחלה" },
  { key: "activeHeaderToColor", label: "[שלב פעיל] כותרת - סיום" },
  { key: "activeHeaderTextColor", label: "[שלב פעיל] טקסט כותרת" },
  { key: "activeProgressColor", label: "[שלב פעיל] צבע התקדמות" },
  { key: "activeBadgeBackgroundColor", label: "[שלב פעיל] רקע תג" },
  { key: "activeBadgeTextColor", label: "[שלב פעיל] טקסט תג" },
  { key: "activeGlowColor", label: "[שלב פעיל] צבע זוהר" },
];

const createStageThemeId = () =>
  `custom-stage-theme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createStageThemeDraft = (base?: StageBoardTheme): StageBoardTheme => {
  const fallback = STAGE_THEME_PRESETS[0];
  const id = createStageThemeId();
  const baseName = base?.name || "ערכת נושא";

  return sanitizeStageTheme(
    {
      ...(base || fallback),
      id,
      name: `${baseName} מותאם`,
    },
    fallback,
    id,
    `${baseName} מותאם`,
  );
};

// Sortable Task Item Component
interface SortableTaskProps {
  task: ClientStageTask;
  stage: ClientStage;
  index: number;
  showTaskCount: boolean;
  clientId: string;
  editingTask: {
    stageId: string;
    taskId: string;
    title: string;
  } | null;
  setEditingTask: React.Dispatch<
    React.SetStateAction<{
      stageId: string;
      taskId: string;
      title: string;
    } | null>
  >;
  handleToggleTask: (task: ClientStageTask) => void;
  handleUpdateTask: (taskId: string, title: string) => void;
  handleDeleteTask: (taskId: string) => void;
  updateTaskStyle?: (
    taskId: string,
    style: {
      background_color?: string | null;
      text_color?: string | null;
      is_bold?: boolean;
    },
  ) => void;
  updateTaskCompletedDate?: (taskId: string, date: string | null) => void;
  startTaskTimer?: (
    taskId: string,
    targetDays: number,
    startDate?: string,
  ) => void;
  stopTaskTimer?: (taskId: string) => void;
  cycleTaskTimerStyle?: (taskId: string) => void;
}

const isTimerTabTask = (task: ClientStageTask) =>
  task.task_type === "timer_tab" && Boolean(task.auto_timer_days);

const SortableTaskItem = React.memo(function SortableTaskItem({
  task,
  stage,
  index,
  showTaskCount,
  clientId,
  editingTask,
  setEditingTask,
  handleToggleTask,
  handleUpdateTask,
  handleDeleteTask,
  updateTaskStyle,
  updateTaskCompletedDate,
  startTaskTimer,
  stopTaskTimer,
  cycleTaskTimerStyle,
}: SortableTaskProps) {
  const [editingDate, setEditingDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: task.background_color || undefined,
  };
  const isTimerTab = isTimerTabTask(task);
  const isTimerTabActive =
    isTimerTab && Boolean(task.started_at && task.target_working_days);
  const canStartTimerTab =
    isTimerTab && !task.completed && Boolean(startTaskTimer && task.auto_timer_days);

  const handleTimerTabClick = () => {
    if (!canStartTimerTab || isTimerTabActive || !task.auto_timer_days) return;
    const approved = confirm(
      `להפעיל את הטאב "${task.title}" ל-${task.auto_timer_days} ימי עבודה?`,
    );
    if (!approved) return;
    startTaskTimer?.(task.id, task.auto_timer_days);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          className={cn(
            "flex items-start gap-2 p-2 rounded-md transition-all group cursor-context-menu",
            task.completed && !task.background_color
              ? "bg-white dark:bg-gray-900 border border-[#85868C]"
              : !task.background_color &&
                  (isTimerTabActive
                    ? "bg-gradient-to-l from-sky-100 via-cyan-100/80 to-white dark:from-sky-950/30 dark:via-cyan-950/20 dark:to-slate-950 border border-sky-300 dark:border-sky-800 shadow-sm shadow-sky-100/80"
                    : isTimerTab
                      ? "bg-gradient-to-l from-cyan-50 via-sky-50/80 to-white dark:from-cyan-950/20 dark:via-sky-950/10 dark:to-slate-950 border border-cyan-300/80 dark:border-cyan-800/70 hover:border-sky-400 hover:shadow-[0_0_0_1px_rgba(56,189,248,0.45),0_8px_20px_-14px_rgba(2,132,199,0.8)]"
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 border border-transparent"),
            isDragging && "shadow-lg ring-2 ring-primary/20",
          )}
        >
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="shrink-0 mt-0.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Completion Date on the right for completed tasks */}
          {task.completed && task.completed_at && (
            <span className="text-[10px] text-[#E8D1B4] shrink-0 font-medium">
              {new Date(task.completed_at).toLocaleDateString("he-IL")}
            </span>
          )}

          {/* Task Number (if enabled) */}
          {showTaskCount && (
            <Badge
              variant="outline"
              className="shrink-0 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
            >
              {index + 1}
            </Badge>
          )}

          {/* Completion Toggle - Green glowing checkmark when completed */}
          <button
            onClick={() => handleToggleTask(task)}
            className="shrink-0 mt-0.5 focus:outline-none"
          >
            {task.completed ? (
              <CheckCircle2
                className="h-5 w-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"
                style={{
                  filter:
                    "drop-shadow(0 0 6px rgba(16, 185, 129, 0.8)) drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))",
                }}
              />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-slate-300 hover:border-emerald-400 transition-colors" />
            )}
          </button>

          {editingTask?.taskId === task.id ? (
            <div className="flex-1 flex gap-2">
              <Input
                value={editingTask.title}
                onChange={(e) =>
                  setEditingTask({
                    ...editingTask,
                    title: e.target.value,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdateTask(task.id, editingTask.title);
                  } else if (e.key === "Escape") {
                    setEditingTask(null);
                  }
                }}
                className="h-7 text-right text-sm"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => handleUpdateTask(task.id, editingTask.title)}
              >
                שמור
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "flex-1 min-w-0",
                canStartTimerTab && !isTimerTabActive && "cursor-pointer",
              )}
              onClick={handleTimerTabClick}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && canStartTimerTab) {
                  e.preventDefault();
                  handleTimerTabClick();
                }
              }}
              role={isTimerTab ? "button" : undefined}
              tabIndex={isTimerTab ? 0 : undefined}
              aria-label={
                isTimerTab && task.auto_timer_days
                  ? `הפעל טאב טיימר ${task.title} ל-${task.auto_timer_days} ימי עבודה`
                  : undefined
              }
            >
              <p
                className={cn(
                  "text-sm text-right break-words text-[#1a2c5f] dark:text-slate-200",
                  task.completed &&
                    "line-through text-emerald-600 dark:text-emerald-400",
                  task.is_bold && "font-bold",
                  isTimerTab && "flex items-center justify-end gap-1.5",
                )}
                style={{
                  color: task.text_color || undefined,
                }}
              >
                {isTimerTab && <Timer className="h-3.5 w-3.5 shrink-0 text-sky-600" />}
                <TaskTitleWithConsultants taskId={task.id} title={task.title} />
              </p>
              <TaskPaymentBadge
                clientId={clientId}
                stageName={stage.stage_name}
                taskTitle={task.title}
                paymentAmount={task.payment_amount}
                paymentPercentage={task.payment_percentage}
                paymentQuoteId={task.payment_quote_id}
                taskId={task.id}
                className="mt-1"
              />
              {isTimerTab && task.auto_timer_days && !isTimerTabActive && (
                <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="rounded-full bg-cyan-100 px-2 py-0.5 font-medium text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-200">
                    טאב טיימר
                  </span>
                  <span>לחץ והאשר להפעלת {task.auto_timer_days} ימי עבודה</span>
                </div>
              )}
              {/* Day Counter - if timer is active - click to change style */}
              {Boolean(task.started_at && task.target_working_days) && (
                <div className="flex items-center gap-1 mt-1">
                  <TaskTimerBadge
                    startedAt={task.started_at}
                    targetDays={task.target_working_days}
                    displayStyle={task.timer_display_style}
                    onStyleChange={() => cycleTaskTimerStyle?.(task.id)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Task Actions - visible on hover */}
          <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Linked Items Indicator - always visible if has links */}
            <div className="opacity-100">
              <StageTaskIndicator stageTaskId={task.id} clientId={clientId} />
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setEditingTask({
                  stageId: stage.stage_id,
                  taskId: task.id,
                  title: task.title,
                })
              }
              className="h-6 w-6 p-0"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteTask(task.id)}
              className="h-6 w-6 p-0 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <StageTaskActionsPopup
              stageTaskId={task.id}
              stageTaskTitle={task.title}
              clientId={clientId}
              trigger={
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:text-primary"
                >
                  <Bell className="h-3 w-3" />
                </Button>
              }
            />
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {/* Background Color Submenu */}
        {updateTaskStyle && (
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span>צבע רקע</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-40">
              {BACKGROUND_COLORS.map((color) => (
                <ContextMenuItem
                  key={color.value || "none"}
                  onClick={() =>
                    updateTaskStyle(task.id, {
                      background_color: color.value,
                    })
                  }
                  className="flex items-center gap-2"
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded border",
                      !color.value && "bg-background",
                    )}
                    style={{
                      backgroundColor: color.value || undefined,
                    }}
                  />
                  <span>{color.label}</span>
                  {task.background_color === color.value && (
                    <CheckCircle2 className="h-3 w-3 mr-auto text-green-600" />
                  )}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        {/* Text Color Submenu */}
        {updateTaskStyle && (
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span>צבע טקסט</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-40">
              {TEXT_COLORS.map((color) => (
                <ContextMenuItem
                  key={color.value || "none"}
                  onClick={() =>
                    updateTaskStyle(task.id, {
                      text_color: color.value,
                    })
                  }
                  className="flex items-center gap-2"
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center",
                      !color.value && "bg-background",
                    )}
                    style={{
                      backgroundColor: color.value || undefined,
                    }}
                  >
                    <span
                      className="text-[8px] font-bold"
                      style={{
                        color: color.value ? "#fff" : "#000",
                      }}
                    >
                      A
                    </span>
                  </div>
                  <span>{color.label}</span>
                  {task.text_color === color.value && (
                    <CheckCircle2 className="h-3 w-3 mr-auto text-green-600" />
                  )}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        {updateTaskStyle && <ContextMenuSeparator />}

        {/* Bold Toggle */}
        {updateTaskStyle && (
          <ContextMenuItem
            onClick={() =>
              updateTaskStyle(task.id, {
                is_bold: !task.is_bold,
              })
            }
            className="flex items-center gap-2"
          >
            <Bold className="h-4 w-4" />
            <span>טקסט מודגש</span>
            {task.is_bold && (
              <CheckCircle2 className="h-3 w-3 mr-auto text-green-600" />
            )}
          </ContextMenuItem>
        )}

        {/* Timer Submenu */}
        {(startTaskTimer || stopTaskTimer) && (
          <>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span>טיימר ימי עבודה</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-56 p-2">
                {task.started_at && stopTaskTimer ? (
                  <ContextMenuItem
                    onClick={() => stopTaskTimer(task.id)}
                    className="flex items-center gap-2 text-destructive"
                  >
                    <Square className="h-4 w-4" />
                    <span>עצור טיימר</span>
                  </ContextMenuItem>
                ) : (
                  startTaskTimer && (
                    <div className="space-y-2">
                      {/* Predefined options - compact grid */}
                      <div className="grid grid-cols-2 gap-1">
                        {TARGET_DAYS_OPTIONS.slice(0, 6).map((option) => (
                          <Button
                            key={option.value}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs justify-center"
                            onClick={() =>
                              startTaskTimer(
                                task.id,
                                option.value,
                                customStartDate || undefined,
                              )
                            }
                          >
                            {option.value} ימים
                          </Button>
                        ))}
                      </div>

                      {/* Custom days input */}
                      <div className="border-t pt-2">
                        <p className="text-xs text-muted-foreground mb-1 text-center">
                          מספר ימים אישי:
                        </p>
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            min="1"
                            max="365"
                            placeholder="ימים"
                            className="h-7 text-xs text-center"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === "Enter") {
                                const days = Number.parseInt(
                                  (e.target as HTMLInputElement).value,
                                );
                                if (days > 0 && days <= 365) {
                                  startTaskTimer(
                                    task.id,
                                    days,
                                    customStartDate || undefined,
                                  );
                                }
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            className="h-7 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              const input = e.currentTarget
                                .previousElementSibling as HTMLInputElement;
                              if (input?.value) {
                                const days = Number.parseInt(input.value);
                                if (days > 0 && days <= 365) {
                                  startTaskTimer(
                                    task.id,
                                    days,
                                    customStartDate || undefined,
                                  );
                                }
                              }
                            }}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Custom start date input */}
                      <div className="border-t pt-2">
                        <p className="text-xs text-muted-foreground mb-1 text-center">
                          תאריך התחלה (אופציונלי):
                        </p>
                        <Input
                          type="date"
                          className="h-7 text-xs"
                          value={customStartDate}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                        {customStartDate && (
                          <p className="text-xs text-blue-500 mt-1 text-center">
                            מתחיל מ-
                            {new Date(customStartDate).toLocaleDateString(
                              "he-IL",
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )}
              </ContextMenuSubContent>
            </ContextMenuSub>
          </>
        )}

        {/* Completion Date */}
        {updateTaskCompletedDate && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => setEditingDate(true)}
              className="flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              <span>שנה תאריך ביצוע</span>
            </ContextMenuItem>
          </>
        )}

        <ContextMenuSeparator />

        {/* Edit Task */}
        <ContextMenuItem
          onClick={() =>
            setEditingTask({
              stageId: stage.stage_id,
              taskId: task.id,
              title: task.title,
            })
          }
          className="flex items-center gap-2"
        >
          <Pencil className="h-4 w-4" />
          <span>עריכת משימה</span>
        </ContextMenuItem>

        {/* Delete Task */}
        <ContextMenuItem
          onClick={() => handleDeleteTask(task.id)}
          className="flex items-center gap-2 text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span>מחיקת משימה</span>
        </ContextMenuItem>
      </ContextMenuContent>

      {/* Date Picker Dialog */}
      {editingDate && updateTaskCompletedDate && (
        <DateChangeDialog
          open={editingDate}
          onOpenChange={setEditingDate}
          value={task.completed_at ? parseISO(task.completed_at) : undefined}
          onSave={(d) => {
            updateTaskCompletedDate(task.id, d ? d.toISOString() : null);
            setEditingDate(false);
          }}
        />
      )}
    </ContextMenu>
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Themed date-change dialog (uses SmartDateTimePicker + DialogTheme)
// ────────────────────────────────────────────────────────────────────────────
interface DateChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: Date | undefined;
  onSave: (d: Date | undefined) => void;
}

const RESIZE_MIN_W = 320;
const RESIZE_MIN_H = 380;
const DIALOG_LS_KEY = 'date-dialog-layout';

interface DialogLayout { x: number; y: number; w: number; h: number; }

function clampToViewport(l: DialogLayout): DialogLayout {
  const w = Math.max(RESIZE_MIN_W, Math.min(window.innerWidth - 16, l.w));
  const h = Math.max(RESIZE_MIN_H, Math.min(window.innerHeight - 16, l.h));
  return { w, h, x: Math.max(0, Math.min(window.innerWidth - w - 8, l.x)), y: Math.max(0, Math.min(window.innerHeight - h - 8, l.y)) };
}

function readDialogLayout(): DialogLayout | null {
  try { return JSON.parse(localStorage.getItem(DIALOG_LS_KEY) ?? '') as DialogLayout; } catch { return null; }
}

function getCursor(dir: string) {
  const map: Record<string, string> = {
    e: 'ew-resize', w: 'ew-resize', s: 'ns-resize', se: 'se-resize', sw: 'sw-resize',
  };
  return map[dir] ?? 'default';
}

const DateChangeDialog: React.FC<DateChangeDialogProps> = ({ open, onOpenChange, value, onSave }) => {
  const { theme, themeId, setThemeId } = useDialogTheme();
  const [draft, setDraft] = useState<Date | undefined>(value);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  // Position stored in ref — applied directly to DOM for smooth dragging (no React re-renders).
  const posRef = React.useRef<{ x: number; y: number } | null>(null);
  const dragStateRef = React.useRef<{ startX: number; startY: number; baseX: number; baseY: number; rafId: number | null } | null>(null);
  // Size stored in ref during resize; committed to state on pointerup so React stays consistent.
  const sizeRef = React.useRef({ w: 460, h: 0 });
  const [committedSize, setCommittedSize] = useState({ w: 460, h: 0 });
  const [mounted, setMounted] = useState(false);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Layout persistence helpers ----
  const saveLayout = React.useCallback(() => {
    const pos = posRef.current;
    const size = sizeRef.current;
    if (!pos || !size.h) return;
    const layout: DialogLayout = { x: pos.x, y: pos.y, w: size.w, h: size.h };
    try { localStorage.setItem(DIALOG_LS_KEY, JSON.stringify(layout)); } catch { /* ignore */ }
    // Debounced cloud save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase
          .from('user_preferences' as any)
          .upsert({ user_id: user.id, date_dialog_layout: layout as any, updated_at: new Date().toISOString() } as any, { onConflict: 'user_id' });
      } catch { /* silent */ }
    }, 600);
  }, []);

  // Reset draft when opened
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  // Mount + center on open
  useEffect(() => {
    if (!open) {
      setMounted(false);
      return;
    }
    setMounted(true);
  }, [open]);

  // Stable accent so SmartDateTimePicker doesn't see a fresh object on every render
  const pickerAccent = React.useMemo(() => ({
    gold: theme.border,
    goldLight: theme.title,
    navy: theme.background,
    navyDark: theme.background,
  }), [theme.border, theme.title, theme.background]);

  // Restore saved layout (localStorage), or center for first-time open.
  useEffect(() => {
    if (!mounted) return;
    const el = panelRef.current;
    if (!el) return;
    const saved = readDialogLayout();
    if (saved) {
      const c = clampToViewport(saved);
      posRef.current = { x: c.x, y: c.y };
      sizeRef.current = { w: c.w, h: c.h };
      el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
      el.style.width = `${c.w}px`;
      el.style.height = `${c.h}px`;
      setCommittedSize({ w: c.w, h: c.h });
    } else {
      // First time ever — center in viewport
      const rect = el.getBoundingClientRect();
      const x = Math.max(8, Math.round((window.innerWidth - rect.width) / 2));
      const y = Math.max(8, Math.round((window.innerHeight - rect.height) / 2));
      posRef.current = { x, y };
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const measuredH = Math.round(rect.height);
      sizeRef.current = { w: Math.round(rect.width), h: measuredH };
      setCommittedSize({ w: Math.round(rect.width), h: measuredH });
    }
    // Async: fetch from cloud — overrides localStorage for cross-device sync
    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('user_preferences' as any)
          .select('date_dialog_layout')
          .eq('user_id', user.id)
          .maybeSingle();
        const cloudLayout = (data as any)?.date_dialog_layout as DialogLayout | null;
        if (!cloudLayout) return;
        const c = clampToViewport(cloudLayout);
        // Update localStorage with cloud value
        try { localStorage.setItem(DIALOG_LS_KEY, JSON.stringify(c)); } catch { /* ignore */ }
        // Apply to panel if still open
        const panel = panelRef.current;
        if (!panel) return;
        posRef.current = { x: c.x, y: c.y };
        sizeRef.current = { w: c.w, h: c.h };
        panel.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
        panel.style.width = `${c.w}px`;
        panel.style.height = `${c.h}px`;
        setCommittedSize({ w: c.w, h: c.h });
      } catch { /* silent */ }
    })();
  }, [mounted]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!posRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-drag]')) return;
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: posRef.current.x,
      baseY: posRef.current.y,
      rafId: null,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Resize: applies size directly to DOM during drag, commits to state on release.
  const startResize = React.useCallback((dir: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = panelRef.current;
    if (!el || !posRef.current) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = el.offsetWidth;
    const startH = el.offsetHeight;
    const startPx = posRef.current.x;
    const startPy = posRef.current.y;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const maxW = window.innerWidth - 32;
      const maxH = window.innerHeight - 32;
      let newW = startW;
      let newH = startH;
      let newPx = startPx;
      if (dir.includes('e')) newW = Math.max(RESIZE_MIN_W, Math.min(maxW, startW + dx));
      if (dir.includes('w')) {
        newW = Math.max(RESIZE_MIN_W, Math.min(maxW, startW - dx));
        newPx = startPx + (startW - newW);
      }
      if (dir.includes('s')) newH = Math.max(RESIZE_MIN_H, Math.min(maxH, startH + dy));
      sizeRef.current = { w: newW, h: newH };
      el.style.width = `${newW}px`;
      el.style.height = `${newH}px`;
      if (newPx !== posRef.current!.x) {
        posRef.current = { x: newPx, y: posRef.current!.y };
        el.style.transform = `translate3d(${newPx}px, ${posRef.current.y}px, 0)`;
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setCommittedSize({ ...sizeRef.current });
      // Save size + position after resize
      saveLayout();
    };

    document.body.style.cursor = getCursor(dir);
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [saveLayout]);
  const onPointerMove = (e: React.PointerEvent) => {
    const s = dragStateRef.current;
    if (!s) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    if (s.rafId !== null) return;
    s.rafId = requestAnimationFrame(() => {
      s.rafId = null;
      const el = panelRef.current;
      if (!el) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const dx = clientX - s.startX;
      const dy = clientY - s.startY;
      // Allow negative when panel is bigger than viewport (so user can drag it up to reveal bottom).
      const minX = Math.min(0, window.innerWidth - w);
      const maxX = Math.max(0, window.innerWidth - w);
      const minY = Math.min(0, window.innerHeight - h);
      const maxY = Math.max(0, window.innerHeight - h);
      const nx = Math.max(minX, Math.min(maxX, s.baseX + dx));
      const ny = Math.max(minY, Math.min(maxY, s.baseY + dy));
      posRef.current = { x: nx, y: ny };
      el.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStateRef.current?.rafId) cancelAnimationFrame(dragStateRef.current.rafId);
    dragStateRef.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    // Save position after drag
    saveLayout();
  };

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      data-testid="date-change-dialog"
      className="fixed z-[1000] rounded-lg shadow-2xl overflow-visible flex flex-col"
      style={{
        top: 0,
        left: 0,
        width: committedSize.w,
        height: committedSize.h > 0 ? committedSize.h : undefined,
        // Initial off-screen — centering effect applies translate3d once measured
        transform: posRef.current ? `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)` : 'translate3d(-9999px, -9999px, 0)',
        background: theme.backgroundGradient || theme.background,
        border: `1px solid ${theme.border}`,
        color: theme.text,
        willChange: 'transform',
        // Force interactivity even when an ancestor Radix Dialog disables body pointer-events
        pointerEvents: 'auto',
      }}
      dir="rtl"
    >
      {/* Drag handle / header */}
      <div
        data-testid="date-change-dialog-handle"
        className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 cursor-move select-none"
        style={{ borderBottom: `1px solid ${theme.headerBorder}`, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 opacity-60" style={{ color: theme.iconColor }} />
          <h2 className="text-base font-semibold" style={{ color: theme.title }}>בחר תאריך ביצוע</h2>
        </div>
        <div className="flex items-center gap-1" data-no-drag>
          <DialogThemeSwitcher currentTheme={themeId} onThemeChange={setThemeId} />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
            style={{ background: theme.iconBg, color: theme.iconColor }}
            title="סגור"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4" data-no-drag>
        <SmartDateTimePicker
          value={draft}
          onChange={(d) => setDraft(d)}
          label="תאריך יעד"
          placeholder="dd/mm/yyyy"
          allowClear
          accent={pickerAccent}
        />
      </div>

      <div
        className="px-5 py-3 flex items-center justify-end gap-2 shrink-0"
        style={{ borderTop: `1px solid ${theme.headerBorder}`, background: theme.background }}
        data-no-drag
      >
        <Button variant="ghost" onClick={() => onOpenChange(false)} style={{ color: theme.cancelText }}>
          ביטול
        </Button>
        <Button
          onClick={() => onSave(draft)}
          style={{
            background: theme.buttonBg,
            color: theme.buttonText,
            border: `1px solid ${theme.buttonBorder}`,
          }}
        >
          שמור תאריך
        </Button>
      </div>

      {/* ── Resize handles ── */}
      {/* Right edge */}
      <div
        data-no-drag
        className="absolute top-3 bottom-3 -right-1 w-2.5 cursor-ew-resize group"
        onPointerDown={(e) => startResize('e', e)}
      >
        <div className="absolute top-1/2 -translate-y-1/2 right-0.5 w-1 h-8 rounded-full bg-current opacity-0 group-hover:opacity-20 transition-opacity" />
      </div>
      {/* Left edge */}
      <div
        data-no-drag
        className="absolute top-3 bottom-3 -left-1 w-2.5 cursor-ew-resize group"
        onPointerDown={(e) => startResize('w', e)}
      >
        <div className="absolute top-1/2 -translate-y-1/2 left-0.5 w-1 h-8 rounded-full bg-current opacity-0 group-hover:opacity-20 transition-opacity" />
      </div>
      {/* Bottom edge */}
      <div
        data-no-drag
        className="absolute -bottom-1 left-3 right-3 h-2.5 cursor-ns-resize group"
        onPointerDown={(e) => startResize('s', e)}
      >
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0.5 h-1 w-8 rounded-full bg-current opacity-0 group-hover:opacity-20 transition-opacity" />
      </div>
      {/* Bottom-right corner */}
      <div
        data-no-drag
        className="absolute -bottom-1 -right-1 w-4 h-4 cursor-se-resize group"
        onPointerDown={(e) => startResize('se', e)}
      >
        <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-sm bg-current opacity-0 group-hover:opacity-25 transition-opacity" />
      </div>
      {/* Bottom-left corner */}
      <div
        data-no-drag
        className="absolute -bottom-1 -left-1 w-4 h-4 cursor-sw-resize group"
        onPointerDown={(e) => startResize('sw', e)}
      >
        <div className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 rounded-sm bg-current opacity-0 group-hover:opacity-25 transition-opacity" />
      </div>
    </div>,
    document.body,
  );
};

// Sortable Task Item for Expanded Dialog
interface SortableExpandedTaskProps {
  task: ClientStageTask;
  stageId: string;
  stageName?: string;
  index: number;
  showTaskCount: boolean;
  clientId: string;
  setEditingTask: React.Dispatch<
    React.SetStateAction<{
      stageId: string;
      taskId: string;
      title: string;
    } | null>
  >;
  handleToggleTask: (task: ClientStageTask) => void;
  handleDeleteTask: (taskId: string) => void;
  startTaskTimer?: (
    taskId: string,
    targetDays: number,
    startDate?: string,
  ) => void;
  cycleTaskTimerStyle?: (taskId: string) => void;
}
function SortableExpandedTaskItem({
  task,
  stageId,
  stageName,
  index,
  showTaskCount,
  clientId,
  setEditingTask,
  handleToggleTask,
  handleDeleteTask,
  startTaskTimer,
  cycleTaskTimerStyle,
}: SortableExpandedTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const isTimerTab = isTimerTabTask(task);
  const isTimerTabActive =
    isTimerTab && Boolean(task.started_at && task.target_working_days);
  const canStartTimerTab =
    isTimerTab && !task.completed && Boolean(startTaskTimer && task.auto_timer_days);
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg transition-all group",
        task.completed
          ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
          : isTimerTabActive
            ? "bg-gradient-to-l from-sky-100 via-cyan-100/70 to-white dark:from-sky-950/30 dark:via-cyan-950/20 dark:to-slate-950 border border-sky-300 dark:border-sky-800"
            : isTimerTab
              ? "bg-gradient-to-l from-cyan-50 via-sky-50/70 to-white dark:from-cyan-950/20 dark:via-sky-950/10 dark:to-slate-950 hover:from-cyan-100 hover:to-sky-100 dark:hover:from-cyan-950/30 dark:hover:to-sky-950/20 border border-cyan-300/80 dark:border-cyan-800/70"
              : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700",
        isDragging && "shadow-lg ring-2 ring-primary/20",
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Completion Date on the right */}
      {task.completed && task.completed_at && (
        <span className="text-xs text-green-600 dark:text-green-400 shrink-0 font-medium min-w-[70px]">
          {new Date(task.completed_at).toLocaleDateString("he-IL")}
        </span>
      )}

      {/* Task Number */}
      {showTaskCount && (
        <Badge
          variant="outline"
          className="shrink-0 h-6 w-6 p-0 flex items-center justify-center text-xs"
        >
          {index + 1}
        </Badge>
      )}

      {/* Completion Toggle - Green glowing checkmark when completed */}
      <button
        onClick={() => handleToggleTask(task)}
        className="shrink-0 focus:outline-none"
      >
        {task.completed ? (
          <CheckCircle2
            className="h-5 w-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"
            style={{
              filter:
                "drop-shadow(0 0 6px rgba(16, 185, 129, 0.8)) drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))",
            }}
          />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-slate-300 hover:border-emerald-400 transition-colors" />
        )}
      </button>

      <div
        className={cn(
          "flex-1 min-w-0",
          canStartTimerTab && !isTimerTabActive && "cursor-pointer",
        )}
        onClick={() => {
          if (!canStartTimerTab || isTimerTabActive || !task.auto_timer_days) return;
          const approved = confirm(
            `להפעיל את הטאב "${task.title}" ל-${task.auto_timer_days} ימי עבודה?`,
          );
          if (!approved) return;
          startTaskTimer?.(task.id, task.auto_timer_days);
        }}
      >
        <p
          className={cn(
            "text-base text-right text-[#1a2c5f] dark:text-slate-200 font-medium",
            task.completed &&
              "line-through text-emerald-600 dark:text-emerald-400",
            isTimerTab && "flex items-center justify-end gap-2",
          )}
        >
          {isTimerTab && <Timer className="h-4 w-4 shrink-0 text-sky-600" />}
          <TaskTitleWithConsultants taskId={task.id} title={task.title} />
        </p>
        <TaskPaymentBadge
          clientId={clientId}
          stageName={stageName}
          taskTitle={task.title}
          paymentAmount={task.payment_amount}
          paymentPercentage={task.payment_percentage}
          paymentQuoteId={task.payment_quote_id}
          taskId={task.id}
          className="mt-1"
        />
        {isTimerTab && task.auto_timer_days && !isTimerTabActive && (
          <p className="mt-1 text-xs text-right text-slate-500 dark:text-slate-400">
            לחץ והאשר להפעלת {task.auto_timer_days} ימי עבודה
          </p>
        )}
        {Boolean(task.started_at && task.target_working_days) && (
          <div className="mt-2 flex justify-end">
            <TaskTimerBadge
              startedAt={task.started_at}
              targetDays={task.target_working_days}
              displayStyle={task.timer_display_style}
              onStyleChange={() => cycleTaskTimerStyle?.(task.id)}
            />
          </div>
        )}
      </div>

      {/* Task Actions */}
      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Linked Items Indicator - always visible if has links */}
        <div className="opacity-100">
          <StageTaskIndicator stageTaskId={task.id} clientId={clientId} />
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            setEditingTask({
              stageId,
              taskId: task.id,
              title: task.title,
            })
          }
          className="h-8 w-8 p-0"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDeleteTask(task.id)}
          className="h-8 w-8 p-0 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <StageTaskActionsPopup
          stageTaskId={task.id}
          stageTaskTitle={task.title}
          clientId={clientId}
          trigger={
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:text-primary"
            >
              <Bell className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    </div>
  );
}

// Sortable Stage Item for Manage Stages Dialog
interface SortableStageItemProps {
  stage: ClientStage;
  index: number;
  isEditing: boolean;
  editingStage: {
    stageId: string;
    name: string;
    icon: string;
  } | null;
  setEditingStage: React.Dispatch<
    React.SetStateAction<{
      stageId: string;
      name: string;
      icon: string;
    } | null>
  >;
  handleUpdateStage: () => void;
  handleDeleteStage: (stageId: string) => void;
  handleMoveStage: (stageId: string, direction: "up" | "down") => void;
  isFirst: boolean;
  isLast: boolean;
  Icon: React.ComponentType<{
    className?: string;
  }>;
  onAddTasks: (stageId: string) => void;
  addingTaskInManage: {
    stageId: string;
    mode: "single" | "bulk";
    value: string;
  } | null;
  setAddingTaskInManage: React.Dispatch<
    React.SetStateAction<{
      stageId: string;
      mode: "single" | "bulk";
      value: string;
    } | null>
  >;
  onSaveTask: (stageId: string, value: string, mode: "single" | "bulk") => void;
}
function SortableStageItem({
  stage,
  index,
  isEditing,
  editingStage,
  setEditingStage,
  handleUpdateStage,
  handleDeleteStage,
  handleMoveStage,
  isFirst,
  isLast,
  Icon,
  onAddTasks,
  addingTaskInManage,
  setAddingTaskInManage,
  onSaveTask,
}: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stage.stage_id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const isAddingTask = addingTaskInManage?.stageId === stage.stage_id;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-2 p-3 rounded-lg border bg-card transition-all",
        isDragging && "shadow-lg ring-2 ring-primary/20",
      )}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Stage Number */}
        <Badge
          variant="outline"
          className="shrink-0 h-7 w-7 p-0 flex items-center justify-center"
        >
          {index + 1}
        </Badge>

        {/* Stage Icon */}
        <div className="shrink-0 p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>

        {/* Stage Name - Editable */}
        {isEditing ? (
          <div className="flex-1 flex gap-2">
            <Input
              value={editingStage?.name || ""}
              onChange={(e) =>
                setEditingStage((prev) =>
                  prev
                    ? {
                        ...prev,
                        name: e.target.value,
                      }
                    : null,
                )
              }
              className="flex-1 text-right"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateStage();
                if (e.key === "Escape") setEditingStage(null);
              }}
            />
            <div className="flex gap-1">
              {iconOptions.map((opt) => {
                const IconOpt = opt.icon;
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={
                      editingStage?.icon === opt.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setEditingStage((prev) =>
                        prev
                          ? {
                              ...prev,
                              icon: opt.value,
                            }
                          : null,
                      )
                    }
                    className="h-8 w-8 p-0"
                    title={opt.label}
                  >
                    <IconOpt className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
            <Button size="sm" onClick={handleUpdateStage}>
              <Save className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingStage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <span className="flex-1 font-medium text-right">
            {stage.stage_name}
          </span>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Arrow Up */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleMoveStage(stage.stage_id, "up")}
              disabled={isFirst}
              className="h-8 w-8 p-0"
              title="הזז למעלה"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>

            {/* Arrow Down */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleMoveStage(stage.stage_id, "down")}
              disabled={isLast}
              className="h-8 w-8 p-0"
              title="הזז למטה"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>

            {/* Edit */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setEditingStage({
                  stageId: stage.stage_id,
                  name: stage.stage_name,
                  icon: stage.stage_icon || "Phone",
                })
              }
              className="h-8 w-8 p-0"
              title="ערוך"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* Delete */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteStage(stage.stage_id)}
              className="h-8 w-8 p-0 hover:text-destructive"
              title="מחק"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* Add Tasks */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setAddingTaskInManage({
                  stageId: stage.stage_id,
                  mode: "single",
                  value: "",
                })
              }
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              title="הוסף משימות"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Task count info */}
      <div className="text-xs text-muted-foreground mr-10">
        {stage.tasks?.length || 0} משימות
      </div>

      {/* Add task input area */}
      {isAddingTask && (
        <div className="mr-10 mt-2 space-y-2 border-t pt-2">
          <div className="flex gap-2 mb-2">
            <Button
              size="sm"
              variant={
                addingTaskInManage?.mode === "single" ? "default" : "outline"
              }
              onClick={() =>
                setAddingTaskInManage((prev) =>
                  prev
                    ? {
                        ...prev,
                        mode: "single",
                      }
                    : null,
                )
              }
              className="text-xs"
            >
              משימה בודדת
            </Button>
            <Button
              size="sm"
              variant={
                addingTaskInManage?.mode === "bulk" ? "default" : "outline"
              }
              onClick={() =>
                setAddingTaskInManage((prev) =>
                  prev
                    ? {
                        ...prev,
                        mode: "bulk",
                      }
                    : null,
                )
              }
              className="text-xs"
            >
              <ListPlus className="h-3 w-3 ml-1" />
              רשימת משימות
            </Button>
          </div>

          {addingTaskInManage?.mode === "single" ? (
            <div className="flex gap-2">
              <Input
                value={addingTaskInManage?.value || ""}
                onChange={(e) =>
                  setAddingTaskInManage((prev) =>
                    prev
                      ? {
                          ...prev,
                          value: e.target.value,
                        }
                      : null,
                  )
                }
                placeholder="שם המשימה..."
                className="flex-1 text-right h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && addingTaskInManage?.value.trim()) {
                    onSaveTask(
                      stage.stage_id,
                      addingTaskInManage.value,
                      "single",
                    );
                  }
                  if (e.key === "Escape") setAddingTaskInManage(null);
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (addingTaskInManage?.value.trim()) {
                    onSaveTask(
                      stage.stage_id,
                      addingTaskInManage.value,
                      "single",
                    );
                  }
                }}
                disabled={!addingTaskInManage?.value.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAddingTaskInManage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={addingTaskInManage?.value || ""}
                onChange={(e) =>
                  setAddingTaskInManage((prev) =>
                    prev
                      ? {
                          ...prev,
                          value: e.target.value,
                        }
                      : null,
                  )
                }
                placeholder="הכנס משימות, כל שורה משימה חדשה..."
                className="min-h-[100px] text-right"
                autoFocus
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {addingTaskInManage?.value.split("\n").filter((l) => l.trim())
                    .length || 0}{" "}
                  משימות
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAddingTaskInManage(null)}
                  >
                    ביטול
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (addingTaskInManage?.value.trim()) {
                        onSaveTask(
                          stage.stage_id,
                          addingTaskInManage.value,
                          "bulk",
                        );
                      }
                    }}
                    disabled={!addingTaskInManage?.value.trim()}
                  >
                    הוסף משימות
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export function ClientStagesBoard({
  clientId,
  viewMode,
  onViewModeChange,
  linkedProjectTemplateId,
}: ClientStagesBoardProps) {
  const {
    stages: allStages,
    loading,
    addTask,
    addBulkTasks,
    toggleTask,
    updateTask,
    updateTaskCompletedDate,
    updateTaskStyle,
    startTaskTimer,
    stopTaskTimer,
    cycleTaskTimerStyle,
    startStageTimer,
    stopStageTimer,
    cycleStageTimerStyle,
    deleteTask,
    bulkDeleteTasks,
    addStage,
    addBulkStages,
    updateStage,
    deleteStage,
    bulkDeleteStages,
    reorderTasks,
    reorderStages,
    copyStageData,
    pasteStageData,
    refresh,
    assignStageToFolder,
    syncTemplateFromProject,
    bulkSetTasksCompleted,
  } = useClientStages(clientId);

  const autoTemplateSyncAttemptRef = useRef<string | null>(null);
  const autoPaymentSyncAttemptRef = useRef<string | null>(null);

  // Folder system
  const {
    folders,
    loading: foldersLoading,
    addFolder: createFolder,
    updateFolder,
    deleteFolder,
    reorderFolders,
    refresh: refreshFolders,
  } = useClientFolders(clientId);

  const { clients } = useClients();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [addFolderDialog, setAddFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderMode, setNewFolderMode] = useState<"empty" | "copy">("empty");
  const [copySourceFolderId, setCopySourceFolderId] = useState<string>("");
  const [editingFolder, setEditingFolder] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameFolderDialog, setRenameFolderDialog] = useState(false);

  // Create a new folder, optionally copying stages+tasks from an existing folder
  const handleCreateFolderWithOptions = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const created = await createFolder(name);
    if (!created) return;

    if (newFolderMode === "copy" && copySourceFolderId) {
      const sourceStages = allStages
        .filter((s) => s.folder_id === copySourceFolderId)
        .sort((a, b) => a.sort_order - b.sort_order);

      for (const src of sourceStages) {
        const inserted = await addBulkStages(
          [src.stage_name],
          src.stage_icon || "Phone",
          created.id,
        );
        const newStage = inserted?.[0];
        const srcTasks = (src as any).tasks || [];
        if (newStage && srcTasks.length > 0) {
          for (const t of srcTasks) {
            await addTask(newStage.stage_id, t.title);
          }
        }
      }
    }

    setNewFolderName("");
    setNewFolderMode("empty");
    setCopySourceFolderId("");
    setAddFolderDialog(false);
    await refreshFolders();
    await refresh();
    setSelectedFolderId(created.id);
  };

  // Filter stages by selected folder (no folder = show ALL stages)
  const stages = selectedFolderId
    ? allStages.filter((s) => s.folder_id === selectedFolderId)
    : allStages;

  useEffect(() => {
    if (!clientId || !linkedProjectTemplateId || loading) return;

    const syncKey = `${clientId}:${linkedProjectTemplateId}`;
    if (autoTemplateSyncAttemptRef.current === syncKey) return;

    autoTemplateSyncAttemptRef.current = syncKey;

    const detectedTemplateIds = Array.from(
      new Set(
        allStages
          .map((stage) => {
            const match = String(stage.stage_id || "").match(/^template_([^_]+)_/);
            return match?.[1] || null;
          })
          .filter(Boolean),
      ),
    ) as string[];

    const previousTemplateId =
      detectedTemplateIds.find((templateId) => templateId !== linkedProjectTemplateId) ||
      null;

    const alreadyLinkedToTemplate = detectedTemplateIds.includes(
      linkedProjectTemplateId,
    );

    if (alreadyLinkedToTemplate) return;

    void syncTemplateFromProject(linkedProjectTemplateId, {
      previousTemplateId,
      clearAllOnTemplateChange: true,
    });
  }, [
    clientId,
    linkedProjectTemplateId,
    loading,
    allStages,
    syncTemplateFromProject,
  ]);

  // Keep payment links self-healing when stages/tasks are first loaded or a
  // template replacement recreates them. The signature changes only for
  // structural task changes, so refreshing payment fields does not loop.
  useEffect(() => {
    if (!clientId || loading || allStages.length === 0) return;

    const taskSignature = allStages
      .flatMap((stage) =>
        (stage.tasks || []).map((task) => `${stage.stage_id}:${task.id}`),
      )
      .sort()
      .join("|");
    const syncKey = `${clientId}:${taskSignature}`;
    if (autoPaymentSyncAttemptRef.current === syncKey) return;
    autoPaymentSyncAttemptRef.current = syncKey;

    let cancelled = false;
    void import("@/lib/syncPaymentTasksForClient")
      .then(({ syncPaymentTasksForClient }) =>
        syncPaymentTasksForClient(clientId),
      )
      .then((result) => {
        if (!cancelled && (result.tasksCreated > 0 || result.tasksLinked > 0)) {
          return refresh();
        }
      })
      .catch((error) => {
        console.error("[ClientStagesBoard] automatic payment sync failed", error);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, loading, allStages, refresh]);

  const [addingTask, setAddingTask] = useState<{
    stageId: string;
    title: string;
  } | null>(null);
  const [editingTask, setEditingTask] = useState<{
    stageId: string;
    taskId: string;
    title: string;
  } | null>(null);
  const [showTaskCount, setShowTaskCount] = useState<Record<string, boolean>>(
    {},
  );
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [bulkAddDialog, setBulkAddDialog] = useState<{
    stageId: string;
    tasks: string;
  } | null>(null);
  const [addStageDialog, setAddStageDialog] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageIcon, setNewStageIcon] = useState("Phone");
  const [addStageMode, setAddStageMode] = useState<"single" | "bulk">("single");
  const [bulkStagesText, setBulkStagesText] = useState("");
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [expandedViewMode, setExpandedViewMode] = useState<"cards" | "table">(
    "cards",
  );
  const [manageStagesDialog, setManageStagesDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<{
    stageId: string;
    name: string;
    icon: string;
  } | null>(null);

  // State for adding tasks from manage stages dialog
  const [addingTaskInManage, setAddingTaskInManage] = useState<{
    stageId: string;
    mode: "single" | "bulk";
    value: string;
  } | null>(null);

  // Show all stages by default
  const [showAllStages, setShowAllStages] = useState(true);
  const [hideCompletedTasks, setHideCompletedTasks] = useState(() => {
    try { return localStorage.getItem(`stages-hide-completed-${clientId}`) === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(`stages-hide-completed-${clientId}`, hideCompletedTasks ? '1' : '0'); } catch {}
  }, [hideCompletedTasks, clientId]);
  const filterTasks = useCallback(
    <T extends { completed?: boolean }>(tasks: T[] | undefined | null): T[] =>
      hideCompletedTasks ? (tasks || []).filter((t) => !t.completed) : (tasks || []),
    [hideCompletedTasks]
  );

  // Summary frame: shows incomplete tasks from stages that have been started (at least 1 task done)
  const [showSummaryFrame, setShowSummaryFrame] = useState(() => {
    try { return localStorage.getItem(`stages-summary-frame-${clientId}`) === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(`stages-summary-frame-${clientId}`, showSummaryFrame ? '1' : '0'); } catch {}
  }, [showSummaryFrame, clientId]);

  // Columns count for grid layout (persisted to LS + cloud)
  const [columnsCount, setColumnsCount] = useSyncedSetting<number>({ key: "stages-columns-count", defaultValue: 4 });
  const [stageBoardThemesRaw, setStageBoardThemesRaw] = useSyncedSetting<
    StageBoardTheme[]
  >({
    key: "stages-board-themes-v1",
    defaultValue: STAGE_THEME_PRESETS,
  });
  const [activeStageThemeId, setActiveStageThemeId] = useSyncedSetting<string>({
    key: "stages-board-active-theme-v1",
    defaultValue: STAGE_THEME_PRESETS[0].id,
  });
  const [timerTabQuickDays, setTimerTabQuickDays] = useSyncedSetting<
    number[]
  >({
    key: "timer-tab-quick-days",
    defaultValue: TIMER_TAB_PRESET_DEFAULTS,
  });
  const [timerTabPresetEditorOpen, setTimerTabPresetEditorOpen] =
    useState(false);
  const [timerTabPresetDraft, setTimerTabPresetDraft] = useState<string[]>(
    () => TIMER_TAB_PRESET_DEFAULTS.map(String),
  );
  const [stageThemeDialogOpen, setStageThemeDialogOpen] = useState(false);
  const [editingStageThemeId, setEditingStageThemeId] = useState<string | null>(
    null,
  );
  const [stageThemeDraft, setStageThemeDraft] = useState<StageBoardTheme>(() =>
    createStageThemeDraft(STAGE_THEME_PRESETS[0]),
  );
  const stageThemeColorRafRef = React.useRef<number | null>(null);
  const pendingStageThemeColorUpdateRef = React.useRef<
    { key: StageThemeColorKey; value: string } | null
  >(null);
  const [highlightedColorKey, setHighlightedColorKey] =
    useState<StageThemeColorKey | null>(null);
  const highlightTimerRef = React.useRef<number | null>(null);
  const focusStageColorField = React.useCallback((key: StageThemeColorKey) => {
    const el = document.getElementById(`stage-color-field-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setHighlightedColorKey(key);
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedColorKey((curr) => (curr === key ? null : curr));
    }, 1800);
  }, []);

  const stageBoardThemes = useMemo(
    () => normalizeStageThemes(stageBoardThemesRaw),
    [stageBoardThemesRaw],
  );

  const activeStageTheme = useMemo(() => {
    return (
      stageBoardThemes.find((theme) => theme.id === activeStageThemeId) ||
      stageBoardThemes[0] ||
      STAGE_THEME_PRESETS[0]
    );
  }, [stageBoardThemes, activeStageThemeId]);

  const stageThemeLivePreview = useMemo(
    () =>
      sanitizeStageTheme(
        stageThemeDraft,
        activeStageTheme,
        stageThemeDraft.id || activeStageTheme.id,
        stageThemeDraft.name?.trim() || activeStageTheme.name,
      ),
    [stageThemeDraft, activeStageTheme],
  );

  useEffect(() => {
    if (JSON.stringify(stageBoardThemesRaw) !== JSON.stringify(stageBoardThemes)) {
      setStageBoardThemesRaw(stageBoardThemes);
    }
  }, [stageBoardThemesRaw, stageBoardThemes, setStageBoardThemesRaw]);

  useEffect(() => {
    if (!stageBoardThemes.some((theme) => theme.id === activeStageThemeId)) {
      setActiveStageThemeId(stageBoardThemes[0]?.id || STAGE_THEME_PRESETS[0].id);
    }
  }, [stageBoardThemes, activeStageThemeId, setActiveStageThemeId]);

  const timerTabQuickDayOptions = useMemo(
    () => normalizeTimerTabDayPresets(timerTabQuickDays),
    [timerTabQuickDays],
  );

  useEffect(() => {
    const normalized = normalizeTimerTabDayPresets(timerTabQuickDays);
    if (JSON.stringify(normalized) !== JSON.stringify(timerTabQuickDays)) {
      setTimerTabQuickDays(normalized);
    }
  }, [timerTabQuickDays, setTimerTabQuickDays]);

  // Get grid columns class based on count
  const getGridColumnsClass = () => {
    switch (columnsCount) {
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 3:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";
      case 5:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
      case 6:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6";
      default:
        return "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";
    }
  };

  // Template dialogs state
  const [applyTemplateDialog, setApplyTemplateDialog] = useState(false);
  const [saveAllStagesDialog, setSaveAllStagesDialog] = useState(false);
  const [copyStagesDialog, setCopyStagesDialog] = useState(false);
  const [saveAsTemplateDialog, setSaveAsTemplateDialog] = useState<
    string | null
  >(null);

  // Clipboard state for copy/paste
  const [copiedStage, setCopiedStage] = useState<{
    stage_name: string;
    stage_icon: string | null;
    tasks: {
      title: string;
      completed: boolean;
    }[];
  } | null>(null);

  // Custom timer days input state
  const [customTimerDays, setCustomTimerDays] = useState<{
    stageId: string;
    days: string;
  } | null>(null);

  // Custom timer start date input state
  const [customTimerStartDate, setCustomTimerStartDate] = useState<{
    stageId: string;
    date: string;
  } | null>(null);

  // Add Task dialog state (with optional client/contact link)
  const [addTaskDialog, setAddTaskDialog] = useState<{
    stageId: string;
    title: string;
    taskType: "task" | "timer_tab";
    autoTimerDays: string;
    linkedClientId?: string | null;
    linkedContactId?: string | null;
    linkedLabel?: string;
  } | null>(null);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [allContacts, setAllContacts] = useState<
    { id: string; name: string }[]
  >([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end for task reordering
  const handleDragEnd = (
    event: DragEndEvent,
    stageId: string,
    stageTasks: ClientStageTask[],
  ) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stageTasks.findIndex((t) => t.id === active.id);
      const newIndex = stageTasks.findIndex((t) => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(stageTasks, oldIndex, newIndex);
        const taskIds = newOrder.map((t) => t.id);
        reorderTasks(stageId, taskIds);
      }
    }
  };
  const getStageIcon = (iconName: string | null) => {
    if (!iconName) return Phone;
    return iconMap[iconName] || Phone;
  };
  const handleToggleTask = async (task: ClientStageTask) => {
    const isTimerTab = isTimerTabTask(task);
    const hasTimerCount = Boolean(task.started_at || task.target_working_days);
    const shouldClearTimerOnUncomplete = isTimerTab && task.completed && hasTimerCount;
    const shouldAutoStartOnComplete =
      isTimerTab &&
      !task.completed &&
      !task.started_at &&
      !task.target_working_days &&
      Boolean(task.auto_timer_days && startTaskTimer);

    if (shouldClearTimerOnUncomplete) {
      const approved = confirm(
        "ביטול סימון ההשלמה ימחק את מניין הימים של טאב הטיימר. להמשיך?",
      );
      if (!approved) return;
    }

    const toggled = await toggleTask(task.id, {
      clearTimerOnUncomplete: shouldClearTimerOnUncomplete,
    });

    if (toggled && shouldAutoStartOnComplete && task.auto_timer_days) {
      await startTaskTimer?.(task.id, task.auto_timer_days);
    }
  };
  const handleAddTask = async (stageId: string) => {
    if (!addingTask || !addingTask.title.trim()) return;
    await addTask(stageId, addingTask.title);
    setAddingTask(null);
  };
  const updateTimerTabPresetDraft = (index: number, value: string) => {
    setTimerTabPresetDraft((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const resetTimerTabPresetDraft = () => {
    const defaults = [...TIMER_TAB_PRESET_DEFAULTS];
    setTimerTabPresetDraft(defaults.map(String));
    setTimerTabQuickDays(defaults);
  };
  const saveTimerTabPresetDraft = () => {
    const parsed = timerTabPresetDraft.map((item) =>
      Number.parseInt(item, 10),
    );
    const hasInvalid = parsed.some(
      (days) => !Number.isFinite(days) || days <= 0 || days > 365,
    );

    if (hasInvalid) {
      alert("יש להזין ערכים תקינים בין 1 ל-365 בכל הכפתורים.");
      return;
    }

    setTimerTabQuickDays(parsed);
    setTimerTabPresetEditorOpen(false);

    if (addTaskDialog?.taskType === "timer_tab" && !addTaskDialog.autoTimerDays) {
      setAddTaskDialog((prev) =>
        prev
          ? {
              ...prev,
              autoTimerDays: String(parsed[0]),
            }
          : null,
      );
    }
  };

  const handleOpenThemeManager = () => {
    setStageThemeDialogOpen(true);
    setEditingStageThemeId(null);
    setStageThemeDraft(createStageThemeDraft(activeStageTheme));
  };

  const handleStartCreateStageTheme = () => {
    setEditingStageThemeId(null);
    setStageThemeDraft(createStageThemeDraft(activeStageTheme));
  };

  const handleStartEditStageTheme = (themeId: string) => {
    const sourceTheme = stageBoardThemes.find((theme) => theme.id === themeId);
    if (!sourceTheme) return;
    setEditingStageThemeId(themeId);
    setStageThemeDraft({ ...sourceTheme });
  };

  const handleStageThemeColorChange = (
    key: StageThemeColorKey,
    value: string,
  ) => {
    pendingStageThemeColorUpdateRef.current = { key, value };

    if (stageThemeColorRafRef.current !== null) return;

    stageThemeColorRafRef.current = window.requestAnimationFrame(() => {
      stageThemeColorRafRef.current = null;
      const pending = pendingStageThemeColorUpdateRef.current;
      pendingStageThemeColorUpdateRef.current = null;
      if (!pending) return;

      setStageThemeDraft((prev) => {
        if (prev[pending.key] === pending.value) return prev;
        return {
          ...prev,
          [pending.key]: pending.value,
        };
      });
    });
  };

  useEffect(() => {
    return () => {
      if (stageThemeColorRafRef.current !== null) {
        window.cancelAnimationFrame(stageThemeColorRafRef.current);
      }
    };
  }, []);

  const handleSaveStageThemeDraft = () => {
    const fallback = STAGE_THEME_PRESETS[0];
    const persistedId =
      editingStageThemeId || stageThemeDraft.id || createStageThemeId();
    const persistedName =
      stageThemeDraft.name.trim() || "ערכת נושא מותאמת";

    const normalizedTheme = sanitizeStageTheme(
      {
        ...stageThemeDraft,
        id: persistedId,
        name: persistedName,
      },
      fallback,
      persistedId,
      persistedName,
    );

    setStageBoardThemesRaw((prev) => {
      const normalizedList = normalizeStageThemes(prev);
      if (editingStageThemeId) {
        return normalizedList.map((theme) =>
          theme.id === editingStageThemeId ? normalizedTheme : theme,
        );
      }

      const withoutDuplicateId = normalizedList.filter(
        (theme) => theme.id !== normalizedTheme.id,
      );
      return [...withoutDuplicateId, normalizedTheme];
    });

    setActiveStageThemeId(normalizedTheme.id);
    setEditingStageThemeId(normalizedTheme.id);
    setStageThemeDraft({ ...normalizedTheme });
  };

  const handleDuplicateStageTheme = (themeId: string) => {
    const sourceTheme = stageBoardThemes.find((theme) => theme.id === themeId);
    if (!sourceTheme) return;

    const duplicatedId = createStageThemeId();
    const duplicatedTheme = sanitizeStageTheme(
      {
        ...sourceTheme,
        id: duplicatedId,
        name: `${sourceTheme.name} העתק`,
      },
      STAGE_THEME_PRESETS[0],
      duplicatedId,
      `${sourceTheme.name} העתק`,
    );

    setStageBoardThemesRaw((prev) => [
      ...normalizeStageThemes(prev),
      duplicatedTheme,
    ]);
    setActiveStageThemeId(duplicatedTheme.id);
    setEditingStageThemeId(duplicatedTheme.id);
    setStageThemeDraft({ ...duplicatedTheme });
  };

  const handleDeleteStageTheme = (themeId: string) => {
    if (stageBoardThemes.length <= 1) {
      alert("חייבת להישאר לפחות ערכת נושא אחת.");
      return;
    }

    const themeToDelete = stageBoardThemes.find((theme) => theme.id === themeId);
    if (!themeToDelete) return;

    if (!confirm(`למחוק את ערכת הנושא \"${themeToDelete.name}\"?`)) {
      return;
    }

    const nextThemes = stageBoardThemes.filter((theme) => theme.id !== themeId);
    setStageBoardThemesRaw(nextThemes);

    if (activeStageThemeId === themeId) {
      setActiveStageThemeId(nextThemes[0].id);
    }

    if (editingStageThemeId === themeId) {
      setEditingStageThemeId(null);
      setStageThemeDraft(createStageThemeDraft(nextThemes[0]));
    }
  };

  const handleResetStageThemes = () => {
    const resetThemes = STAGE_THEME_PRESETS.map((theme) => ({ ...theme }));
    setStageBoardThemesRaw(resetThemes);
    setActiveStageThemeId(resetThemes[0].id);
    setEditingStageThemeId(null);
    setStageThemeDraft(createStageThemeDraft(resetThemes[0]));
  };

  const handleResetStageThemeDraftToDefault = () => {
    const defaultTheme = STAGE_THEME_PRESETS[0];

    setStageThemeDraft((prev) => {
      const preservedId = editingStageThemeId || prev.id || createStageThemeId();
      const preservedName = prev.name.trim() || `${defaultTheme.name} מותאם`;

      return sanitizeStageTheme(
        {
          ...defaultTheme,
          id: preservedId,
          name: preservedName,
        },
        defaultTheme,
        preservedId,
        preservedName,
      );
    });
  };

  const handleAddTaskFromDialog = async () => {
    if (!addTaskDialog || !addTaskDialog.title.trim()) return;
    const autoTimerDays = Number.parseInt(addTaskDialog.autoTimerDays, 10);
    if (
      addTaskDialog.taskType === "timer_tab" &&
      (!Number.isFinite(autoTimerDays) || autoTimerDays <= 0)
    ) {
      return;
    }
    await addTask(
      addTaskDialog.stageId,
      addTaskDialog.title,
      {
        linkedClientId: addTaskDialog.linkedClientId ?? null,
        linkedContactId: addTaskDialog.linkedContactId ?? null,
        taskType: addTaskDialog.taskType,
        autoTimerDays:
          addTaskDialog.taskType === "timer_tab" ? autoTimerDays : null,
      },
    );
    setAddTaskDialog(null);
  };
  // Lazy-load contacts list when add-task dialog is opened
  useEffect(() => {
    if (addTaskDialog && !contactsLoaded) {
      supabase
        .from("client_contacts")
        .select("id, name")
        .order("name")
        .then(({ data }) => {
          if (data) setAllContacts(data);
          setContactsLoaded(true);
        });
    }
  }, [addTaskDialog, contactsLoaded]);
  const handleBulkAdd = async () => {
    if (!bulkAddDialog || !bulkAddDialog.tasks.trim()) return;
    const titles = bulkAddDialog.tasks
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (titles.length > 0) {
      await addBulkTasks(bulkAddDialog.stageId, titles);
      setBulkAddDialog(null);
    }
  };
  const handleUpdateTask = async (taskId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    await updateTask(taskId, newTitle);
    setEditingTask(null);
  };
  const handleDeleteTask = async (taskId: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק משימה זו?")) {
      await deleteTask(taskId);
    }
  };

  // Selection handlers
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };
  const selectAllTasks = (tasks: ClientStageTask[]) => {
    setSelectedTasks(new Set(tasks.map((t) => t.id)));
  };
  const clearSelection = () => {
    setSelectedTasks(new Set());
  };
  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    if (confirm(`האם אתה בטוח שברצונך למחוק ${selectedTasks.size} משימות?`)) {
      await bulkDeleteTasks(Array.from(selectedTasks));
      clearSelection();
    }
  };
  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    const newStage = await addStage(newStageName, newStageIcon);
    // If a folder is selected, assign the new stage to it
    if (newStage && selectedFolderId) {
      await assignStageToFolder(newStage.stage_id, selectedFolderId);
      refresh();
    }
    setNewStageName("");
    setNewStageIcon("Phone");
    setAddStageDialog(false);
  };
  const handleBulkAddStages = async () => {
    if (!bulkStagesText.trim()) return;
    const names = bulkStagesText
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (names.length === 0) return;

    // Save values before closing dialog
    const icon = newStageIcon;
    const folderId = selectedFolderId;

    // Close dialog
    setBulkStagesText("");
    setNewStageIcon("Phone");
    setAddStageDialog(false);

    // Use addBulkStages with folder_id included directly in the insert
    const result = await addBulkStages(names, icon, folderId || null);

    if (result && folderId) {
      refresh();
    }
  };
  const handleDeleteStage = async (stageId: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק שלב זה וכל המשימות שבו?")) {
      await deleteStage(stageId);
    }
  };

  // Stage selection handlers
  const toggleStageSelection = (stageId: string) => {
    setSelectedStages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };
  const selectAllStages = () => {
    setSelectedStages(new Set(sortedStages.map((s) => s.stage_id)));
  };
  const clearStageSelection = () => {
    setSelectedStages(new Set());
  };
  const handleBulkDeleteStages = async () => {
    if (selectedStages.size === 0) return;
    if (
      confirm(
        `האם אתה בטוח שברצונך למחוק ${selectedStages.size} שלבים וכל המשימות שבהם?`,
      )
    ) {
      await bulkDeleteStages(Array.from(selectedStages));
      clearStageSelection();
    }
  };

  const selectedStageTasks = useMemo(
    () => stages.filter((s) => selectedStages.has(s.stage_id)).flatMap((s) => s.tasks || []),
    [stages, selectedStages],
  );

  // Stage management handlers
  const handleUpdateStage = async () => {
    if (!editingStage || !editingStage.name.trim()) return;
    await updateStage(
      editingStage.stageId,
      editingStage.name,
      editingStage.icon,
    );
    setEditingStage(null);
  };
  const handleMoveStage = (stageId: string, direction: "up" | "down") => {
    const currentIndex = sortedStages.findIndex((s) => s.stage_id === stageId);
    if (currentIndex === -1) return;
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedStages.length) return;
    const newOrder = [...sortedStages];
    const [removed] = newOrder.splice(currentIndex, 1);
    newOrder.splice(newIndex, 0, removed);
    reorderStages(newOrder.map((s) => s.stage_id));
  };
  const handleStageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedStages.findIndex((s) => s.stage_id === active.id);
      const newIndex = sortedStages.findIndex((s) => s.stage_id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(sortedStages, oldIndex, newIndex);
        reorderStages(newOrder.map((s) => s.stage_id));
      }
    }
  };
  const toggleTaskCount = (stageId: string) => {
    setShowTaskCount((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  // Copy stage handler
  const handleCopyStage = (stageId: string) => {
    const data = copyStageData(stageId);
    if (data) {
      setCopiedStage(data);
      // Also copy to system clipboard as JSON for cross-client paste
      navigator.clipboard.writeText(JSON.stringify(data)).catch(() => {});
    }
  };

  // Paste stage handler
  const handlePasteStage = async () => {
    if (copiedStage) {
      await pasteStageData(copiedStage);
    } else {
      // Try to read from system clipboard
      try {
        const text = await navigator.clipboard.readText();
        const data = JSON.parse(text);
        if (data.stage_name && Array.isArray(data.tasks)) {
          await pasteStageData(data);
        }
      } catch {
        // Clipboard doesn't contain valid stage data
      }
    }
  };

  // Keyboard shortcut for Ctrl+V to paste stage
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Only handle Ctrl+V when not in an input field
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        const activeElement = document.activeElement;
        const isInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement?.getAttribute("contenteditable") === "true";
        if (!isInput && copiedStage) {
          e.preventDefault();
          await handlePasteStage();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [copiedStage, pasteStageData]);
  const calculateProgress = (stage: (typeof stages)[0]) => {
    if (!stage.tasks || stage.tasks.length === 0) return 100;
    const completed = stage.tasks.filter((t) => t.completed).length;
    return Math.round((completed / stage.tasks.length) * 100);
  };

  // Sort stages for RTL (reverse order so first stage appears on the right)
  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.sort_order - b.sort_order),
    [stages],
  );

  // Calculate which stage is the first non-completed (active) stage
  const stageCompletionInfo = useMemo(() => {
    const info: Record<
      string,
      {
        isCompleted: boolean;
        progress: number;
      }
    > = {};
    sortedStages.forEach((stage) => {
      const progress = calculateProgress(stage);
      const hasIncompleteTask = (stage.tasks || []).some((task) => !task.completed);
      const isCompleted = !hasIncompleteTask;
      info[stage.stage_id] = {
        isCompleted,
        progress,
      };
    });
    return info;
  }, [sortedStages]);

  // Find the active stage index (first non-completed stage)
  const activeStageIndex = useMemo(() => {
    return sortedStages.findIndex(
      (stage) => (stage.tasks || []).some((task) => !task.completed),
    );
  }, [sortedStages]);

  // Get expanded stage data
  const expandedStageData = useMemo(
    () =>
      expandedStage
        ? sortedStages.find((s) => s.stage_id === expandedStage)
        : null,
    [expandedStage, sortedStages],
  );
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {/* Folder Tabs Bar */}
      <div
        className="flex items-center gap-2 flex-wrap pt-6 pb-2 px-2 bg-gradient-to-r from-[hsl(222,47%,14%)] to-[hsl(222,47%,18%)] rounded-xl border border-[hsl(222,47%,25%)]/50 relative"
        dir="rtl"
      >
        {/* Folder tabs */}
        {folders.map((folder, folderIndex) => {
          const folderStagesCount = allStages.filter(
            (s) => s.folder_id === folder.id,
          ).length;
          const isActive = selectedFolderId === folder.id;
          const isFirst = folderIndex === 0;
          const isLast = folderIndex === folders.length - 1;
          return (
            <div
              key={folder.id}
              className="relative group/folder flex flex-col items-center"
            >
              {/* Edit/Delete/Reorder buttons above the folder tab */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex gap-0.5 opacity-0 group-hover/folder:opacity-100 transition-opacity z-10">
                {/* Move right (earlier in RTL) */}
                {!isFirst && (
                  <button
                    className="h-5 w-5 flex items-center justify-center rounded bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                    title="הזז ימינה"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newFolders = [...folders];
                      [newFolders[folderIndex - 1], newFolders[folderIndex]] = [
                        newFolders[folderIndex],
                        newFolders[folderIndex - 1],
                      ];
                      reorderFolders(newFolders);
                    }}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
                {/* Move left (later in RTL) */}
                {!isLast && (
                  <button
                    className="h-5 w-5 flex items-center justify-center rounded bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                    title="הזז שמאלה"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newFolders = [...folders];
                      [newFolders[folderIndex], newFolders[folderIndex + 1]] = [
                        newFolders[folderIndex + 1],
                        newFolders[folderIndex],
                      ];
                      reorderFolders(newFolders);
                    }}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                )}
                <button
                  className="h-5 w-5 flex items-center justify-center rounded bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                  title="ערוך שם תיקייה"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolder({
                      id: folder.id,
                      name: folder.folder_name,
                    });
                    setRenameFolderDialog(true);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  className="h-5 w-5 flex items-center justify-center rounded bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white transition-colors"
                  title="מחק תיקייה"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm(`למחוק את התיקייה "${folder.folder_name}"?`))
                      return;
                    const folderStages = allStages.filter(
                      (s) => s.folder_id === folder.id,
                    );
                    for (const s of folderStages) {
                      await assignStageToFolder(s.id, null);
                    }
                    await deleteFolder(folder.id);
                    if (selectedFolderId === folder.id) {
                      setSelectedFolderId(null);
                    }
                    await refreshFolders();
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  "h-8 px-3 gap-2 rounded-lg transition-all font-medium",
                  isActive
                    ? "bg-gradient-to-r from-yellow-500/90 to-amber-500/90 text-slate-900 shadow-md shadow-yellow-500/20 hover:from-yellow-500 hover:to-amber-500"
                    : "text-slate-300 hover:text-white hover:bg-white/10",
                )}
                onClick={() => setSelectedFolderId(isActive ? null : folder.id)}
              >
                <Folder className="h-4 w-4" />
                {folder.folder_name}
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs h-5 px-1.5",
                    isActive
                      ? "bg-slate-900/20 text-slate-900"
                      : "bg-white/10 text-slate-400",
                  )}
                >
                  {folderStagesCount}
                </Badge>
              </Button>
            </div>
          );
        })}

        {/* Add folder button */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-3 gap-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg border border-dashed border-[hsl(222,47%,30%)] hover:border-yellow-500/50"
          onClick={() => setAddFolderDialog(true)}
        >
          <FolderPlus className="h-4 w-4" />
          תיקייה חדשה
        </Button>
      </div>

      {/* Stage Management Buttons */}
      <div className="flex justify-start gap-2 flex-wrap">
        {/* View Mode Toggle */}
        {onViewModeChange && (
          <>
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === "board" ? "default" : "ghost"}
                className="h-7 px-3"
                onClick={() => onViewModeChange("board")}
              >
                <LayoutGrid className="h-4 w-4 ml-1" />
                לוח
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
                className="h-7 px-3"
                onClick={() => onViewModeChange("list")}
              >
                <List className="h-4 w-4 ml-1" />
                רשימה
              </Button>
              <Button
                size="sm"
                variant={viewMode === "table" ? "default" : "ghost"}
                className="h-7 px-3"
                onClick={() => onViewModeChange("table")}
              >
                <Table className="h-4 w-4 ml-1" />
                טבלה
              </Button>
            </div>
            <div className="border-r border-border pr-2 mr-2" />
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddStageDialog(true)}
          className="h-8 w-8 p-0"
          title="הוסף שלב חדש"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setManageStagesDialog(true)}
          className="h-8 w-8 p-0"
          title="ניהול שלבים"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenThemeManager}
          className="h-8 w-8 p-0"
          title={`ערכת נושא פעילה: ${activeStageTheme.name}`}
        >
          <Palette className="h-4 w-4" style={{ color: activeStageTheme.iconColor }} />
        </Button>

        {/* Template Actions */}
        <div className="border-r border-border pr-2 mr-2" />
        <Button
          variant="outline"
          onClick={() => setApplyTemplateDialog(true)}
          className="gap-2"
        >
          <BookTemplate className="h-4 w-4" />
          הוסף מתבנית
        </Button>
        <Button
          variant="outline"
          onClick={() => setSaveAllStagesDialog(true)}
          className="gap-2"
        >
          <Layers className="h-4 w-4" />
          שמור כתבנית
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCopyStagesDialog(true)}
          className="h-8 w-8 p-0"
          title="העתק מלקוח"
        >
          <Copy className="h-4 w-4" />
        </Button>

        {/* Paste Stage Button */}
        {copiedStage && (
          <Button
            variant="outline"
            onClick={handlePasteStage}
            className="gap-2 bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
          >
            <ClipboardPaste className="h-4 w-4" />
            הדבק שלב ({copiedStage.stage_name})
          </Button>
        )}

        {/* Toggle show all stages */}
        <div className="border-r border-border pr-2 mr-2" />
        <Button
          variant={showAllStages ? "default" : "outline"}
          onClick={() => setShowAllStages(!showAllStages)}
          className="gap-2"
          style={
            showAllStages
              ? {
                  backgroundColor: activeStageTheme.progressColor,
                  color: activeStageTheme.headerTextColor,
                }
              : {}
          }
        >
          {showAllStages ? (
            <>
              <Eye className="h-4 w-4" />
              הסתר שלבים
            </>
          ) : (
            <>
              <Layers className="h-4 w-4" />
              הצג כל השלבים ({sortedStages.length})
            </>
          )}
        </Button>

        {/* Toggle hide completed tasks */}
        <Button
          variant={hideCompletedTasks ? "default" : "outline"}
          size="sm"
          onClick={() => setHideCompletedTasks((v) => !v)}
          className="gap-2"
          title={hideCompletedTasks ? "הצג הושלמו" : "הסתר הושלמו"}
          style={
            hideCompletedTasks
              ? {
                  backgroundColor: activeStageTheme.progressColor,
                  color: activeStageTheme.headerTextColor,
                }
              : {}
          }
        >
          {hideCompletedTasks ? (
            <>
              <Eye className="h-4 w-4" />
              הצג הושלמו
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" />
              הסתר הושלמו
            </>
          )}
        </Button>

        {/* Toggle summary frame (open tasks from started stages) */}
        <Button
          variant={showSummaryFrame ? "default" : "outline"}
          size="sm"
          onClick={() => setShowSummaryFrame((v) => !v)}
          className="gap-2"
          title="הצג/הסתר מסגרת סיכום משימות פתוחות מהשלבים שהתחלת"
          style={
            showSummaryFrame
              ? {
                  backgroundColor: activeStageTheme.progressColor,
                  color: activeStageTheme.headerTextColor,
                }
              : {}
          }
        >
          <ListChecks className="h-4 w-4" />
          סיכום פתוחות
        </Button>

        {/* Sync payment tasks from signed quotes */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          title="סנכרן משימות תשלום מהצעות חתומות (יוצר משימות חסרות ומחבר סכומים)"
          onClick={async () => {
            try {
              const { syncPaymentTasksForClient } = await import("@/lib/syncPaymentTasksForClient");
              const r = await syncPaymentTasksForClient(clientId);
              await refresh();
              toast({
                title: "✅ סנכרון תשלומים הושלם",
                description: `נוצרו ${r.tasksCreated} משימות • חוברו ${r.tasksLinked} סכומים • ${r.quotesProcessed} הצעות`,
              });
            } catch (e: any) {
              toast({
                title: "שגיאה בסנכרון",
                description: e?.message || "נסה שוב",
                variant: "destructive",
              });
            }
          }}
        >
          <Wallet className="h-4 w-4" />
          סנכרן תשלומים
        </Button>




        {/* Columns count selector */}
        {showAllStages && (
          <div className="flex items-center gap-1 border rounded-md">
            {[2, 3, 4, 5, 6].map((count) => (
              <Button
                key={count}
                size="sm"
                variant={columnsCount === count ? "default" : "ghost"}
                className="h-8 w-8 p-0"
                style={
                  columnsCount === count
                    ? {
                        backgroundColor: activeStageTheme.progressColor,
                        color: activeStageTheme.headerTextColor,
                      }
                    : {}
                }
                onClick={() => setColumnsCount(count)}
              >
                {count}
              </Button>
            ))}
          </div>
        )}

        {/* Select All - inline */}
        {sortedStages.length > 0 && (
          <>
            <div className="border-r border-border pr-2 mr-2" />
            <Checkbox
              checked={
                selectedStages.size === sortedStages.length &&
                sortedStages.length > 0
              }
              onCheckedChange={(checked) => {
                if (checked) {
                  selectAllStages();
                } else {
                  clearStageSelection();
                }
              }}
            />
            <span className="text-sm text-muted-foreground">בחר הכל</span>

            {selectedStages.size > 0 && (
              <>
                <Badge variant="secondary">
                  {selectedStages.size} שלבים נבחרו ({selectedStageTasks.length} משימות)
                </Badge>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    const ids = selectedStageTasks.map((t) => t.id);
                    if (ids.length === 0) return;
                    bulkSetTasksCompleted(ids, true).then(() => clearStageSelection());
                  }}
                  disabled={selectedStageTasks.length === 0}
                  className="gap-1"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  סמן הכל כהושלם
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const ids = selectedStageTasks.map((t) => t.id);
                    if (ids.length === 0) return;
                    bulkSetTasksCompleted(ids, false).then(() => clearStageSelection());
                  }}
                  disabled={selectedStageTasks.length === 0}
                  className="gap-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  בטל הכל הושלם
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDeleteStages}
                  className="gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  מחק נבחרים
                </Button>
                <Button size="sm" variant="outline" onClick={clearStageSelection}>
                  בטל בחירה
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {/* Stages Grid - RTL direction */}
      {!stageThemeDialogOpen && (
      <div
        className={cn(
          "grid gap-4",
          showAllStages
            ? getGridColumnsClass()
            : "grid-cols-1 max-w-md mr-0 ml-auto",
        )}
        dir="rtl"
      >
        {showAllStages && showSummaryFrame && (() => {
          const startedStages = sortedStages.filter((s) => {
            const tasks = s.tasks || [];
            const done = tasks.filter((t) => t.completed).length;
            return done > 0 && done < tasks.length;
          });
          const openItems = startedStages.flatMap((s) =>
            (s.tasks || [])
              .filter((t) => !t.completed)
              .map((t) => ({ task: t, stage: s })),
          );
          const totalOpen = openItems.length;
          return (
            <Card
              className="relative flex flex-col h-full transition-all duration-300 border-2 border-dashed"
              style={{
                borderColor: activeStageTheme.activeBorderColor,
                backgroundColor: activeStageTheme.activeCardBackgroundColor,
              }}
            >
              <div
                className="px-3 py-2 rounded-t-lg flex items-center justify-between gap-2"
                style={{
                  background: `linear-gradient(135deg, ${activeStageTheme.activeHeaderFromColor}, ${activeStageTheme.activeHeaderToColor})`,
                  color: activeStageTheme.activeHeaderTextColor,
                  borderBottom: `1px solid ${activeStageTheme.activeBorderColor}`,
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ListChecks className="h-4 w-4 shrink-0" />
                  <span className="font-semibold truncate">סיכום משימות פתוחות</span>
                </div>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: activeStageTheme.activeBadgeBackgroundColor,
                    color: activeStageTheme.activeBadgeTextColor,
                  }}
                >
                  {totalOpen}
                </Badge>
              </div>
              <CardContent className="flex-1 p-3 overflow-y-auto max-h-[500px]">
                {totalOpen === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-6">
                    אין משימות פתוחות בשלבים שבתהליך
                  </div>
                ) : (
                  <div className="space-y-3">
                    {startedStages.map((s) => {
                      const openInStage = (s.tasks || []).filter((t) => !t.completed);
                      if (openInStage.length === 0) return null;
                      const SIcon = getStageIcon(s.stage_icon);
                      return (
                        <div key={s.stage_id} className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <SIcon className="h-3.5 w-3.5" />
                            <span className="truncate">{s.stage_name}</span>
                            <span className="opacity-60">({openInStage.length})</span>
                          </div>
                          <div className="space-y-1">
                            {openInStage.map((task) => (
                              <div
                                key={task.id}
                                className="flex items-start gap-2 text-sm p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                                onClick={() => handleToggleTask(task)}
                              >
                                <Checkbox
                                  checked={false}
                                  className="mt-0.5 shrink-0"
                                  onCheckedChange={() => handleToggleTask(task)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="flex-1 leading-snug">{task.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}
        {(showAllStages
          ? sortedStages
          : sortedStages.filter((s) => s.stage_id === "contact")
        ).map((stage, index) => {
          const Icon = getStageIcon(stage.stage_icon);
          const progress = calculateProgress(stage);
          const completedTasks =
            stage.tasks?.filter((t) => t.completed).length || 0;
          const totalTasks = stage.tasks?.length || 0;
          const isHovered = hoveredStage === stage.stage_id;
          const isCustomStage = stage.stage_id.startsWith("custom_");

          // New stage status logic
          const isStageCompleted =
            stageCompletionInfo[stage.stage_id]?.isCompleted || false;
          const isActiveStage = index === activeStageIndex;
          const isFutureStage =
            activeStageIndex !== -1 && index > activeStageIndex;
          const isPastStage =
            activeStageIndex !== -1 && index < activeStageIndex && !isStageCompleted;
          const isActiveUncompleted = isActiveStage && !isStageCompleted;

          const effectiveBorderColor = isActiveUncompleted
            ? activeStageTheme.activeBorderColor
            : isStageCompleted
              ? activeStageTheme.progressColor
              : activeStageTheme.borderColor;
          const effectiveCardBackgroundColor = isActiveUncompleted
            ? activeStageTheme.activeCardBackgroundColor
            : activeStageTheme.cardBackgroundColor;
          const effectiveHeaderFromColor = isActiveUncompleted
            ? activeStageTheme.activeHeaderFromColor
            : activeStageTheme.headerFromColor;
          const effectiveHeaderToColor = isActiveUncompleted
            ? activeStageTheme.activeHeaderToColor
            : activeStageTheme.headerToColor;
          const effectiveHeaderTextColor = isActiveUncompleted
            ? activeStageTheme.activeHeaderTextColor
            : activeStageTheme.headerTextColor;
          const effectiveProgressColor = isActiveUncompleted
            ? activeStageTheme.activeProgressColor
            : activeStageTheme.progressColor;
          const effectiveBadgeBackgroundColor = isActiveUncompleted
            ? activeStageTheme.activeBadgeBackgroundColor
            : activeStageTheme.badgeBackgroundColor;
          const effectiveBadgeTextColor = isActiveUncompleted
            ? activeStageTheme.activeBadgeTextColor
            : activeStageTheme.badgeTextColor;

          const cardStyle: React.CSSProperties = {
            borderColor: effectiveBorderColor,
            backgroundColor: effectiveCardBackgroundColor,
            boxShadow:
              isActiveUncompleted
                ? `0 0 0 1px ${activeStageTheme.activeGlowColor}66, 0 10px 24px ${activeStageTheme.activeGlowColor}44`
                : undefined,
          };

          const headerStyle: React.CSSProperties = {
            background: `linear-gradient(135deg, ${effectiveHeaderFromColor}, ${effectiveHeaderToColor})`,
            color: effectiveHeaderTextColor,
            borderBottom: `1px solid ${effectiveBorderColor}`,
            opacity: isFutureStage ? 0.75 : 1,
            filter:
              isStageCompleted
                ? "saturate(0.8) brightness(0.95)"
                : isActiveUncompleted
                  ? "saturate(1.1)"
                  : undefined,
          };

          return (
            <Card
              key={stage.id}
              className={cn(
                "relative flex flex-col h-full transition-all duration-300 border-2",
                // Selected stage highlight
                selectedStages.has(stage.stage_id) &&
                  "ring-2 ring-primary ring-offset-2",
                // Completed stage style emphasis
                isStageCompleted && "border-[3px] shadow-md",
                // Active stage emphasis
                isActiveStage &&
                  !isStageCompleted &&
                  "shadow-lg",
                // Future stages: slightly faded card
                isFutureStage && "opacity-[0.98]",
                // Past unresolved stage emphasis
                isPastStage && "ring-1 ring-amber-500/50",
              )}
              style={cardStyle}
              onMouseEnter={() => setHoveredStage(stage.stage_id)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              {/* Selection Checkbox - Top left corner, visible on hover or when selected */}
                  {(isHovered || selectedStages.has(stage.stage_id)) && (
                    <div className="absolute top-2 left-2 z-30">
                  <Checkbox
                    checked={selectedStages.has(stage.stage_id)}
                    onCheckedChange={() => toggleStageSelection(stage.stage_id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded-full border border-white/80 bg-white/85 shadow-[0_1px_4px_rgba(15,23,42,0.14)] ring-1 ring-primary/15 cursor-pointer transition-all hover:ring-primary/30 data-[state=checked]:border-emerald-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white [&_svg]:h-2.5 [&_svg]:w-2.5"
                  />
                </div>
              )}
              {/* Header - Clickable to expand */}
              <div
                className="p-4 rounded-t-lg relative cursor-pointer transition-all hover:opacity-90"
                style={headerStyle}
                onClick={() => setExpandedStage(stage.stage_id)}
              >
                {/* Completed indicator */}
                {isStageCompleted && (
                  <div className="absolute top-2 left-2">
                    <CheckCircle2
                      className="h-6 w-6"
                      style={{ color: effectiveProgressColor }}
                    />
                  </div>
                )}

                {/* Timer Display - Top Left - Always visible if timer is active */}
                {Boolean(stage.started_at && stage.target_working_days) && (
                  <div className="absolute top-2 left-2 z-10 bg-transparent border-accent">
                    <StageTimerDisplay
                      startedAt={stage.started_at}
                      targetDays={stage.target_working_days}
                      displayStyle={stage.timer_display_style}
                      onStyleChange={() => cycleStageTimerStyle(stage.stage_id)}
                      size="lg"
                    />
                  </div>
                )}

                {/* Header Actions - visible on hover - Bottom Right */}
                {isHovered && (
                  <div
                    className="absolute bottom-2 right-2 z-20 grid w-fit max-w-[180px] grid-cols-4 justify-items-center gap-1 rounded-lg border border-white/30 bg-black/15 p-1.5 shadow-sm backdrop-blur-sm"
                    style={{ color: effectiveHeaderTextColor }}
                  >
                    {/* Edit Stage Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingStage({
                          stageId: stage.stage_id,
                          name: stage.stage_name,
                          icon: stage.stage_icon || "Phone",
                        });
                        setManageStagesDialog(true);
                      }}
                      className={cn(
                        "h-5 w-5 p-0 rounded-sm",
                        isActiveStage &&
                          !isStageCompleted &&
                          "hover:bg-white/20",
                      )}
                      title="ערוך שלב"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                    </Button>
                    {/* Delete Stage Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStage(stage.stage_id);
                      }}
                      className={cn(
                        "h-5 w-5 p-0 rounded-sm hover:text-destructive",
                        isActiveStage &&
                          !isStageCompleted &&
                          "hover:bg-white/20",
                      )}
                      title="מחק שלב"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                    {/* Copy Stage Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyStage(stage.stage_id);
                      }}
                      className={cn(
                        "h-5 w-5 p-0 rounded-sm hover:text-green-600",
                        isActiveStage &&
                          !isStageCompleted &&
                          "hover:bg-white/20",
                      )}
                      title="העתק שלב (Ctrl+C)"
                    >
                      <Clipboard className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCount(stage.stage_id);
                      }}
                      className={cn(
                        "h-5 w-5 p-0 rounded-sm",
                        isActiveStage &&
                          !isStageCompleted &&
                          "hover:bg-white/20",
                      )}
                      title="מספר משימות"
                    >
                      <Hash className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedStage(stage.stage_id);
                      }}
                      className={cn(
                        "h-5 w-5 p-0 rounded-sm",
                        isActiveStage &&
                          !isStageCompleted &&
                          "hover:bg-white/20",
                      )}
                      title="הרחב תצוגה"
                    >
                      <Maximize2 className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSaveAsTemplateDialog(stage.stage_id);
                      }}
                      className={cn(
                        "h-5 w-5 p-0 rounded-sm",
                        isActiveStage &&
                          !isStageCompleted &&
                          "hover:bg-white/20",
                      )}
                      title="שמור כתבנית"
                    >
                      <BookTemplate className="h-2.5 w-2.5" />
                    </Button>

                    {/* Move to Folder */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "h-5 w-5 p-0 rounded-sm",
                            isActiveStage &&
                              !isStageCompleted &&
                              "hover:bg-white/20",
                            stage.folder_id && "text-amber-400",
                          )}
                          title="העבר לתיקייה"
                        >
                          <Folder className="h-2.5 w-2.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-1" align="end">
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-center py-1 text-muted-foreground">
                            העבר לתיקייה
                          </p>
                          <button
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted/50 transition-colors text-right",
                              !stage.folder_id &&
                                "bg-amber-500/10 text-amber-500 font-medium",
                            )}
                            onClick={async (e) => {
                              e.stopPropagation();
                              await assignStageToFolder(stage.id, null);
                              refresh();
                            }}
                          >
                            <Layers className="h-3.5 w-3.5" />
                            ללא תיקייה
                          </button>
                          {folders.map((f) => (
                            <button
                              key={f.id}
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted/50 transition-colors text-right",
                                stage.folder_id === f.id &&
                                  "bg-amber-500/10 text-amber-500 font-medium",
                              )}
                              onClick={async (e) => {
                                e.stopPropagation();
                                await assignStageToFolder(stage.id, f.id);
                                refresh();
                              }}
                            >
                              <Folder className="h-3.5 w-3.5" />
                              {f.folder_name}
                            </button>
                          ))}
                          {folders.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              אין תיקיות. צור תיקייה חדשה למעלה.
                            </p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Timer Controls - in hover actions */}
                    {!stage.started_at ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn(
                              "h-5 w-5 p-0 rounded-sm",
                              isActiveStage &&
                                !isStageCompleted &&
                                "hover:bg-white/20",
                            )}
                            title="הפעל טיימר ימים"
                          >
                            <Timer className="h-2.5 w-2.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2" align="end">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-center mb-2">
                              בחר ימי יעד
                            </p>

                            {/* Predefined options */}
                            <div className="grid grid-cols-2 gap-1">
                              {TARGET_DAYS_OPTIONS.map((option) => (
                                <Button
                                  key={option.value}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-center text-xs h-7"
                                  onClick={() =>
                                    startStageTimer(
                                      stage.stage_id,
                                      option.value,
                                      customTimerStartDate?.stageId ===
                                        stage.stage_id
                                        ? customTimerStartDate.date || undefined
                                        : undefined,
                                    )
                                  }
                                >
                                  {option.value} ימים
                                </Button>
                              ))}
                            </div>

                            {/* Custom days input */}
                            <div className="border-t pt-2 mt-2">
                              <p className="text-xs text-muted-foreground mb-1 text-center">
                                או הזן מספר אישי:
                              </p>
                              <div className="flex gap-1">
                                <Input
                                  type="number"
                                  min="1"
                                  max="365"
                                  placeholder="ימים"
                                  className="h-7 text-xs text-center"
                                  value={
                                    customTimerDays?.stageId === stage.stage_id
                                      ? customTimerDays.days
                                      : ""
                                  }
                                  onChange={(e) =>
                                    setCustomTimerDays({
                                      stageId: stage.stage_id,
                                      days: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === "Enter" &&
                                      customTimerDays?.days
                                    ) {
                                      const days = Number.parseInt(
                                        customTimerDays.days,
                                      );
                                      if (days > 0 && days <= 365) {
                                        startStageTimer(
                                          stage.stage_id,
                                          days,
                                          customTimerStartDate?.stageId ===
                                            stage.stage_id
                                            ? customTimerStartDate.date ||
                                                undefined
                                            : undefined,
                                        );
                                        setCustomTimerDays(null);
                                      }
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  className="h-7 px-2"
                                  disabled={
                                    !customTimerDays?.days ||
                                    Number.parseInt(customTimerDays.days) <= 0
                                  }
                                  onClick={() => {
                                    if (customTimerDays?.days) {
                                      const days = Number.parseInt(
                                        customTimerDays.days,
                                      );
                                      if (days > 0 && days <= 365) {
                                        startStageTimer(
                                          stage.stage_id,
                                          days,
                                          customTimerStartDate?.stageId ===
                                            stage.stage_id
                                            ? customTimerStartDate.date ||
                                                undefined
                                            : undefined,
                                        );
                                        setCustomTimerDays(null);
                                      }
                                    }
                                  }}
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Custom start date input */}
                            <div className="border-t pt-2 mt-2">
                              <p className="text-xs text-muted-foreground mb-1 text-center">
                                תאריך התחלה (אופציונלי):
                              </p>
                              <Input
                                type="date"
                                className="h-7 text-xs"
                                value={
                                  customTimerStartDate?.stageId ===
                                  stage.stage_id
                                    ? customTimerStartDate.date
                                    : ""
                                }
                                onChange={(e) =>
                                  setCustomTimerStartDate({
                                    stageId: stage.stage_id,
                                    date: e.target.value,
                                  })
                                }
                              />
                              {customTimerStartDate?.stageId ===
                                stage.stage_id &&
                                customTimerStartDate.date && (
                                  <p className="text-xs text-blue-500 mt-1 text-center">
                                    מתחיל מ-
                                    {new Date(
                                      customTimerStartDate.date,
                                    ).toLocaleDateString("he-IL")}
                                  </p>
                                )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          stopStageTimer(stage.stage_id);
                        }}
                        className={cn(
                          "h-5 w-5 p-0 rounded-sm hover:text-red-500",
                          isActiveStage &&
                            !isStageCompleted &&
                            "hover:bg-white/20",
                        )}
                        title="עצור טיימר"
                      >
                        <Square className="h-2.5 w-2.5" />
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div
                    className="p-2 rounded-lg shadow-sm"
                    style={{ backgroundColor: activeStageTheme.iconBackgroundColor }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: activeStageTheme.iconColor }}
                    />
                  </div>
                </div>

                <h3
                  className="font-semibold text-lg mb-2 text-right"
                  style={{ color: effectiveHeaderTextColor }}
                >
                  {stage.stage_name}
                </h3>

                <div className="flex items-center justify-end mb-2">
                  {isStageCompleted ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-transparent"
                      style={{
                        backgroundColor: activeStageTheme.badgeBackgroundColor,
                        color: activeStageTheme.badgeTextColor,
                      }}
                    >
                      הושלם
                    </Badge>
                  ) : isActiveStage ? (
                    <Badge
                      className="text-[10px] border-transparent"
                      style={{
                        backgroundColor: activeStageTheme.activeBadgeBackgroundColor,
                        color: activeStageTheme.activeBadgeTextColor,
                      }}
                    >
                      שלב פעיל עכשיו
                    </Badge>
                  ) : isFutureStage ? (
                    <Badge variant="outline" className="text-[10px]">
                      שלב עתידי
                    </Badge>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 justify-end">
                  {/* Progress Circle */}
                  <div className="relative w-12 h-12">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke={activeStageTheme.progressTrackColor}
                        strokeWidth="3"
                        fill="none"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke={effectiveProgressColor}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                        strokeDasharray={2 * Math.PI * 20}
                        strokeDashoffset={
                          2 * Math.PI * 20 * (1 - progress / 100)
                        }
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-xs font-bold"
                        style={{ color: effectiveHeaderTextColor }}
                      >
                        {progress}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge
                      variant="secondary"
                      className="text-xs border-transparent"
                      style={{
                        backgroundColor: effectiveBadgeBackgroundColor,
                        color: effectiveBadgeTextColor,
                      }}
                    >
                      {completedTasks}/{totalTasks}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Tasks List with Drag and Drop */}
              <CardContent className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[500px]">
                {(() => { const visibleTasks = filterTasks(stage.tasks); return visibleTasks.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) =>
                      handleDragEnd(event, stage.stage_id, stage.tasks || [])
                    }
                  >
                    <SortableContext
                      items={visibleTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {visibleTasks.map((task, index) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            stage={stage}
                            index={index}
                            showTaskCount={
                              showTaskCount[stage.stage_id] || false
                            }
                            clientId={clientId}
                            editingTask={editingTask}
                            setEditingTask={setEditingTask}
                            handleToggleTask={handleToggleTask}
                            handleUpdateTask={handleUpdateTask}
                            handleDeleteTask={handleDeleteTask}
                            updateTaskStyle={updateTaskStyle}
                            updateTaskCompletedDate={updateTaskCompletedDate}
                            startTaskTimer={startTaskTimer}
                            stopTaskTimer={stopTaskTimer}
                            cycleTaskTimerStyle={cycleTaskTimerStyle}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="text-center text-sm text-gray-500 py-8">
                    {hideCompletedTasks && (stage.tasks?.length || 0) > 0 ? "כל המשימות הושלמו" : "אין משימות"}
                  </div>
                ); })()}

                {/* Add Task Section */}
                <div className="pt-2 border-t">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        setAddTaskDialog({
                          stageId: stage.stage_id,
                          title: "",
                          taskType: "task",
                          autoTimerDays: "",
                        })
                      }
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      הוסף משימה / טאב
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setBulkAddDialog({
                          stageId: stage.stage_id,
                          tasks: "",
                        })
                      }
                      title="הוסף משימות מרובות"
                    >
                      <ListPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      {/* Expanded Stage Dialog */}
      <Dialog
        open={expandedStage !== null}
        onOpenChange={() => {
          setExpandedStage(null);
          clearSelection();
        }}
      >
        <DialogContent
          className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col"
          dir="rtl"
        >
          {expandedStageData &&
            (() => {
              const Icon = getStageIcon(expandedStageData.stage_icon);
              const progress = calculateProgress(expandedStageData);
              const completedTasks =
                expandedStageData.tasks?.filter((t) => t.completed).length || 0;
              const totalTasks = expandedStageData.tasks?.length || 0;
              const allSelected =
                expandedStageData.tasks &&
                expandedStageData.tasks.length > 0 &&
                expandedStageData.tasks.every((t) => selectedTasks.has(t.id));
              return (
                <>
                  {/* Expanded Header */}
                  <div
                    className="p-6 -m-6 mb-4 rounded-t-lg"
                    style={{
                      background: `linear-gradient(135deg, ${activeStageTheme.headerFromColor}, ${activeStageTheme.headerToColor})`,
                      color: activeStageTheme.headerTextColor,
                      borderBottom: `1px solid ${activeStageTheme.borderColor}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setExpandedStage(null);
                          clearSelection();
                        }}
                        className="h-8 w-8 p-0 hover:bg-white/20"
                        style={{ color: activeStageTheme.headerTextColor }}
                      >
                        <X className="h-5 w-5" />
                      </Button>

                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <h2
                            className="text-2xl font-bold"
                            style={{ color: activeStageTheme.headerTextColor }}
                          >
                            {expandedStageData.stage_name}
                          </h2>
                          <p
                            className="text-sm"
                            style={{ color: activeStageTheme.headerTextColor }}
                          >
                            {completedTasks} מתוך {totalTasks} משימות הושלמו (
                            {progress}%)
                          </p>
                        </div>

                        <div
                          className="p-3 rounded-lg shadow-sm"
                          style={{ backgroundColor: activeStageTheme.iconBackgroundColor }}
                        >
                          <Icon
                            className="h-8 w-8"
                            style={{ color: activeStageTheme.iconColor }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: activeStageTheme.progressTrackColor }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: activeStageTheme.progressColor,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stage Timer Controls */}
                    <div className="mt-4 flex items-center justify-end gap-2">
                      {expandedStageData.started_at &&
                      expandedStageData.target_working_days ? (
                        <>
                          <StageTimerDisplay
                            startedAt={expandedStageData.started_at}
                            targetDays={expandedStageData.target_working_days}
                            displayStyle={expandedStageData.timer_display_style}
                            onStyleChange={() =>
                              cycleStageTimerStyle(expandedStageData.stage_id)
                            }
                            size="lg"
                            className="bg-white/90 text-gray-800"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs hover:bg-white/20"
                            style={{ color: activeStageTheme.headerTextColor }}
                            onClick={() =>
                              stopStageTimer(expandedStageData.stage_id)
                            }
                          >
                            <Square className="h-3.5 w-3.5 ml-1" />
                            עצור טיימר
                          </Button>
                        </>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-xs"
                              style={{
                                backgroundColor: activeStageTheme.iconBackgroundColor,
                                color: activeStageTheme.iconColor,
                              }}
                            >
                              <Timer className="h-3.5 w-3.5 ml-1" />
                              הפעל טיימר ימים
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-60 p-2" align="end">
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-center mb-2">
                                בחר ימי יעד לשלב
                              </p>

                              {/* Predefined options */}
                              <div className="grid grid-cols-2 gap-1">
                                {TARGET_DAYS_OPTIONS.map((option) => (
                                  <Button
                                    key={option.value}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-center text-xs h-7"
                                    onClick={() => {
                                      startStageTimer(
                                        expandedStageData.stage_id,
                                        option.value,
                                        customTimerStartDate?.stageId ===
                                          expandedStageData.stage_id
                                          ? customTimerStartDate.date ||
                                              undefined
                                          : undefined,
                                      );
                                    }}
                                  >
                                    {option.value} ימים
                                  </Button>
                                ))}
                              </div>

                              {/* Custom days input */}
                              <div className="border-t pt-2 mt-2">
                                <p className="text-xs text-muted-foreground mb-1 text-center">
                                  או הזן מספר אישי:
                                </p>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="365"
                                    placeholder="ימים"
                                    className="h-7 text-xs text-center"
                                    value={
                                      customTimerDays?.stageId ===
                                      expandedStageData.stage_id
                                        ? customTimerDays.days
                                        : ""
                                    }
                                    onChange={(e) =>
                                      setCustomTimerDays({
                                        stageId: expandedStageData.stage_id,
                                        days: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (
                                        e.key === "Enter" &&
                                        customTimerDays?.days
                                      ) {
                                        const days = Number.parseInt(
                                          customTimerDays.days,
                                        );
                                        if (days > 0 && days <= 365) {
                                          startStageTimer(
                                            expandedStageData.stage_id,
                                            days,
                                            customTimerStartDate?.stageId ===
                                              expandedStageData.stage_id
                                              ? customTimerStartDate.date ||
                                                  undefined
                                              : undefined,
                                          );
                                          setCustomTimerDays(null);
                                        }
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    className="h-7 px-2"
                                    disabled={
                                      !customTimerDays?.days ||
                                      Number.parseInt(customTimerDays.days) <= 0
                                    }
                                    onClick={() => {
                                      if (customTimerDays?.days) {
                                        const days = Number.parseInt(
                                          customTimerDays.days,
                                        );
                                        if (days > 0 && days <= 365) {
                                          startStageTimer(
                                            expandedStageData.stage_id,
                                            days,
                                            customTimerStartDate?.stageId ===
                                              expandedStageData.stage_id
                                              ? customTimerStartDate.date ||
                                                  undefined
                                              : undefined,
                                          );
                                          setCustomTimerDays(null);
                                        }
                                      }
                                    }}
                                  >
                                    <Play className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Custom start date input */}
                              <div className="border-t pt-2 mt-2">
                                <p className="text-xs text-muted-foreground mb-1 text-center">
                                  תאריך התחלה (אופציונלי):
                                </p>
                                <Input
                                  type="date"
                                  className="h-7 text-xs"
                                  value={
                                    customTimerStartDate?.stageId ===
                                    expandedStageData.stage_id
                                      ? customTimerStartDate.date
                                      : ""
                                  }
                                  onChange={(e) =>
                                    setCustomTimerStartDate({
                                      stageId: expandedStageData.stage_id,
                                      date: e.target.value,
                                    })
                                  }
                                />
                                {customTimerStartDate?.stageId ===
                                  expandedStageData.stage_id &&
                                  customTimerStartDate.date && (
                                    <p className="text-xs text-blue-500 mt-1 text-center">
                                      מתחיל מ-
                                      {new Date(
                                        customTimerStartDate.date,
                                      ).toLocaleDateString("he-IL")}
                                    </p>
                                  )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>

                  {/* View Tabs */}
                  <Tabs
                    value={expandedViewMode}
                    onValueChange={(v) =>
                      setExpandedViewMode(v as "cards" | "table")
                    }
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <TabsList>
                        <TabsTrigger value="cards" className="gap-2">
                          <LayoutList className="h-4 w-4" />
                          כרטיסים
                        </TabsTrigger>
                        <TabsTrigger value="table" className="gap-2">
                          <Table2 className="h-4 w-4" />
                          טבלה
                        </TabsTrigger>
                      </TabsList>

                      {/* Multi-select actions */}
                      {selectedTasks.size > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {selectedTasks.size} נבחרו
                          </Badge>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleBulkDelete}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            מחק נבחרים
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={clearSelection}
                          >
                            בטל בחירה
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Cards View */}
                    <TabsContent
                      value="cards"
                      className="flex-1 overflow-y-auto space-y-3 mt-0"
                    >
                      {/* Select All */}
                      {expandedStageData.tasks &&
                        expandedStageData.tasks.length > 0 && (
                          <div className="flex items-center gap-2 pb-2 border-b">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={() => {
                                if (allSelected) {
                                  clearSelection();
                                } else {
                                  selectAllTasks(expandedStageData.tasks || []);
                                }
                              }}
                            />
                            <span className="text-sm text-muted-foreground">
                              בחר הכל
                            </span>
                          </div>
                        )}

                      {expandedStageData.tasks &&
                      expandedStageData.tasks.length > 0 ? (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) =>
                            handleDragEnd(
                              event,
                              expandedStageData.stage_id,
                              expandedStageData.tasks || [],
                            )
                          }
                        >
                          <SortableContext
                            items={filterTasks(expandedStageData.tasks).map((t) => t.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {filterTasks(expandedStageData.tasks).map((task, index) => (
                              <div
                                key={task.id}
                                className="flex items-center gap-2"
                              >
                                <Checkbox
                                  checked={selectedTasks.has(task.id)}
                                  onCheckedChange={() =>
                                    toggleTaskSelection(task.id)
                                  }
                                  className="shrink-0"
                                />
                                <div className="flex-1">
                                  <SortableExpandedTaskItem
                                    task={task}
                                    stageId={expandedStageData.stage_id}
                                    stageName={expandedStageData.stage_name}
                                    index={index}
                                    showTaskCount={
                                      showTaskCount[
                                        expandedStageData.stage_id
                                      ] || false
                                    }
                                    clientId={clientId}
                                    setEditingTask={setEditingTask}
                                    handleToggleTask={handleToggleTask}
                                    handleDeleteTask={handleDeleteTask}
                                    startTaskTimer={startTaskTimer}
                                    cycleTaskTimerStyle={cycleTaskTimerStyle}
                                  />
                                </div>
                              </div>
                            ))}
                          </SortableContext>
                        </DndContext>
                      ) : (
                        <div className="text-center text-muted-foreground py-12">
                          אין משימות בשלב זה
                        </div>
                      )}
                    </TabsContent>

                    {/* Table View */}
                    <TabsContent
                      value="table"
                      className="flex-1 overflow-auto mt-0"
                    >
                      {expandedStageData.tasks &&
                      expandedStageData.tasks.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="p-3 text-right w-12">
                                  <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={() => {
                                      if (allSelected) {
                                        clearSelection();
                                      } else {
                                        selectAllTasks(
                                          expandedStageData.tasks || [],
                                        );
                                      }
                                    }}
                                  />
                                </th>
                                <th className="p-3 text-right font-medium">
                                  #
                                </th>
                                <th className="p-3 text-right font-medium">
                                  סטטוס
                                </th>
                                <th className="p-3 text-right font-medium">
                                  משימה
                                </th>
                                <th className="p-3 text-right font-medium">
                                  תאריך סיום
                                </th>
                                <th className="p-3 text-right font-medium w-24">
                                  פעולות
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filterTasks(expandedStageData.tasks).map((task, index) => (
                                <tr
                                  key={task.id}
                                  className={cn(
                                    "border-t transition-colors",
                                    task.completed
                                      ? "bg-green-50/50 dark:bg-green-950/20"
                                      : "hover:bg-muted/50",
                                    selectedTasks.has(task.id) &&
                                      "bg-primary/10",
                                  )}
                                >
                                  <td className="p-3">
                                    <Checkbox
                                      checked={selectedTasks.has(task.id)}
                                      onCheckedChange={() =>
                                        toggleTaskSelection(task.id)
                                      }
                                    />
                                  </td>
                                  <td className="p-3 text-muted-foreground">
                                    {index + 1}
                                  </td>
                                  <td className="p-3">
                                    <button
                                      onClick={() => handleToggleTask(task)}
                                      className="focus:outline-none"
                                    >
                                      {task.completed ? (
                                        <CheckCircle2
                                          className="h-5 w-5 text-emerald-500"
                                          style={{
                                            filter:
                                              "drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))",
                                          }}
                                        />
                                      ) : (
                                        <div className="h-5 w-5 rounded-full border-2 border-slate-300 hover:border-emerald-400 transition-colors" />
                                      )}
                                    </button>
                                  </td>
                                  <td className="p-3">
                                    <p
                                      className={cn(
                                        "text-[#1a2c5f] dark:text-slate-200 font-medium",
                                        task.completed &&
                                          "line-through text-emerald-600 dark:text-emerald-400",
                                      )}
                                    >
                                      <TaskTitleWithConsultants
                                        taskId={task.id}
                                        title={task.title}
                                      />
                                    </p>
                                  </td>
                                  <td className="p-3 text-muted-foreground text-sm">
                                    {task.completed && task.completed_at
                                      ? new Date(
                                          task.completed_at,
                                        ).toLocaleDateString("he-IL")
                                      : "-"}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-1">
                                      <StageTaskIndicator
                                        stageTaskId={task.id}
                                        clientId={clientId}
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          setEditingTask({
                                            stageId: expandedStageData.stage_id,
                                            taskId: task.id,
                                            title: task.title,
                                          })
                                        }
                                        className="h-7 w-7 p-0"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          handleDeleteTask(task.id)
                                        }
                                        className="h-7 w-7 p-0 hover:text-destructive"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <StageTaskActionsPopup
                                        stageTaskId={task.id}
                                        stageTaskTitle={task.title}
                                        clientId={clientId}
                                        trigger={
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 hover:text-primary"
                                          >
                                            <Bell className="h-3.5 w-3.5" />
                                          </Button>
                                        }
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-12">
                          אין משימות בשלב זה
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Expanded Footer - Add Tasks */}
                  <div className="pt-4 border-t flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setAddTaskDialog({
                          stageId: expandedStageData.stage_id,
                          title: "",
                          taskType: "task",
                          autoTimerDays: "",
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      הוסף משימה / טאב
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setBulkAddDialog({
                          stageId: expandedStageData.stage_id,
                          tasks: "",
                        });
                      }}
                    >
                      <ListPlus className="h-4 w-4 ml-2" />
                      הוספה מרובה
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        toggleTaskCount(expandedStageData.stage_id)
                      }
                      className={
                        showTaskCount[expandedStageData.stage_id]
                          ? "bg-primary/10"
                          : ""
                      }
                    >
                      <Hash className="h-4 w-4 ml-2" />
                      מספור
                    </Button>
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog
        open={addTaskDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddTaskDialog(null);
            setClientPickerOpen(false);
            setTimerTabPresetEditorOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[440px]" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>הוספת משימה / טאב טיימר</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Tabs
              value={addTaskDialog?.taskType ?? "task"}
              onValueChange={(value) =>
                setAddTaskDialog((prev) =>
                  prev
                    ? {
                        ...prev,
                        taskType: value as "task" | "timer_tab",
                      }
                    : null,
                )
              }
              dir="rtl"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="task">משימה רגילה</TabsTrigger>
                <TabsTrigger value="timer_tab">טאב טיימר</TabsTrigger>
              </TabsList>
            </Tabs>

            <Input
              value={addTaskDialog?.title ?? ""}
              onChange={(e) =>
                setAddTaskDialog((prev) =>
                  prev ? { ...prev, title: e.target.value } : null,
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTaskFromDialog();
                if (e.key === "Escape") setAddTaskDialog(null);
              }}
              placeholder={
                addTaskDialog?.taskType === "timer_tab"
                  ? "שם טאב הטיימר..."
                  : "שם המשימה..."
              }
              className="text-right"
              autoFocus
            />

            {addTaskDialog?.taskType === "timer_tab" && (
              <div className="space-y-2 rounded-lg border border-sky-200 bg-sky-50/60 p-3 dark:border-sky-900 dark:bg-sky-950/10">
                <div className="flex items-center justify-between gap-2">
                  <Popover
                    open={timerTabPresetEditorOpen}
                    onOpenChange={(open) => {
                      setTimerTabPresetEditorOpen(open);
                      if (open) {
                        setTimerTabPresetDraft(
                          timerTabQuickDayOptions.map(String),
                        );
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full border border-sky-200 bg-white/90 hover:bg-white"
                        title="עריכת כפתורי ימים"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-80 space-y-3 p-3"
                      align="start"
                      dir="rtl"
                    >
                      <p className="text-sm font-medium text-right">
                        עריכת כפתורי ימי עבודה
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {timerTabPresetDraft.map((days, idx) => (
                          <div key={`timer-tab-preset-${idx}`} className="space-y-1">
                            <p className="text-xs text-muted-foreground text-right">
                              כפתור {idx + 1}
                            </p>
                            <Input
                              type="number"
                              min="1"
                              max="365"
                              value={days}
                              onChange={(e) =>
                                updateTimerTabPresetDraft(idx, e.target.value)
                              }
                              className="h-8 text-right"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={resetTimerTabPresetDraft}
                        >
                          איפוס
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setTimerTabPresetEditorOpen(false)}
                          >
                            ביטול
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={saveTimerTabPresetDraft}
                          >
                            שמור
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <p className="text-sm font-medium text-right">
                    כמה ימי עבודה יופעלו בלחיצה על הטאב?
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {timerTabQuickDayOptions.map((days, idx) => (
                    <Button
                      key={`${days}-${idx}`}
                      type="button"
                      size="sm"
                      variant={
                        addTaskDialog.autoTimerDays === String(days)
                          ? "default"
                          : "outline"
                      }
                      className="text-xs"
                      onClick={() =>
                        setAddTaskDialog((prev) =>
                          prev
                            ? {
                                ...prev,
                                autoTimerDays: String(days),
                              }
                            : null,
                        )
                      }
                    >
                      {days} ימים
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={addTaskDialog.autoTimerDays}
                  onChange={(e) =>
                    setAddTaskDialog((prev) =>
                      prev ? { ...prev, autoTimerDays: e.target.value } : null,
                    )
                  }
                  placeholder="או הזן מספר ימי עבודה"
                  className="text-right"
                />
              </div>
            )}

            {/* Client / Contact link picker */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-right">
                קישור ללקוח / איש קשר{" "}
                <span className="text-muted-foreground font-normal">
                  (אופציונלי)
                </span>
              </p>
              <Popover
                open={clientPickerOpen}
                onOpenChange={setClientPickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-right"
                  >
                    <span
                      className={
                        addTaskDialog?.linkedLabel
                          ? ""
                          : "text-muted-foreground"
                      }
                    >
                      {addTaskDialog?.linkedLabel ?? "בחר לקוח או איש קשר..."}
                    </span>
                    <Link2 className="h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[400px] p-0"
                  dir="rtl"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="חיפוש לקוח או איש קשר..."
                      className="text-right"
                    />
                    <CommandList>
                      <CommandEmpty>לא נמצאו תוצאות</CommandEmpty>
                      {(addTaskDialog?.linkedClientId ||
                        addTaskDialog?.linkedContactId) && (
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setAddTaskDialog((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      linkedClientId: null,
                                      linkedContactId: null,
                                      linkedLabel: undefined,
                                    }
                                  : null,
                              );
                              setClientPickerOpen(false);
                            }}
                            className="text-red-500"
                          >
                            <X className="h-4 w-4 ml-2" />
                            נקה קישור
                          </CommandItem>
                        </CommandGroup>
                      )}
                      <CommandGroup heading="לקוחות">
                        {clients.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`client-${c.name}${c.company ? ` ${c.company}` : ""}`}
                            onSelect={() => {
                              setAddTaskDialog((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      linkedClientId: c.id,
                                      linkedContactId: null,
                                      linkedLabel: c.company
                                        ? `${c.name} (${c.company})`
                                        : c.name,
                                    }
                                  : null,
                              );
                              setClientPickerOpen(false);
                            }}
                          >
                            <Building2 className="h-4 w-4 ml-2 shrink-0 text-muted-foreground" />
                            <span>{c.name}</span>
                            {c.company && (
                              <span className="text-muted-foreground text-xs mr-2">
                                {c.company}
                              </span>
                            )}
                            {addTaskDialog?.linkedClientId === c.id && (
                              <Check className="h-4 w-4 mr-auto text-primary" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="אנשי קשר">
                        {allContacts.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`contact-${c.name}`}
                            onSelect={() => {
                              setAddTaskDialog((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      linkedContactId: c.id,
                                      linkedClientId: null,
                                      linkedLabel: c.name,
                                    }
                                  : null,
                              );
                              setClientPickerOpen(false);
                            }}
                          >
                            <UserRound className="h-4 w-4 ml-2 shrink-0 text-muted-foreground" />
                            <span>{c.name}</span>
                            {addTaskDialog?.linkedContactId === c.id && (
                              <Check className="h-4 w-4 mr-auto text-primary" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              onClick={handleAddTaskFromDialog}
              disabled={
                !addTaskDialog?.title.trim() ||
                (addTaskDialog.taskType === "timer_tab" &&
                  (!addTaskDialog.autoTimerDays.trim() ||
                    Number.parseInt(addTaskDialog.autoTimerDays, 10) <= 0))
              }
            >
              <Plus className="h-4 w-4 ml-2" />
              {addTaskDialog?.taskType === "timer_tab" ? "הוסף טאב" : "הוסף"}
            </Button>
            <Button variant="ghost" onClick={() => setAddTaskDialog(null)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog
        open={bulkAddDialog !== null}
        onOpenChange={() => setBulkAddDialog(null)}
      >
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right">
              הוספת משימות מרובות
            </DialogTitle>
            <DialogDescription className="text-right">
              הזן משימה אחת בכל שורה
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={bulkAddDialog?.tasks || ""}
            onChange={(e) =>
              setBulkAddDialog(
                bulkAddDialog
                  ? {
                      ...bulkAddDialog,
                      tasks: e.target.value,
                    }
                  : null,
              )
            }
            placeholder="משימה 1&#10;משימה 2&#10;משימה 3"
            rows={10}
            className="font-mono text-right"
          />
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setBulkAddDialog(null)}>
              ביטול
            </Button>
            <Button onClick={handleBulkAdd}>
              הוסף{" "}
              {bulkAddDialog?.tasks.split("\n").filter((t) => t.trim())
                .length || 0}{" "}
              משימות
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stage Dialog */}
      <Dialog
        open={addStageDialog}
        onOpenChange={(open) => {
          console.log("[ADD-STAGE-DIALOG] open:", open);
          setAddStageDialog(open);
          if (!open) {
            setAddStageMode("single");
            setBulkStagesText("");
            setNewStageName("");
            setNewStageIcon("Phone");
          }
        }}
      >
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right">הוספת שלב חדש</DialogTitle>
            <DialogDescription className="text-right">
              בחר שם ואייקון לשלב החדש
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={addStageMode}
            onValueChange={(v) => setAddStageMode(v as "single" | "bulk")}
            dir="rtl"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="single">שלב בודד</TabsTrigger>
              <TabsTrigger value="bulk">שלבים מרובים</TabsTrigger>
            </TabsList>
            <TabsContent value="single">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">
                    שם השלב
                  </label>
                  <Input
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="הזן שם לשלב..."
                    className="text-right"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddStage();
                      }
                    }}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="bulk">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">
                    הזן שלב אחד בכל שורה
                  </label>
                  <Textarea
                    value={bulkStagesText}
                    onChange={(e) => setBulkStagesText(e.target.value)}
                    placeholder="שלב 1&#10;שלב 2&#10;שלב 3"
                    rows={8}
                    className="font-mono text-right"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {bulkStagesText.split("\n").filter((t) => t.trim()).length}{" "}
                    שלבים יתווספו
                  </p>
                </div>
              </div>
            </TabsContent>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2 text-right">
                אייקון
              </label>
              <div className="flex gap-2 justify-end">
                {iconOptions.map((opt) => {
                  const IconComponent = opt.icon;
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={
                        newStageIcon === opt.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setNewStageIcon(opt.value)}
                      className="h-10 w-10 p-0"
                      title={opt.label}
                    >
                      <IconComponent className="h-5 w-5" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </Tabs>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setAddStageDialog(false)}>
              ביטול
            </Button>
            {addStageMode === "single" ? (
              <Button onClick={handleAddStage} disabled={!newStageName.trim()}>
                הוסף שלב
              </Button>
            ) : (
              <Button
                onClick={handleBulkAddStages}
                disabled={!bulkStagesText.trim()}
              >
                הוסף {bulkStagesText.split("\n").filter((t) => t.trim()).length}{" "}
                שלבים
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Stages Dialog */}
      <Dialog open={manageStagesDialog} onOpenChange={setManageStagesDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center justify-between">
              <span>ניהול שלבים</span>
              <Button
                size="sm"
                onClick={() => {
                  setManageStagesDialog(false);
                  setAddStageDialog(true);
                }}
                className="gap-1 bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                הוסף שלב חדש
              </Button>
            </DialogTitle>
            <DialogDescription className="text-right">
              ערוך, מחק או שנה את סדר השלבים. לחץ על + להוספת משימות לשלב.
            </DialogDescription>
          </DialogHeader>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleStageDragEnd}
          >
            <SortableContext
              items={sortedStages.map((s) => s.stage_id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 max-h-[60vh] overflow-y-auto py-2">
                {sortedStages.map((stage, index) => {
                  const Icon = getStageIcon(stage.stage_icon);
                  const isEditing = editingStage?.stageId === stage.stage_id;
                  const isFirst = index === 0;
                  const isLast = index === sortedStages.length - 1;
                  return (
                    <SortableStageItem
                      key={stage.stage_id}
                      stage={stage}
                      index={index}
                      isEditing={isEditing}
                      editingStage={editingStage}
                      setEditingStage={setEditingStage}
                      handleUpdateStage={handleUpdateStage}
                      handleDeleteStage={handleDeleteStage}
                      handleMoveStage={handleMoveStage}
                      isFirst={isFirst}
                      isLast={isLast}
                      Icon={Icon}
                      onAddTasks={(stageId) =>
                        setAddingTaskInManage({
                          stageId,
                          mode: "single",
                          value: "",
                        })
                      }
                      addingTaskInManage={addingTaskInManage}
                      setAddingTaskInManage={setAddingTaskInManage}
                      onSaveTask={async (stageId, value, mode) => {
                        if (mode === "single") {
                          await addTask(stageId, value.trim());
                        } else {
                          const tasks = value
                            .split("\n")
                            .filter((t) => t.trim());
                          if (tasks.length > 0) {
                            await addBulkTasks(stageId, tasks);
                          }
                        }
                        setAddingTaskInManage(null);
                      }}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

          <DialogFooter>
            <Button onClick={() => setManageStagesDialog(false)}>סגור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Theme Manager Dialog */}
      <Dialog
        open={stageThemeDialogOpen}
        onOpenChange={(open) => {
          setStageThemeDialogOpen(open);
          if (!open) {
            setEditingStageThemeId(null);
          }
        }}
      >
        <DialogContent className="max-w-[96vw] max-h-[92vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center justify-end gap-2">
              <Palette
                className="h-5 w-5"
                style={{ color: activeStageTheme.iconColor }}
              />
              ערכות נושא לעמוד השלבים
            </DialogTitle>
            <DialogDescription className="text-right">
              בחר ערכת נושא מוכנה, ערוך ערכה קיימת, או צור ערכה מותאמת עם שליטה
              מלאה בצבעי מסגרות, טקסטים, רקעים ומדדי התקדמות.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 grid-cols-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleResetStageThemes}
                  className="gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  איפוס ערכות ברירת מחדל
                </Button>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{stageBoardThemes.length} ערכות</Badge>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1"
                    onClick={handleStartCreateStageTheme}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    ערכה חדשה
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 rounded-lg border p-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {stageBoardThemes.map((theme) => {
                  const isActive = activeStageTheme.id === theme.id;
                  const isEditing = editingStageThemeId === theme.id;
                  const isPreset = STAGE_THEME_PRESETS.some(
                    (preset) => preset.id === theme.id,
                  );

                  return (
                    <div
                      key={theme.id}
                      className={cn(
                        "rounded-md border p-2 space-y-2",
                        isActive && "ring-2 ring-primary/40",
                      )}
                      style={{
                        borderColor: theme.borderColor,
                        backgroundColor: theme.cardBackgroundColor,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {isPreset && (
                            <Badge variant="outline" className="text-[10px]">
                              מובנית
                            </Badge>
                          )}
                          {isActive && (
                            <Badge className="text-[10px]">פעילה</Badge>
                          )}
                        </div>

                        <p
                          className="font-medium text-sm"
                          style={{ color: theme.badgeTextColor }}
                        >
                          {theme.name}
                        </p>
                      </div>

                      <div
                        className="rounded-md border overflow-hidden"
                        style={{ borderColor: theme.borderColor }}
                      >
                        <div
                          className="px-2 py-1.5 text-xs flex items-center justify-between"
                          style={{
                            background: `linear-gradient(135deg, ${theme.headerFromColor}, ${theme.headerToColor})`,
                            color: theme.headerTextColor,
                          }}
                        >
                          <span>72%</span>
                          <span>{theme.name}</span>
                        </div>
                        <div
                          className="px-2 py-1 text-[11px]"
                          style={{
                            backgroundColor: theme.badgeBackgroundColor,
                            color: theme.badgeTextColor,
                          }}
                        >
                          תצוגה מקדימה
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant={isActive ? "default" : "outline"}
                          className="h-7 text-xs"
                          onClick={() => setActiveStageThemeId(theme.id)}
                        >
                          {isActive ? "פעילה" : "הפעל"}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant={isEditing ? "default" : "ghost"}
                          className="h-7 w-7"
                          onClick={() => handleStartEditStageTheme(theme.id)}
                          title="עריכה"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleDuplicateStageTheme(theme.id)}
                          title="שכפול"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteStageTheme(theme.id)}
                          disabled={stageBoardThemes.length <= 1}
                          title="מחיקה"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={handleResetStageThemeDraftToDefault}
                    title="איפוס הערכה לערכי ברירת מחדל"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Badge variant="outline">
                    {editingStageThemeId ? "מצב עריכה" : "מצב יצירה"}
                  </Badge>
                </div>
                <h4 className="font-semibold">עורך ערכת נושא</h4>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium block text-right">
                  שם הערכה
                </label>
                <Input
                  value={stageThemeDraft.name}
                  onChange={(e) =>
                    setStageThemeDraft((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="לדוגמה: כחול אלגנט"
                  className="text-right"
                />
              </div>

              <div
                className="rounded-md border p-2 space-y-2"
                style={{
                  borderColor: stageThemeLivePreview.borderColor,
                  backgroundColor: stageThemeLivePreview.cardBackgroundColor,
                }}
              >
                <p className="text-xs text-right font-medium text-muted-foreground">
                  תצוגה מקדימה מלאה בזמן אמת
                </p>

                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  <div
                    className="rounded-md border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/60 transition-all"
                    style={{ borderColor: stageThemeLivePreview.borderColor }}
                    onClick={() => focusStageColorField("borderColor")}
                    title="לחץ לעריכת צבע מסגרת"
                  >
                    <div
                      className="px-3 py-1.5 text-[11px] text-right cursor-pointer hover:brightness-110 transition-all"
                      style={{
                        backgroundColor: stageThemeLivePreview.badgeBackgroundColor,
                        color: stageThemeLivePreview.badgeTextColor,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        focusStageColorField("badgeBackgroundColor");
                      }}
                      title="לחץ לעריכת רקע תג"
                    >
                      שלב רגיל
                    </div>
                    <div
                      className="px-3 py-2 space-y-2 cursor-pointer hover:brightness-110 transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${stageThemeLivePreview.headerFromColor}, ${stageThemeLivePreview.headerToColor})`,
                        color: stageThemeLivePreview.headerTextColor,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        focusStageColorField("headerFromColor");
                      }}
                      title="לחץ לעריכת גרדיאנט כותרת"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <Pencil className="h-3.5 w-3.5" />
                          <Trash2 className="h-3.5 w-3.5" />
                          <Timer className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              focusStageColorField("headerTextColor");
                            }}
                            title="לחץ לעריכת טקסט כותרת"
                          >
                            {stageThemeDraft.name || "ערכת נושא"}
                          </span>
                          <div
                            className="h-7 w-7 rounded-md cursor-pointer hover:ring-2 hover:ring-primary"
                            style={{
                              backgroundColor: stageThemeLivePreview.iconBackgroundColor,
                              color: stageThemeLivePreview.iconColor,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              focusStageColorField("iconBackgroundColor");
                            }}
                            title="לחץ לעריכת רקע אייקון"
                          >
                            <Palette className="h-4 w-4 m-1.5" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Badge
                          className="border-transparent cursor-pointer hover:brightness-110"
                          style={{
                            backgroundColor: stageThemeLivePreview.badgeBackgroundColor,
                            color: stageThemeLivePreview.badgeTextColor,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            focusStageColorField("badgeBackgroundColor");
                          }}
                          title="לחץ לעריכת תג"
                        >
                          4/7
                        </Badge>

                        <div
                          className="relative w-10 h-10 cursor-pointer hover:scale-110 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            focusStageColorField("progressColor");
                          }}
                          title="לחץ לעריכת צבע התקדמות"
                        >
                          <svg className="w-full h-full -rotate-90">
                            <circle
                              cx="20"
                              cy="20"
                              r="16"
                              stroke={stageThemeLivePreview.progressTrackColor}
                              strokeWidth="3"
                              fill="none"
                            />
                            <circle
                              cx="20"
                              cy="20"
                              r="16"
                              stroke={stageThemeLivePreview.progressColor}
                              strokeWidth="3"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 16}
                              strokeDashoffset={2 * Math.PI * 16 * (1 - 0.68)}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                            68%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-2 space-y-1.5 cursor-pointer hover:brightness-105"
                      style={{ backgroundColor: stageThemeLivePreview.cardBackgroundColor }}
                      onClick={(e) => {
                        e.stopPropagation();
                        focusStageColorField("cardBackgroundColor");
                      }}
                      title="לחץ לעריכת רקע כרטיס"
                    >
                      <div className="rounded border p-2 text-xs flex items-center justify-between bg-background/70">
                        <span className="text-muted-foreground">06/05</span>
                        <span>איסוף מסמכים</span>
                      </div>
                      <Button size="sm" variant="outline" className="w-full h-7 text-xs">
                        <Plus className="h-3.5 w-3.5 ml-1" />
                        הוסף משימה / טאב
                      </Button>
                    </div>
                  </div>

                  <div
                    className="rounded-md border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/60 transition-all"
                    style={{
                      borderColor: stageThemeLivePreview.activeBorderColor,
                      boxShadow: `0 0 0 1px ${stageThemeLivePreview.activeGlowColor}66, 0 10px 22px ${stageThemeLivePreview.activeGlowColor}33`,
                    }}
                    onClick={() => focusStageColorField("activeBorderColor")}
                    title="לחץ לעריכת מסגרת שלב פעיל"
                  >
                    <div
                      className="px-3 py-1.5 text-[11px] text-right cursor-pointer hover:brightness-110"
                      style={{
                        backgroundColor: stageThemeLivePreview.activeBadgeBackgroundColor,
                        color: stageThemeLivePreview.activeBadgeTextColor,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        focusStageColorField("activeBadgeBackgroundColor");
                      }}
                      title="לחץ לעריכת תג שלב פעיל"
                    >
                      שלב נוכחי מודגש
                    </div>
                    <div
                      className="px-3 py-2 space-y-2 cursor-pointer hover:brightness-110"
                      style={{
                        background: `linear-gradient(135deg, ${stageThemeLivePreview.activeHeaderFromColor}, ${stageThemeLivePreview.activeHeaderToColor})`,
                        color: stageThemeLivePreview.activeHeaderTextColor,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        focusStageColorField("activeHeaderFromColor");
                      }}
                      title="לחץ לעריכת גרדיאנט שלב פעיל"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          className="border-transparent cursor-pointer"
                          style={{
                            backgroundColor: stageThemeLivePreview.activeBadgeBackgroundColor,
                            color: stageThemeLivePreview.activeBadgeTextColor,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            focusStageColorField("activeBadgeBackgroundColor");
                          }}
                        >
                          שלב פעיל עכשיו
                        </Badge>
                        <span
                          className="text-xs cursor-pointer hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            focusStageColorField("activeHeaderTextColor");
                          }}
                        >
                          כאן אתה כרגע
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <div
                          className="relative w-10 h-10 cursor-pointer hover:scale-110 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            focusStageColorField("activeProgressColor");
                          }}
                          title="לחץ לעריכת התקדמות שלב פעיל"
                        >
                          <svg className="w-full h-full -rotate-90">
                            <circle
                              cx="20"
                              cy="20"
                              r="16"
                              stroke={stageThemeLivePreview.progressTrackColor}
                              strokeWidth="3"
                              fill="none"
                            />
                            <circle
                              cx="20"
                              cy="20"
                              r="16"
                              stroke={stageThemeLivePreview.activeProgressColor}
                              strokeWidth="3"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 16}
                              strokeDashoffset={2 * Math.PI * 16 * (1 - 0.45)}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                            45%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-2 space-y-1.5 cursor-pointer hover:brightness-105"
                      style={{ backgroundColor: stageThemeLivePreview.activeCardBackgroundColor }}
                      onClick={(e) => {
                        e.stopPropagation();
                        focusStageColorField("activeCardBackgroundColor");
                      }}
                      title="לחץ לעריכת רקע כרטיס פעיל"
                    >
                      <div className="rounded border p-2 text-xs flex items-center justify-between bg-background/80">
                        <span className="text-muted-foreground">היום</span>
                        <span>בדיקה פעילה</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-md border overflow-hidden"
                  style={{ borderColor: stageThemeLivePreview.borderColor }}
                >
                  <div
                    className="px-3 py-2"
                    style={{
                      background: `linear-gradient(135deg, ${stageThemeLivePreview.headerFromColor}, ${stageThemeLivePreview.headerToColor})`,
                      color: stageThemeLivePreview.headerTextColor,
                    }}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-6 px-2"
                        style={{
                          backgroundColor: stageThemeLivePreview.iconBackgroundColor,
                          color: stageThemeLivePreview.iconColor,
                        }}
                      >
                        <Timer className="h-3.5 w-3.5 ml-1" />
                        הפעל טיימר
                      </Button>
                      <span>תצוגת חלון מורחב</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: stageThemeLivePreview.progressTrackColor }}>
                      <div className="h-full rounded-full" style={{ width: "72%", backgroundColor: stageThemeLivePreview.progressColor }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 rounded-md border p-2">
                {STAGE_THEME_COLOR_FIELDS.map((field) => {
                  const colorValue = stageThemeLivePreview[field.key];
                  const isHighlighted = highlightedColorKey === field.key;

                  return (
                    <div
                      key={field.key}
                      id={`stage-color-field-${field.key}`}
                      className={cn(
                        "rounded-md border p-2 space-y-1 transition-all",
                        isHighlighted &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.03] shadow-lg",
                      )}
                    >
                      <label className="text-xs font-medium block text-right">
                        {field.label}
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={colorValue}
                          onChange={(e) =>
                            handleStageThemeColorChange(field.key, e.target.value)
                          }
                          className="h-8 w-10 p-1 shrink-0"
                        />
                        <Input
                          value={stageThemeDraft[field.key]}
                          onChange={(e) =>
                            handleStageThemeColorChange(field.key, e.target.value)
                          }
                          className="h-8 text-xs min-w-0"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleStartCreateStageTheme}
                >
                  נקה לטיוטה חדשה
                </Button>

                <Button
                  type="button"
                  size="sm"
                  className="gap-1"
                  onClick={handleSaveStageThemeDraft}
                >
                  <Save className="h-3.5 w-3.5" />
                  שמור ערכה
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStageThemeDialogOpen(false)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialogs */}
      <ApplyTemplateDialog
        open={applyTemplateDialog}
        onOpenChange={setApplyTemplateDialog}
        clientId={clientId}
        existingStagesCount={sortedStages.length}
        onApplied={refresh}
        folderId={selectedFolderId}
      />

      <SaveAllStagesDialog
        open={saveAllStagesDialog}
        onOpenChange={setSaveAllStagesDialog}
        stages={sortedStages}
        onSaved={refresh}
      />

      <CopyStagesDialog
        open={copyStagesDialog}
        onOpenChange={setCopyStagesDialog}
        targetClientId={clientId}
        onCopied={refresh}
        folderId={selectedFolderId}
      />

      {saveAsTemplateDialog && (
        <SaveAsTemplateDialog
          open={!!saveAsTemplateDialog}
          onOpenChange={(open) => !open && setSaveAsTemplateDialog(null)}
          stage={sortedStages.find((s) => s.stage_id === saveAsTemplateDialog)!}
        />
      )}

      {/* Add Folder Dialog */}
      <Dialog open={addFolderDialog} onOpenChange={setAddFolderDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>תיקייה חדשה</DialogTitle>
            <DialogDescription className="text-right">
              הוסף תיקייה חדשה לארגון השלבים
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="שם התיקייה..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="text-right"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim()) {
                  handleCreateFolderWithOptions();
                }
              }}
            />

            <div className="space-y-2">
              <div className="text-sm font-medium text-right">
                מה למלא בתיקייה החדשה?
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-end gap-2 cursor-pointer text-sm">
                  <span>ריקה — אמלא ידנית</span>
                  <input
                    type="radio"
                    name="folder-mode"
                    checked={newFolderMode === "empty"}
                    onChange={() => setNewFolderMode("empty")}
                  />
                </label>
                <label className="flex items-center justify-end gap-2 cursor-pointer text-sm">
                  <span>העתק שלבים מתיקייה קיימת</span>
                  <input
                    type="radio"
                    name="folder-mode"
                    checked={newFolderMode === "copy"}
                    onChange={() => setNewFolderMode("copy")}
                    disabled={folders.length === 0}
                  />
                </label>
              </div>

              {newFolderMode === "copy" && folders.length > 0 && (
                <select
                  className="w-full h-9 px-3 rounded-md border bg-background text-right text-sm"
                  value={copySourceFolderId}
                  onChange={(e) => setCopySourceFolderId(e.target.value)}
                  dir="rtl"
                >
                  <option value="">בחר תיקייה להעתקה...</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.folder_name} (
                      {allStages.filter((s) => s.folder_id === f.id).length}{" "}
                      שלבים)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              onClick={handleCreateFolderWithOptions}
              disabled={
                !newFolderName.trim() ||
                (newFolderMode === "copy" && !copySourceFolderId)
              }
              className="gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              צור תיקייה
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAddFolderDialog(false);
                setNewFolderName("");
                setNewFolderMode("empty");
                setCopySourceFolderId("");
              }}
            >
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={renameFolderDialog} onOpenChange={setRenameFolderDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>שנה שם תיקייה</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="שם חדש..."
              value={editingFolder?.name || ""}
              onChange={(e) =>
                setEditingFolder((prev) =>
                  prev ? { ...prev, name: e.target.value } : null,
                )
              }
              className="text-right"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && editingFolder?.name.trim()) {
                  updateFolder(editingFolder.id, {
                    folder_name: editingFolder.name.trim(),
                  });
                  setRenameFolderDialog(false);
                  setEditingFolder(null);
                  refreshFolders();
                }
              }}
            />
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              onClick={async () => {
                if (editingFolder?.name.trim()) {
                  await updateFolder(editingFolder.id, {
                    folder_name: editingFolder.name.trim(),
                  });
                  setRenameFolderDialog(false);
                  setEditingFolder(null);
                  await refreshFolders();
                }
              }}
              disabled={!editingFolder?.name.trim()}
            >
              <Save className="h-4 w-4 ml-2" />
              שמור
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRenameFolderDialog(false);
                setEditingFolder(null);
              }}
            >
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
