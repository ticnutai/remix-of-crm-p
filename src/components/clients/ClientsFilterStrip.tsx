// Clients Filter Strip Component - tenarch CRM Pro
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { supabase } from "@/integrations/supabase/client";
import { ManageStageTemplateClientsDialog } from "./ManageStageTemplateClientsDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Layers,
  Bell,
  CheckSquare,
  Users,
  X,
  ChevronDown,
  Filter,
  CalendarDays,
  FolderOpen,
  Tag,
  Plus,
  Heart,
  Building,
  Handshake,
  ArrowUpDown,
  SortAsc,
  Pencil,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  GripVertical,
  ChevronLeft,
  History,
  Settings2,
  CircleDollarSign,
  CircleCheckBig,
  CircleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConsultantsFilterPopover } from "./ConsultantsFilterPopover";
import { ConsultantsTreeFilter } from "./ConsultantsTreeFilter";
import { useStageTemplates } from "@/hooks/useStageTemplates";

export type ClientDateRangeConfig =
  | {
      kind: "relative";
      amount: number;
      unit: "days" | "weeks" | "months";
    }
  | {
      kind: "fixed";
      from: string;
      to: string;
    }
  | {
      kind: "advanced";
      preset:
        | "last_week"
        | "current_quarter"
        | "last_year"
        | "current_month"
        | "previous_month";
    };

export interface DateRangeTabItem {
  id: string;
  name: string;
  scope: "private" | "shared";
  range: ClientDateRangeConfig;
}

export interface ClientFilterState {
  stages: string[];
  stageSelections: Array<{ templateId: string; stageId: string; stageName: string }>;
  stageTemplateIds: string[];
  stageTaskFilters: Array<{
    templateId: string;
    stageId: string;
    taskId: string;
    title: string;
    status: "incomplete" | "complete" | "any";
  }>;
  dateFilter: "all" | "today" | "week" | "month" | "older";
  hasReminders: boolean | null;
  hasTasks: boolean | null;
  hasMeetings: boolean | null;
  paymentStatus?: "due" | "current" | "paid" | "reached" | null;
  recentClientsDays?: number | null;
  recentClientsSortMode?: "activity" | "custom";
  recentActivityTypes?: Array<
    "client" | "process" | "tasks" | "reminders" | "meetings"
  >;
  categories: string[];
  tags: string[];
  hiddenClassifications: string[]; // classifications to HIDE from list (empty = show all)
  monthAgeRanges: Array<"m4_plus" | "m6_plus" | "m8_plus">;
  exactMonth: number | null;
  customDateRange: ClientDateRangeConfig | null;
  activeDateTabId: string | null;
  consultantIds?: string[]; // filter clients linked to these consultants
  consultantProfessions?: string[]; // filter clients linked to any consultant with these professions
  sortBy:
    | "name_asc"
    | "name_desc"
    | "date_desc"
    | "date_asc"
    | "classification_asc"
    | "classification_desc";
}

export type ClientPaymentFilterSummary = Record<
  "due" | "current" | "paid" | "reached",
  { clients: number; payments: number; amount: number }
>;

interface ClientCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ClientsFilterStripProps {
  filters: ClientFilterState;
  onFiltersChange: (filters: ClientFilterState) => void;
  clientsWithReminders: Set<string>;
  clientsWithTasks: Set<string>;
  clientsWithMeetings: Set<string>;
  paymentSummary?: ClientPaymentFilterSummary;
  recentClientsCount?: number;
  hasRecentCustomOrder?: boolean;
  onResetRecentCustomOrder?: () => void;
  categories?: ClientCategory[];
  categoryCounts?: Record<string, number>;
  stageCounts?: Record<string, number>;
  stageTemplateCategoryCounts?: Record<string, number>;
  monthAgeCounts?: {
    ranges: Record<"m4_plus" | "m6_plus" | "m8_plus", number>;
    byExact: Record<number, number>;
  };
  allTags?: string[];
  tagColors?: Record<string, string>;
  visibleClientsCount?: number;
  onOpenCategoryManager?: () => void;
  onUpdate?: () => void;
  dateRangeTabs?: DateRangeTabItem[];
  onDateRangeTabsChange?: (tabs: DateRangeTabItem[]) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Building: <Building className="h-4 w-4" />,
  Handshake: <Handshake className="h-4 w-4" />,
  FolderOpen: <FolderOpen className="h-4 w-4" />,
};

const formatCompactNis = (amount: number) =>
  new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
    notation: amount >= 100_000 ? "compact" : "standard",
  }).format(amount || 0);

const FILTER_SECTIONS = [
  { id: "sort", label: "מיון / תאריך" },
  { id: "classification", label: "סיווג" },
  { id: "consultants", label: "יועצים" },
  { id: "tags", label: "תגיות" },
  { id: "stages", label: "תהליכים ושלבים" },
  { id: "reminders", label: "תזכורות" },
  { id: "tasks", label: "משימות" },
  { id: "recent", label: "לקוחות אחרונים" },
  { id: "meetings", label: "פגישות" },
  { id: "payments", label: "תשלומים" },
] as const;

export function ClientsFilterStrip({
  filters,
  onFiltersChange,
  clientsWithReminders,
  clientsWithTasks,
  clientsWithMeetings,
  paymentSummary = {
    due: { clients: 0, payments: 0, amount: 0 },
    current: { clients: 0, payments: 0, amount: 0 },
    paid: { clients: 0, payments: 0, amount: 0 },
    reached: { clients: 0, payments: 0, amount: 0 },
  },
  recentClientsCount = 0,
  hasRecentCustomOrder = false,
  onResetRecentCustomOrder,
  categories = [],
  categoryCounts = {},
  stageCounts = {},
  stageTemplateCategoryCounts = {},
  monthAgeCounts = {
    ranges: { m4_plus: 0, m6_plus: 0, m8_plus: 0 },
    byExact: {},
  },
  allTags = [],
  tagColors = {},
  visibleClientsCount,
  onOpenCategoryManager,
  onUpdate,
  dateRangeTabs = [],
  onDateRangeTabsChange,
}: ClientsFilterStripProps) {
  const [stagesDialogOpen, setStagesDialogOpen] = useState(false);
  const [activeQuickPanel, setActiveQuickPanel] = useState<
    "stages" | "recent" | "payments" | null
  >(null);
  const [activeStageTemplateId, setActiveStageTemplateId] = useState<string | null>(null);
  const [expandedStageTemplates, setExpandedStageTemplates] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedTemplateStages, setExpandedTemplateStages] = useState<Set<string>>(
    () => new Set(),
  );
  const { templates: stageTemplates, loading: stageTemplatesLoading } = useStageTemplates();
  const templateStageGroups = useMemo(
    () =>
      stageTemplates
        .map((template) => ({
          id: template.id,
          name: template.name,
          icon: template.icon,
          stages: (template.stages || []).map((stage) => ({
            stage_id: stage.id,
            stage_name: stage.stage_name,
            stage_icon: stage.stage_icon,
            tasks: stage.tasks || [],
          })),
        })),
    [stageTemplates],
  );
  const activeStageTemplate = useMemo(
    () =>
      templateStageGroups.find(
        (template) => template.id === activeStageTemplateId,
      ) || null,
    [activeStageTemplateId, templateStageGroups],
  );
  const dialogStageGroups = activeStageTemplate
    ? [activeStageTemplate]
    : templateStageGroups;
  const { value: stagesPanelPos, setValue: setStagesPanelPos } = useUserSettings<{ x: number; y: number }>({
    key: "stages_filter_panel_position",
    defaultValue: { x: Math.round(window.innerWidth / 2 - 200), y: Math.round(window.innerHeight / 2 - 250) },
  });
  const stagesDragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [persistedSortPopoverSize, setPersistedSortPopoverSize] = useSyncedSetting<{
    width: number;
    height: number;
  }>({
    key: "clients-sort-popover-size",
    defaultValue: { width: 320, height: 520 },
    cloud: false,
  });
  const [persistedSortPopoverOffset, setPersistedSortPopoverOffset] = useSyncedSetting<{
    x: number;
    y: number;
  }>({
    key: "clients-sort-popover-offset",
    defaultValue: { x: 0, y: 0 },
    cloud: false,
  });
  const [sortPopoverSize, setSortPopoverSize] = useState<{
    width: number;
    height: number;
  }>(persistedSortPopoverSize || { width: 320, height: 520 });
  const [sortPopoverOffset, setSortPopoverOffset] = useState<{
    x: number;
    y: number;
  }>(persistedSortPopoverOffset || { x: 0, y: 0 });
  const [classificationDialogOpen, setClassificationDialogOpen] =
    useState(false);
  const {
    value: recentClientsSettings,
    setValue: setRecentClientsSettings,
  } = useUserSettings<{
    days: number;
    activityTypes: Array<
      "client" | "process" | "tasks" | "reminders" | "meetings"
    >;
  }>({
    key: "clients_recent_activity_v2",
    defaultValue: {
      days: 30,
      activityTypes: ["client", "process", "tasks", "reminders", "meetings"],
    },
  });
  const [dateTabsManagerOpen, setDateTabsManagerOpen] = useState(false);
  const [dateTabEditorOpen, setDateTabEditorOpen] = useState(false);
  const [editingDateTabId, setEditingDateTabId] = useState<string | null>(null);
  const [tabNameInput, setTabNameInput] = useState("");
  const [tabScopeInput, setTabScopeInput] = useState<"private" | "shared">("private");
  const [rangeKindInput, setRangeKindInput] = useState<ClientDateRangeConfig["kind"]>("relative");
  const [relativeAmountInput, setRelativeAmountInput] = useState(30);
  const [relativeUnitInput, setRelativeUnitInput] = useState<"days" | "weeks" | "months">("days");
  const [fixedFromInput, setFixedFromInput] = useState("");
  const [fixedToInput, setFixedToInput] = useState("");
  const [advancedPresetInput, setAdvancedPresetInput] =
    useState<Extract<ClientDateRangeConfig, { kind: "advanced" }>["preset"]>(
      "current_month",
    );
  const [managedStageTemplateId, setManagedStageTemplateId] = useState<
    string | null
  >(null);
  const managedStageTemplate =
    templateStageGroups.find(
      (template) => template.id === managedStageTemplateId,
    ) || null;

  type ResizeDirection =
    | "top"
    | "right"
    | "bottom"
    | "left"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

  useEffect(() => {
    if (!sortDialogOpen) return;
    setSortPopoverSize(persistedSortPopoverSize || { width: 320, height: 520 });
    setSortPopoverOffset(persistedSortPopoverOffset || { x: 0, y: 0 });
  }, [
    sortDialogOpen,
    persistedSortPopoverSize,
    persistedSortPopoverOffset,
  ]);

  const startSortPopoverResize = (
    direction: ResizeDirection,
    event: React.MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = sortPopoverSize?.width ?? 320;
    const startHeight = sortPopoverSize?.height ?? 520;
    const startOffsetX = sortPopoverOffset?.x ?? 0;
    const startOffsetY = sortPopoverOffset?.y ?? 0;
    let lastWidth = startWidth;
    let lastHeight = startHeight;
    let lastOffsetX = startOffsetX;
    let lastOffsetY = startOffsetY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let nextWidth = startWidth;
      let nextHeight = startHeight;
      let nextOffsetX = startOffsetX;
      let nextOffsetY = startOffsetY;

      if (direction.includes("right")) nextWidth = startWidth + dx;
      if (direction.includes("left")) {
        nextWidth = startWidth - dx;
      }
      if (direction.includes("bottom")) nextHeight = startHeight + dy;
      if (direction.includes("top")) {
        nextHeight = startHeight - dy;
      }

      const maxWidth = Math.max(260, Math.floor(window.innerWidth * 0.95));
      const maxHeight = Math.max(180, Math.floor(window.innerHeight * 0.85));
      const minWidth = 260;
      const minHeight = 180;

      const clampedWidth = Math.min(maxWidth, Math.max(minWidth, Math.round(nextWidth)));
      const clampedHeight = Math.min(maxHeight, Math.max(minHeight, Math.round(nextHeight)));

      // Keep opposite edge visually fixed for top/left resize by moving the popover.
      if (direction.includes("left")) {
        nextOffsetX = startOffsetX + (startWidth - clampedWidth);
      }
      if (direction.includes("top")) {
        nextOffsetY = startOffsetY + (startHeight - clampedHeight);
      }

      setSortPopoverSize({
        width: clampedWidth,
        height: clampedHeight,
      });
      setSortPopoverOffset({ x: nextOffsetX, y: nextOffsetY });

      lastWidth = clampedWidth;
      lastHeight = clampedHeight;
      lastOffsetX = nextOffsetX;
      lastOffsetY = nextOffsetY;
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "";

      setPersistedSortPopoverSize({
        width: Math.max(260, lastWidth || 320),
        height: Math.max(180, lastHeight || 520),
      });
      setPersistedSortPopoverOffset({
        x: lastOffsetX || 0,
        y: lastOffsetY || 0,
      });
    };

    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const startSortPopoverDrag = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;

    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startOffsetX = sortPopoverOffset?.x ?? 0;
    const startOffsetY = sortPopoverOffset?.y ?? 0;
    let lastOffsetX = startOffsetX;
    let lastOffsetY = startOffsetY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      setSortPopoverOffset({
        x: Math.round(startOffsetX + dx),
        y: Math.round(startOffsetY + dy),
      });

      lastOffsetX = Math.round(startOffsetX + dx);
      lastOffsetY = Math.round(startOffsetY + dy);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "";

      setPersistedSortPopoverOffset({
        x: lastOffsetX || 0,
        y: lastOffsetY || 0,
      });
    };

    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  const toggleStage = (templateId: string, stageId: string, stageName: string) => {
    const current = filters.stageSelections || [];
    const exists = current.some((stage) => stage.templateId === templateId && stage.stageId === stageId);
    const stageSelections = exists
      ? current.filter((stage) => !(stage.templateId === templateId && stage.stageId === stageId))
      : [...current, { templateId, stageId, stageName }];
    onFiltersChange({
      ...filters,
      stageSelections,
      stages: Array.from(new Set(stageSelections.map((stage) => stage.stageName))),
    });
  };

  const clearStages = () => {
    onFiltersChange({ ...filters, stages: [], stageSelections: [], stageTemplateIds: [], stageTaskFilters: [] });
  };

  const clearActiveTemplateSelections = () => {
    if (!activeStageTemplate) {
      clearStages();
      return;
    }

    const stageSelections = (filters.stageSelections || []).filter(
      (selection) => selection.templateId !== activeStageTemplate.id,
    );
    onFiltersChange({
      ...filters,
      stages: Array.from(
        new Set(stageSelections.map((selection) => selection.stageName)),
      ),
      stageSelections,
      stageTemplateIds: (filters.stageTemplateIds || []).filter(
        (templateId) => templateId !== activeStageTemplate.id,
      ),
      stageTaskFilters: (filters.stageTaskFilters || []).filter(
        (task) => task.templateId !== activeStageTemplate.id,
      ),
    });
  };

  const selectAllStages = () => {
    const allStageNames = Array.from(
      new Set(templateStageGroups.flatMap((template) => template.stages.map((stage) => stage.stage_name))),
    );
    onFiltersChange({
      ...filters,
      stages: allStageNames,
      stageSelections: templateStageGroups.flatMap((template) =>
        template.stages.map((stage) => ({
          templateId: template.id,
          stageId: stage.stage_id,
          stageName: stage.stage_name,
        })),
      ),
      stageTemplateIds: templateStageGroups.map((template) => template.id),
    });
  };

  const toggleTemplateSelection = (templateId: string) => {
    const current = filters.stageTemplateIds || [];
    onFiltersChange({
      ...filters,
      stageTemplateIds: current.includes(templateId)
        ? current.filter((id) => id !== templateId)
        : [...current, templateId],
    });
  };

  const toggleTemplateStageExpansion = (stageId: string) => {
    setExpandedTemplateStages((current) => {
      const next = new Set(current);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  const toggleStageTask = (
    templateId: string,
    stageId: string,
    taskId: string,
    title: string,
  ) => {
    const current = filters.stageTaskFilters || [];
    const exists = current.some((task) => task.taskId === taskId);
    onFiltersChange({
      ...filters,
      stageTaskFilters: exists
        ? current.filter((task) => task.taskId !== taskId)
        : [...current, { templateId, stageId, taskId, title, status: "incomplete" }],
    });
  };

  const cycleTaskStatus = (taskId: string) => {
    const order = ["incomplete", "complete", "any"] as const;
    onFiltersChange({
      ...filters,
      stageTaskFilters: (filters.stageTaskFilters || []).map((task) => {
        if (task.taskId !== taskId) return task;
        const nextStatus = order[(order.indexOf(task.status) + 1) % order.length];
        return { ...task, status: nextStatus };
      }),
    });
  };

  const toggleStageTemplate = (templateId: string) => {
    setExpandedStageTemplates((current) => {
      const next = new Set(current);
      if (next.has(templateId)) next.delete(templateId);
      else next.add(templateId);
      return next;
    });
  };

  const setDateFilter = (value: ClientFilterState["dateFilter"]) => {
    onFiltersChange({
      ...filters,
      dateFilter: value,
      activeDateTabId: null,
      customDateRange: null,
    });
    setDateDialogOpen(false);
  };

  const rangeLabel = (range: ClientDateRangeConfig): string => {
    if (range.kind === "relative") {
      const unitLabel =
        range.unit === "days"
          ? "ימים"
          : range.unit === "weeks"
            ? "שבועות"
            : "חודשים";
      return `${range.amount} ${unitLabel} אחרונים`;
    }
    if (range.kind === "fixed") {
      return `${range.from || "?"} עד ${range.to || "?"}`;
    }
    const advancedMap: Record<
      Extract<ClientDateRangeConfig, { kind: "advanced" }>["preset"],
      string
    > = {
      last_week: "שבוע שעבר",
      current_quarter: "רבעון נוכחי",
      last_year: "שנה קודמת",
      current_month: "חודש נוכחי",
      previous_month: "חודש קודם",
    };
    return advancedMap[range.preset];
  };

  const applyDateTab = (tab: DateRangeTabItem) => {
    onFiltersChange({
      ...filters,
      dateFilter: "all",
      customDateRange: tab.range,
      activeDateTabId: tab.id,
    });
  };

  const resetTabEditor = () => {
    setEditingDateTabId(null);
    setTabNameInput("");
    setTabScopeInput("private");
    setRangeKindInput("relative");
    setRelativeAmountInput(30);
    setRelativeUnitInput("days");
    setFixedFromInput("");
    setFixedToInput("");
    setAdvancedPresetInput("current_month");
  };

  const openCreateDateTabEditor = () => {
    resetTabEditor();
    setDateTabEditorOpen(true);
  };

  const openEditDateTabEditor = (tab: DateRangeTabItem) => {
    setEditingDateTabId(tab.id);
    setTabNameInput(tab.name);
    setTabScopeInput(tab.scope);
    setRangeKindInput(tab.range.kind);
    if (tab.range.kind === "relative") {
      setRelativeAmountInput(tab.range.amount);
      setRelativeUnitInput(tab.range.unit);
    }
    if (tab.range.kind === "fixed") {
      setFixedFromInput(tab.range.from);
      setFixedToInput(tab.range.to);
    }
    if (tab.range.kind === "advanced") {
      setAdvancedPresetInput(tab.range.preset);
    }
    setDateTabEditorOpen(true);
  };

  const saveDateTabEditor = () => {
    if (!onDateRangeTabsChange) return;
    const cleanedName = tabNameInput.trim();
    if (!cleanedName) return;

    let nextRange: ClientDateRangeConfig;
    if (rangeKindInput === "relative") {
      nextRange = {
        kind: "relative",
        amount: Math.max(1, Math.floor(relativeAmountInput || 1)),
        unit: relativeUnitInput,
      };
    } else if (rangeKindInput === "fixed") {
      if (!fixedFromInput || !fixedToInput) return;
      nextRange = {
        kind: "fixed",
        from: fixedFromInput,
        to: fixedToInput,
      };
    } else {
      nextRange = {
        kind: "advanced",
        preset: advancedPresetInput,
      };
    }

    const baseTab: DateRangeTabItem = {
      id: editingDateTabId || `tab-${Date.now()}`,
      name: cleanedName,
      scope: tabScopeInput,
      range: nextRange,
    };

    if (editingDateTabId) {
      onDateRangeTabsChange(
        dateRangeTabs.map((tab) => (tab.id === editingDateTabId ? baseTab : tab)),
      );
      if (filters.activeDateTabId === editingDateTabId) {
        onFiltersChange({ ...filters, customDateRange: nextRange });
      }
    } else {
      onDateRangeTabsChange([...dateRangeTabs, baseTab]);
      onFiltersChange({
        ...filters,
        dateFilter: "all",
        activeDateTabId: baseTab.id,
        customDateRange: baseTab.range,
      });
    }

    setDateTabEditorOpen(false);
    resetTabEditor();
  };

  const removeDateTab = (tabId: string) => {
    if (!onDateRangeTabsChange) return;
    onDateRangeTabsChange(dateRangeTabs.filter((tab) => tab.id !== tabId));
    if (filters.activeDateTabId === tabId) {
      onFiltersChange({
        ...filters,
        activeDateTabId: null,
        customDateRange: null,
      });
    }
  };

  const duplicateDateTab = (tab: DateRangeTabItem) => {
    if (!onDateRangeTabsChange) return;
    const copy: DateRangeTabItem = {
      ...tab,
      id: `tab-${Date.now()}`,
      name: `${tab.name} (עותק)`,
    };
    onDateRangeTabsChange([...dateRangeTabs, copy]);
  };

  const moveDateTab = (tabId: string, direction: "up" | "down") => {
    if (!onDateRangeTabsChange) return;
    const idx = dateRangeTabs.findIndex((tab) => tab.id === tabId);
    if (idx < 0) return;
    const nextIdx = direction === "up" ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= dateRangeTabs.length) return;
    const nextTabs = [...dateRangeTabs];
    const [item] = nextTabs.splice(idx, 1);
    nextTabs.splice(nextIdx, 0, item);
    onDateRangeTabsChange(nextTabs);
  };

  const toggleHasReminders = () => {
    const newValue = filters.hasReminders === true ? null : true;
    onFiltersChange({
      ...filters,
      hasReminders: newValue,
      hasTasks: newValue ? null : filters.hasTasks,
      hasMeetings: newValue ? null : filters.hasMeetings,
    });
  };

  const selectAllActiveTemplateStages = () => {
    if (!activeStageTemplate) {
      selectAllStages();
      return;
    }

    const otherSelections = (filters.stageSelections || []).filter(
      (selection) => selection.templateId !== activeStageTemplate.id,
    );
    const templateSelections = activeStageTemplate.stages.map((stage) => ({
      templateId: activeStageTemplate.id,
      stageId: stage.stage_id,
      stageName: stage.stage_name,
    }));
    const stageSelections = [...otherSelections, ...templateSelections];

    onFiltersChange({
      ...filters,
      stages: Array.from(
        new Set(stageSelections.map((selection) => selection.stageName)),
      ),
      stageSelections,
      stageTemplateIds: Array.from(
        new Set([
          ...(filters.stageTemplateIds || []),
          activeStageTemplate.id,
        ]),
      ),
    });
  };

  const openStageTemplateDialog = (templateId: string) => {
    setActiveStageTemplateId(templateId);
    setExpandedStageTemplates((current) => {
      const next = new Set(current);
      next.add(templateId);
      return next;
    });
    setStagesDialogOpen(true);
  };

  const applyQuickTemplateFilter = (templateId: string) => {
    const templateOnlySelected =
      (filters.stageTemplateIds || []).length === 1 &&
      filters.stageTemplateIds[0] === templateId &&
      (filters.stageSelections || []).length === 0 &&
      (filters.stageTaskFilters || []).length === 0;

    onFiltersChange({
      ...filters,
      stages: [],
      stageSelections: [],
      stageTaskFilters: [],
      stageTemplateIds: templateOnlySelected ? [] : [templateId],
    });
    closeStagesDialog();
  };

  const closeStagesDialog = () => {
    setStagesDialogOpen(false);
    setActiveStageTemplateId(null);
  };

  const toggleHasTasks = () => {
    const newValue = filters.hasTasks === true ? null : true;
    onFiltersChange({
      ...filters,
      hasTasks: newValue,
      hasReminders: newValue ? null : filters.hasReminders,
      hasMeetings: newValue ? null : filters.hasMeetings,
    });
  };

  const toggleHasMeetings = () => {
    const newValue = filters.hasMeetings === true ? null : true;
    onFiltersChange({
      ...filters,
      hasMeetings: newValue,
      hasReminders: newValue ? null : filters.hasReminders,
      hasTasks: newValue ? null : filters.hasTasks,
    });
  };

  const updateRecentClientsDays = (days: number) => {
    setRecentClientsSettings({
      ...recentClientsSettings,
      days,
    });
    if (filters.recentClientsDays) {
      onFiltersChange({ ...filters, recentClientsDays: days });
    }
  };

  const applyRecentClientsDays = (days: number) => {
    setRecentClientsSettings({
      ...recentClientsSettings,
      days,
    });
    onFiltersChange({
      ...filters,
      recentClientsDays: days,
      recentActivityTypes:
        recentClientsSettings.activityTypes?.length > 0
          ? recentClientsSettings.activityTypes
          : ["client", "process", "tasks", "reminders", "meetings"],
    });
  };

  const toggleRecentActivityType = (
    type: "client" | "process" | "tasks" | "reminders" | "meetings",
  ) => {
    const current =
      recentClientsSettings.activityTypes?.length > 0
        ? recentClientsSettings.activityTypes
        : ["client", "process", "tasks", "reminders", "meetings"];
    const next = current.includes(type)
      ? current.filter((item) => item !== type)
      : [...current, type];
    if (next.length === 0) return;
    setRecentClientsSettings({
      ...recentClientsSettings,
      activityTypes: next as typeof recentClientsSettings.activityTypes,
    });
    if (filters.recentClientsDays) {
      onFiltersChange({
        ...filters,
        recentActivityTypes: next as typeof filters.recentActivityTypes,
      });
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((c) => c !== categoryId)
      : [...filters.categories, categoryId];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const clearCategories = () => {
    onFiltersChange({ ...filters, categories: [] });
  };

  const clearTags = () => {
    onFiltersChange({ ...filters, tags: [] });
  };

  // Classification filter helpers
  const CLASSIFICATION_OPTIONS = [
    { value: "vip", label: "VIP", color: "#eab308", icon: "⭐" },
    { value: "regular", label: "רגיל", color: "#3b82f6", icon: "👤" },
    { value: "potential", label: "פוטנציאלי", color: "#22c55e", icon: "🌱" },
    { value: "inactive", label: "לא פעיל", color: "#6b7280", icon: "💤" },
    { value: "_none", label: "ללא סיווג", color: "#9ca3af", icon: "❓" },
  ];

  const toggleClassificationVisibility = (classValue: string) => {
    const hidden = filters.hiddenClassifications || [];
    const newHidden = hidden.includes(classValue)
      ? hidden.filter((c) => c !== classValue)
      : [...hidden, classValue];
    onFiltersChange({ ...filters, hiddenClassifications: newHidden });
  };

  const showAllClassifications = () => {
    onFiltersChange({ ...filters, hiddenClassifications: [] });
  };

  const hideAllClassifications = () => {
    onFiltersChange({
      ...filters,
      hiddenClassifications: CLASSIFICATION_OPTIONS.map((c) => c.value),
    });
  };

  const MONTH_RANGE_OPTIONS: Array<{
    key: "m4_plus" | "m6_plus" | "m8_plus";
    label: string;
    hint: string;
  }> = [
    { key: "m4_plus", label: "4+ חודשים", hint: "לקוחות בני 4 חודשים ומעלה" },
    { key: "m6_plus", label: "6+ חודשים", hint: "לקוחות בני 6 חודשים ומעלה" },
    { key: "m8_plus", label: "8+ חודשים", hint: "לקוחות בני 8 חודשים ומעלה" },
  ];

  const toggleMonthRange = (range: "m4_plus" | "m6_plus" | "m8_plus") => {
    const current = filters.monthAgeRanges || [];
    const next = current.includes(range)
      ? current.filter((r) => r !== range)
      : [...current, range];
    onFiltersChange({ ...filters, monthAgeRanges: next });
  };

  const setExactMonth = (value: string) => {
    if (!value.trim()) {
      onFiltersChange({ ...filters, exactMonth: null });
      return;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    onFiltersChange({ ...filters, exactMonth: Math.floor(parsed) });
  };

  const clearMonthsFilter = () => {
    onFiltersChange({ ...filters, monthAgeRanges: [], exactMonth: null });
  };

  const hasActiveFilters =
    filters.stages.length > 0 ||
    (filters.stageSelections?.length || 0) > 0 ||
    (filters.stageTemplateIds?.length || 0) > 0 ||
    (filters.stageTaskFilters?.length || 0) > 0 ||
    filters.dateFilter !== "all" ||
    filters.hasReminders !== null ||
    filters.hasTasks !== null ||
    filters.hasMeetings !== null ||
    Boolean(filters.paymentStatus) ||
    Boolean(filters.recentClientsDays) ||
    filters.tags.length > 0 ||
    (filters.consultantIds?.length || 0) > 0 ||
    (filters.consultantProfessions?.length || 0) > 0 ||
    !!filters.customDateRange ||
    (filters.monthAgeRanges && filters.monthAgeRanges.length > 0) ||
    filters.exactMonth !== null ||
    (filters.hiddenClassifications && filters.hiddenClassifications.length > 0);

  const clearAllFilters = () => {
    onFiltersChange({
      stages: [],
      stageSelections: [],
      stageTemplateIds: [],
      stageTaskFilters: [],
      dateFilter: "all",
      hasReminders: null,
      hasTasks: null,
      hasMeetings: null,
      paymentStatus: null,
      recentClientsDays: null,
      recentActivityTypes: filters.recentActivityTypes,
      categories: [],
      tags: [],
      consultantIds: [],
      consultantProfessions: [],
      hiddenClassifications: [],
      monthAgeRanges: [],
      exactMonth: null,
      customDateRange: null,
      activeDateTabId: null,
      sortBy: filters.sortBy, // Keep sort order when clearing
    });
  };

  const dateFilterLabels = {
    all: "כל התאריכים",
    today: "היום",
    week: "השבוע",
    month: "החודש",
    older: "ישן יותר",
  };

  type SortFieldBase = "date" | "name" | "classification";
  type SortDirection = "asc" | "desc";

  const SORT_FIELD_LABELS: Record<SortFieldBase, string> = {
    date: "תאריך",
    name: "שם",
    classification: "סיווג",
  };

  const parseSortBy = (
    sortBy: ClientFilterState["sortBy"],
  ): { field: SortFieldBase; direction: SortDirection } => {
    switch (sortBy) {
      case "date_asc":
        return { field: "date", direction: "asc" };
      case "date_desc":
        return { field: "date", direction: "desc" };
      case "name_asc":
        return { field: "name", direction: "asc" };
      case "name_desc":
        return { field: "name", direction: "desc" };
      case "classification_desc":
        return { field: "classification", direction: "desc" };
      case "classification_asc":
      default:
        return { field: "classification", direction: "asc" };
    }
  };

  const composeSortBy = (
    field: SortFieldBase,
    direction: SortDirection,
  ): ClientFilterState["sortBy"] => {
    if (field === "date") return direction === "asc" ? "date_asc" : "date_desc";
    if (field === "name") return direction === "asc" ? "name_asc" : "name_desc";
    return direction === "asc" ? "classification_asc" : "classification_desc";
  };

  const getDirectionLabel = (
    field: SortFieldBase,
    direction: SortDirection,
  ): string => {
    if (field === "date") return direction === "asc" ? "ישנים ראשון" : "חדשים ראשון";
    return direction === "asc" ? "עולה" : "יורד";
  };

  const currentSort = parseSortBy(filters.sortBy);
  const activeDateRangeTab =
    dateRangeTabs.find((tab) => tab.id === filters.activeDateTabId) || null;
  const currentSortSummary = `${SORT_FIELD_LABELS[currentSort.field]} ${
    currentSort.direction === "asc" ? "↑" : "↓"
  }`;

  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.toLowerCase()),
  );

  const selectedCategories = useMemo(
    () => categories.filter((category) => filters.categories.includes(category.id)),
    [categories, filters.categories],
  );

  // Filter visibility and order are persisted separately so hiding a filter
  // never changes the position it returns to when shown again.
  const [visibleFilterSectionsArr, setVisibleFilterSectionsArr] = useSyncedSetting<string[]>({
    key: "clients-filter-strip-visible-sections",
    defaultValue: FILTER_SECTIONS.map((s) => s.id),
  });
  const [filterSectionsOrderArr, setFilterSectionsOrderArr] =
    useSyncedSetting<string[]>({
      key: "clients-filter-strip-sections-order-v1",
      defaultValue: FILTER_SECTIONS.map((section) => section.id),
    });
  const [recentVisibilityMigrated, setRecentVisibilityMigrated] =
    useSyncedSetting<boolean>({
      key: "clients-filter-strip-recent-visibility-migrated-v1",
      defaultValue: false,
    });
  const [paymentsVisibilityMigrated, setPaymentsVisibilityMigrated] =
    useSyncedSetting<boolean>({
      key: "clients-filter-strip-payments-visibility-migrated-v2",
      defaultValue: false,
    });
  const [draggedFilterSectionId, setDraggedFilterSectionId] = useState<
    string | null
  >(null);
  const [dragOverFilterSectionId, setDragOverFilterSectionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (recentVisibilityMigrated) return;
    setVisibleFilterSectionsArr((current) =>
      current.includes("recent") ? current : [...current, "recent"],
    );
    setRecentVisibilityMigrated(true);
  }, [
    recentVisibilityMigrated,
    setRecentVisibilityMigrated,
    setVisibleFilterSectionsArr,
  ]);

  useEffect(() => {
    if (paymentsVisibilityMigrated) return;
    if (visibleFilterSectionsArr.includes("payments")) {
      setPaymentsVisibilityMigrated(true);
      return;
    }
    setVisibleFilterSectionsArr((current) =>
      current.includes("payments") ? current : [...current, "payments"],
    );
  }, [
    paymentsVisibilityMigrated,
    setPaymentsVisibilityMigrated,
    setVisibleFilterSectionsArr,
    visibleFilterSectionsArr,
  ]);

  const orderedFilterSections = useMemo(() => {
    const knownIds = new Set<string>(
      FILTER_SECTIONS.map((section) => section.id),
    );
    const savedIds = filterSectionsOrderArr.filter((id) => knownIds.has(id));
    const missingIds = FILTER_SECTIONS.map((section) => section.id).filter(
      (id) => !savedIds.includes(id),
    );
    const normalizedOrder = [...savedIds, ...missingIds];
    return normalizedOrder
      .map((id) => FILTER_SECTIONS.find((section) => section.id === id))
      .filter((section): section is (typeof FILTER_SECTIONS)[number] =>
        Boolean(section),
      );
  }, [filterSectionsOrderArr]);

  const filterSectionOrderMap = useMemo(
    () =>
      new Map(
        orderedFilterSections.map((section, index) => [section.id, index]),
      ),
    [orderedFilterSections],
  );
  const getFilterSectionOrder = (id: string) =>
    filterSectionOrderMap.get(id as (typeof FILTER_SECTIONS)[number]["id"]) ??
    FILTER_SECTIONS.length;

  const visibleFilterSections = useMemo(() => {
    const sections = new Set(visibleFilterSectionsArr);
    // Keep a newly introduced primary tab visible immediately while its
    // one-time visibility migration is being persisted for existing users.
    if (!paymentsVisibilityMigrated) sections.add("payments");
    return sections;
  }, [paymentsVisibilityMigrated, visibleFilterSectionsArr]);
  const setVisibleFilterSections = useCallback((next: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setVisibleFilterSectionsArr((prevArr) => {
      const prev = new Set(prevArr);
      const resolved = typeof next === "function" ? next(prev) : next;
      return Array.from(resolved);
    });
  }, [setVisibleFilterSectionsArr]);
  const toggleFilterSection = (id: string) => {
    setVisibleFilterSections((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const moveFilterSection = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    const currentOrder = orderedFilterSections.map((section) => section.id);
    const fromIndex = currentOrder.indexOf(
      draggedId as (typeof FILTER_SECTIONS)[number]["id"],
    );
    const targetIndex = currentOrder.indexOf(
      targetId as (typeof FILTER_SECTIONS)[number]["id"],
    );
    if (fromIndex < 0 || targetIndex < 0) return;
    const nextOrder = [...currentOrder];
    const [movedId] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(targetIndex, 0, movedId);
    setFilterSectionsOrderArr(nextOrder);
  };
  const [filterSettingsOpen, setFilterSettingsOpen] = useState(false);

  return (
    <>
    <div
      dir="rtl"
      className="bg-white rounded-lg border-2 border-[#d4a843] p-2 mb-2"
    >
      <div className="flex flex-wrap gap-1.5 items-center">
        {/* Filter Settings Icon */}
        <Popover open={filterSettingsOpen} onOpenChange={setFilterSettingsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              style={{ order: -200 }}
              className="h-7 w-7 bg-white border border-[#d4a843] hover:bg-[#fef9ee]"
              title="הגדרת פילטרים מוצגים"
            >
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
              <PopoverContent
                className="flex w-[260px] flex-col overflow-hidden p-0"
                dir="rtl"
                align="end"
                sideOffset={8}
                collisionPadding={16}
                style={{
                  height:
                    "min(560px, var(--radix-popover-content-available-height))",
                }}
              >
            <div className="flex shrink-0 items-center justify-between border-b p-3">
              <h3 className="font-semibold text-sm">פילטרים מוצגים</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFilterSettingsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
                <div
                  data-client-task-scroll="true"
                  className="min-h-0 flex-1 space-y-1 overflow-y-scroll overscroll-contain p-2 [scrollbar-gutter:stable]"
                  onWheel={(event) => event.stopPropagation()}
                >
              <p className="px-2 pb-1 text-[10px] leading-4 text-muted-foreground">
                גרור את הידית כדי לשנות את סדר הטאבים. ההסתרה אינה משנה את
                המיקום.
              </p>
              {orderedFilterSections.map((s) => {
                const on = visibleFilterSections.has(s.id);
                return (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={(event) => {
                      setDraggedFilterSectionId(s.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", s.id);
                    }}
                    onDragEnd={() => {
                      setDraggedFilterSectionId(null);
                      setDragOverFilterSectionId(null);
                    }}
                    onDragEnter={() => setDragOverFilterSectionId(s.id)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const draggedId =
                        draggedFilterSectionId ||
                        event.dataTransfer.getData("text/plain");
                      if (draggedId) moveFilterSection(draggedId, s.id);
                      setDraggedFilterSectionId(null);
                      setDragOverFilterSectionId(null);
                    }}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded border border-transparent px-2 py-1.5 transition hover:bg-muted/50",
                      draggedFilterSectionId === s.id &&
                        "border-[#d4a843] bg-[#fef9ee] opacity-60",
                      dragOverFilterSectionId === s.id &&
                        draggedFilterSectionId !== s.id &&
                        "border-[#d4a843] bg-[#fffaf0]",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
                      {on ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      <Label htmlFor={`flt-${s.id}`} className="cursor-pointer truncate text-xs">{s.label}</Label>
                    </div>
                    <Switch
                      id={`flt-${s.id}`}
                      checked={on}
                      onPointerDown={(event) => event.stopPropagation()}
                      onCheckedChange={() => toggleFilterSection(s.id)}
                    />
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {typeof visibleClientsCount === "number" && visibleClientsCount > 0 && (
          <div
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-[#d4a843]"
            style={{
              order: -190,
              background: "linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <Users className="h-3.5 w-3.5 text-[#d4a843]" />
            <span className="text-[11px] text-[#f5d27a]">מוצגים</span>
            <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-[#d4a843] text-[#1e3a5f] border border-[#f5d27a]">
              {visibleClientsCount}
            </Badge>
          </div>
        )}

        {/* Unified Sort & Date Filter */}
        {visibleFilterSections.has("sort") && (
        <Popover open={sortDialogOpen} onOpenChange={setSortDialogOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              style={{ order: getFilterSectionOrder("sort") }}
              className={cn(
                "gap-1.5 h-7 bg-white text-[#1e293b] border border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b] text-xs",
                filters.dateFilter !== "all" &&
                  "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a]",
              )}
            >
              <ArrowUpDown className="h-4 w-4" />
              {currentSortSummary}
              {filters.dateFilter !== "all" && (
                <span className="text-[10px] opacity-80">
                  · {dateFilterLabels[filters.dateFilter]}
                </span>
              )}
              {activeDateRangeTab && (
                <span className="text-[10px] opacity-80">· {activeDateRangeTab.name}</span>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="relative p-0 overflow-hidden min-w-[260px] min-h-[180px] max-w-[95vw] max-h-[85vh] w-[260px] transition-none"
            dir="rtl"
            align="end"
            style={{
              width: Math.max(260, sortPopoverSize?.width || 320),
              height: Math.max(180, sortPopoverSize?.height || 520),
              transform: `translate(${sortPopoverOffset?.x || 0}px, ${sortPopoverOffset?.y || 0}px)`,
            }}
          >
            <div className="h-full overflow-y-auto overflow-x-hidden pr-1">
            <div
              className="p-3 border-b cursor-move select-none"
              onMouseDown={startSortPopoverDrag}
              title="אפשר לגרור את החלון"
            >
              <div className="flex flex-row-reverse items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">מיון וסינון תאריכים</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-auto"
                  onClick={() => setSortDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Sort options */}
            <div className="p-2">
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <SortAsc className="h-3 w-3" />
                מיין לפי
              </div>
              <div className="space-y-1 mt-1">
                {[
                  {
                    field: "date" as const,
                    icon: CalendarDays,
                    defaultDirection: "desc" as const,
                  },
                  {
                    field: "name" as const,
                    icon: SortAsc,
                    defaultDirection: "asc" as const,
                  },
                  {
                    field: "classification" as const,
                    icon: SortAsc,
                    defaultDirection: "asc" as const,
                  },
                ].map(({ field, icon: Icon, defaultDirection }) => {
                  const isActiveField = currentSort.field === field;
                  const activeDirection = isActiveField
                    ? currentSort.direction
                    : defaultDirection;

                  return (
                    <div
                      key={field}
                      className={cn(
                        "group flex items-center gap-1 rounded-md border p-1",
                        isActiveField
                          ? "border-primary/40 bg-primary/5"
                          : "border-transparent hover:border-border",
                      )}
                    >
                      <Button
                        variant={isActiveField ? "default" : "ghost"}
                        size="sm"
                        className="flex-1 justify-start gap-2 h-8"
                        onClick={() => {
                          onFiltersChange({
                            ...filters,
                            sortBy: composeSortBy(field, defaultDirection),
                          });
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{SORT_FIELD_LABELS[field]}</span>
                        <span className="text-[11px] opacity-80 mr-auto">
                          {activeDirection === "asc" ? "↑" : "↓"}
                        </span>
                      </Button>

                      <div
                        className={cn(
                          "flex items-center gap-1 transition-opacity",
                          isActiveField
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100",
                        )}
                      >
                        <Button
                          type="button"
                          variant={
                            isActiveField && currentSort.direction === "asc"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            onFiltersChange({
                              ...filters,
                              sortBy: composeSortBy(field, "asc"),
                            });
                          }}
                          title={getDirectionLabel(field, "asc")}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant={
                            isActiveField && currentSort.direction === "desc"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            onFiltersChange({
                              ...filters,
                              sortBy: composeSortBy(field, "desc"),
                            });
                          }}
                          title={getDirectionLabel(field, "desc")}
                        >
                          ↓
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date filter options */}
            <div className="border-t p-2">
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                סינון לפי תאריך יצירה
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {Object.entries(dateFilterLabels).map(([value, label]) => (
                  <Button
                    key={value}
                    variant={
                      filters.dateFilter === value ? "default" : "outline"
                    }
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setDateFilter(value as ClientFilterState["dateFilter"]);
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              <div className="mt-3 border-t pt-2">
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="text-[11px] font-semibold text-muted-foreground">טאבי טווח מותאמים</div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={openCreateDateTabEditor}
                    >
                      <Plus className="h-3 w-3 ml-1" />
                      חדש
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setDateTabsManagerOpen(true)}
                    >
                      נהל
                    </Button>
                  </div>
                </div>

                {dateRangeTabs.length === 0 ? (
                  <div className="px-2 py-2 text-[11px] text-muted-foreground">
                    אין טאבים מותאמים. אפשר ליצור טווחים כמו 30/90/180 ימים.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1 px-2 py-1">
                    {dateRangeTabs.map((tab) => {
                      const active = filters.activeDateTabId === tab.id;
                      return (
                        <Button
                          key={tab.id}
                          type="button"
                          variant={active ? "default" : "outline"}
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          title={rangeLabel(tab.range)}
                          onClick={() => applyDateTab(tab)}
                        >
                          {tab.name}
                          <span className="text-[10px] opacity-70 mr-1">
                            {tab.scope === "shared" ? "צוות" : "פרטי"}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Resize handles: 4 sides + 4 corners */}
            <div
              className="absolute top-0 left-2 right-2 h-1.5 cursor-n-resize"
              onMouseDown={(e) => startSortPopoverResize("top", e)}
            />
            <div
              className="absolute bottom-0 left-2 right-2 h-1.5 cursor-s-resize"
              onMouseDown={(e) => startSortPopoverResize("bottom", e)}
            />
            <div
              className="absolute top-2 bottom-2 left-0 w-1.5 cursor-w-resize"
              onMouseDown={(e) => startSortPopoverResize("left", e)}
            />
            <div
              className="absolute top-2 bottom-2 right-0 w-1.5 cursor-e-resize"
              onMouseDown={(e) => startSortPopoverResize("right", e)}
            />

            <div
              className="absolute top-0 left-0 h-3 w-3 cursor-nw-resize"
              onMouseDown={(e) => startSortPopoverResize("top-left", e)}
            >
              <div className="h-full w-full rounded-br bg-primary/20" />
            </div>
            <div
              className="absolute top-0 right-0 h-3 w-3 cursor-ne-resize"
              onMouseDown={(e) => startSortPopoverResize("top-right", e)}
            >
              <div className="h-full w-full rounded-bl bg-primary/20" />
            </div>
            <div
              className="absolute bottom-0 left-0 h-3 w-3 cursor-sw-resize"
              onMouseDown={(e) => startSortPopoverResize("bottom-left", e)}
            >
              <div className="h-full w-full rounded-tr bg-primary/20" />
            </div>
            <div
              className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize"
              onMouseDown={(e) => startSortPopoverResize("bottom-right", e)}
            >
              <div className="h-full w-full rounded-tl bg-primary/20" />
            </div>
          </PopoverContent>
        </Popover>
        )}

        {/* Classification Filter (סיווג לקוחות) */}
        {visibleFilterSections.has("classification") && (
        <Popover
          open={classificationDialogOpen}
          onOpenChange={setClassificationDialogOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              style={{ order: getFilterSectionOrder("classification") }}
              className={cn(
                "gap-1.5 h-7 bg-white text-[#1e293b] border border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b] text-xs",
                (filters.hiddenClassifications?.length || 0) > 0 &&
                  "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a] text-xs",
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              סיווג
              {(filters.hiddenClassifications?.length || 0) > 0 && (
                <Badge
                  variant="secondary"
                  className="mr-1 bg-accent text-accent-foreground"
                >
                  {CLASSIFICATION_OPTIONS.length -
                    (filters.hiddenClassifications?.length || 0)}
                  /{CLASSIFICATION_OPTIONS.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(92vw,360px)] p-0 overflow-x-hidden"
            dir="rtl"
            align="end"
            collisionPadding={16}
          >
            <div className="p-4 border-b">
              <div className="flex flex-row-reverse items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">סיווג לקוחות</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-auto"
                  onClick={() => setClassificationDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-row-reverse gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={showAllClassifications}
                >
                  <Eye className="h-3 w-3 ml-1" />
                  הצג הכל
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={hideAllClassifications}
                >
                  <EyeOff className="h-3 w-3 ml-1" />
                  הסתר הכל
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearMonthsFilter}
                  disabled={
                    (filters.monthAgeRanges?.length || 0) === 0 &&
                    filters.exactMonth === null
                  }
                >
                  <X className="h-3 w-3 ml-1" />
                  נקה חודשים
                </Button>
              </div>
            </div>
            <ScrollArea className="max-h-[70vh] overflow-x-hidden">
              <div className="p-4 space-y-2 overflow-x-hidden">
                {CLASSIFICATION_OPTIONS.map((cls) => {
                  const isVisible = !(
                    filters.hiddenClassifications || []
                  ).includes(cls.value);
                  return (
                    <div
                      key={cls.value}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all overflow-x-hidden",
                        isVisible
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/30 border-border opacity-60",
                      )}
                      onClick={() => toggleClassificationVisibility(cls.value)}
                    >
                      <Checkbox
                        checked={isVisible}
                        onCheckedChange={() =>
                          toggleClassificationVisibility(cls.value)
                        }
                      />
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                        style={{
                          backgroundColor: cls.color + "22",
                          border: `2px solid ${cls.color}`,
                        }}
                      >
                        {cls.icon}
                      </div>
                      <span
                        className={cn(
                          "font-medium flex-1 text-right min-w-0",
                          !isVisible && "line-through text-muted-foreground",
                        )}
                      >
                        {cls.label}
                      </span>
                      {isVisible ? (
                        <Eye className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  );
                })}

                <div className="border-t pt-3 mt-3 overflow-x-hidden">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    סיווג לפי זמנים (חודשי ותק)
                  </div>

                  <div className="space-y-2">
                    {MONTH_RANGE_OPTIONS.map((opt) => {
                      const checked = (filters.monthAgeRanges || []).includes(opt.key);
                      return (
                        <div
                          key={opt.key}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-lg border p-2 cursor-pointer overflow-x-hidden",
                            checked ? "bg-primary/10 border-primary" : "bg-muted/30 border-border",
                          )}
                          onClick={() => toggleMonthRange(opt.key)}
                          title={opt.hint}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Checkbox checked={checked} />
                            <span className="text-sm font-medium truncate">{opt.label}</span>
                          </div>
                          <Badge variant="secondary" className="flex-shrink-0">{monthAgeCounts.ranges[opt.key] || 0}</Badge>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 space-y-1">
                    <Label className="text-xs text-muted-foreground">חודש מדויק</Label>
                    <div className="flex items-center gap-2 overflow-x-hidden">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={filters.exactMonth ?? ""}
                        onChange={(e) => setExactMonth(e.target.value)}
                        placeholder="לדוגמה: 4"
                        className="h-8 min-w-0"
                      />
                      <Badge variant="outline" className="h-8 flex-shrink-0">
                        {filters.exactMonth === null
                          ? "0"
                          : monthAgeCounts.byExact[filters.exactMonth] || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        )}

        {/* Consultants Filter (יועצים) */}
        {visibleFilterSections.has("consultants") && (
          <div
            className="inline-flex"
            style={{ order: getFilterSectionOrder("consultants") }}
          >
          <ConsultantsFilterPopover
            selectedConsultantIds={filters.consultantIds || []}
            selectedProfessions={filters.consultantProfessions || []}
            onChange={({ consultantIds, consultantProfessions }) =>
              onFiltersChange({
                ...filters,
                consultantIds,
                consultantProfessions,
              })
            }
          />
          </div>
        )}

        {/* Tags Filter */}
        {visibleFilterSections.has("tags") && (
        <Popover open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              style={{ order: getFilterSectionOrder("tags") }}
              className={cn(
                "gap-1.5 h-7 bg-white text-[#1e293b] border border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b] text-xs",
                filters.tags.length > 0 &&
                  "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a] text-xs",
              )}
            >
              <Tag className="h-4 w-4" />
              תגיות
              {filters.tags.length > 0 && (
                <Badge
                  variant="secondary"
                  className="mr-1 bg-accent text-accent-foreground"
                >
                  {filters.tags.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[300px] p-0 overflow-hidden"
            dir="rtl"
            align="end"
            collisionPadding={16}
          >
            <div className="p-4 border-b">
              <div className="flex flex-row-reverse items-center gap-2 mb-3">
                <Tag className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">סינון לפי תגיות</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-auto"
                  onClick={() => setTagsDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="חפש תגית..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="mb-2"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setTagsDialogOpen(false);
                    onOpenCategoryManager?.();
                  }}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  ניהול תגיות
                </Button>
                {filters.tags.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearTags}>
                    נקה הכל
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea className="max-h-[50vh] p-4">
              <div className="flex flex-wrap gap-2">
                {filteredTags.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 w-full">
                    {allTags.length === 0 ? "אין תגיות" : "לא נמצאו תגיות"}
                  </p>
                ) : (
                  filteredTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        filters.tags.includes(tag) ? "default" : "outline"
                      }
                      className={cn(
                        "cursor-pointer border transition-all hover:-translate-y-0.5 hover:shadow-sm",
                        filters.tags.includes(tag) && "text-white",
                      )}
                      style={{
                        backgroundColor: filters.tags.includes(tag)
                          ? tagColors[tag] || "#1e3a5f"
                          : `${tagColors[tag] || "#1e3a5f"}16`,
                        borderColor: tagColors[tag] || "#1e3a5f",
                        color: filters.tags.includes(tag)
                          ? "#ffffff"
                          : tagColors[tag] || "#1e3a5f",
                      }}
                      onClick={() => toggleTag(tag)}
                    >
                      <span
                        className="ml-1 h-2.5 w-2.5 rounded-full border border-current"
                        style={{ backgroundColor: tagColors[tag] || "#1e3a5f" }}
                      />
                      {tag}
                    </Badge>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        )}

        {/* Stages Filter */}
        {visibleFilterSections.has("stages") && (
        <>
          <Button
            variant="outline"
            size="sm"
            style={{ order: getFilterSectionOrder("stages") }}
            className={cn(
              "gap-1.5 h-7 bg-white text-[#1e293b] border border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b] text-xs",
              filters.stages.length > 0 &&
                "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a] text-xs",
            )}
            aria-expanded={activeQuickPanel === "stages"}
            onClick={() => {
              if (activeQuickPanel === "stages") {
                setActiveQuickPanel(null);
                closeStagesDialog();
              } else {
                setActiveQuickPanel("stages");
                closeStagesDialog();
              }
            }}
          >
            <Layers className="h-4 w-4" />
            תהליכים ושלבים
            {(filters.stageSelections.length > 0 || filters.stageTemplateIds.length > 0 || filters.stageTaskFilters.length > 0) && (
              <Badge
                variant="secondary"
                className="mr-1 bg-accent text-accent-foreground"
              >
                {filters.stageTemplateIds.length + filters.stageSelections.length + filters.stageTaskFilters.length}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                "h-3 w-3 opacity-50 transition-transform",
                activeQuickPanel === "stages" && "rotate-180",
              )}
            />
          </Button>

          {stagesDialogOpen && createPortal(
            <div
              className="fixed inset-0 z-[9998]"
              onMouseDown={closeStagesDialog}
            >
            <div
              dir="rtl"
              style={{
                position: "fixed",
                left: stagesPanelPos.x,
                top: stagesPanelPos.y,
                zIndex: 9999,
                width: "min(94vw, 400px)",
                maxHeight: "min(82vh, calc(100vh - 24px))",
              }}
              className="rounded-lg border border-border bg-popover shadow-xl overflow-hidden flex flex-col"
              onMouseDown={(event) => event.stopPropagation()}
            >
              {/* Drag handle header */}
              <div
                className="p-3 border-b bg-muted/40 cursor-grab active:cursor-grabbing select-none shrink-0"
                onMouseDown={(e) => {
                  e.preventDefault();
                  stagesDragRef.current = {
                    startX: e.clientX,
                    startY: e.clientY,
                    originX: stagesPanelPos.x,
                    originY: stagesPanelPos.y,
                  };
                  const onMove = (me: MouseEvent) => {
                    if (!stagesDragRef.current) return;
                    const dx = me.clientX - stagesDragRef.current.startX;
                    const dy = me.clientY - stagesDragRef.current.startY;
                    const newX = Math.max(0, Math.min(window.innerWidth - 400, stagesDragRef.current.originX + dx));
                    const newY = Math.max(0, Math.min(window.innerHeight - 100, stagesDragRef.current.originY + dy));
                    setStagesPanelPos({ x: newX, y: newY });
                  };
                  const onUp = () => {
                    stagesDragRef.current = null;
                    window.removeEventListener("mousemove", onMove);
                    window.removeEventListener("mouseup", onUp);
                  };
                  window.addEventListener("mousemove", onMove);
                  window.addEventListener("mouseup", onUp);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={closeStagesDialog}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <h3 className="font-semibold text-sm">
                        {activeStageTemplate
                          ? activeStageTemplate.name
                          : "תהליכים, שלבים ומשימות"}
                      </h3>
                      {activeStageTemplate && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          בחירת שלבים ומשימות בתהליך
                        </p>
                      )}
                    </div>
                    {activeStageTemplate && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1.5 border-[#d4a843] bg-white text-[10px] text-[#1e3a5f] hover:bg-[#fff8e7]"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          setManagedStageTemplateId(activeStageTemplate.id);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        ניהול לקוחות
                      </Button>
                    )}
                    <Layers className="h-4 w-4 text-primary" />
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end" onMouseDown={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" onClick={selectAllActiveTemplateStages}>
                    {activeStageTemplate ? "בחר את כל שלבי התהליך" : "בחר הכל"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearActiveTemplateSelections}>
                    {activeStageTemplate ? "נקה את בחירות התהליך" : "נקה שלבים"}
                  </Button>
                </div>
                {((filters.stageTemplateIds || []).length > 0 ||
                  (filters.stageSelections || []).length > 0 ||
                  (filters.stageTaskFilters || []).length > 0) && (
                  <div className="mt-2 flex max-h-20 flex-wrap gap-1 overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
                    {(filters.stageTemplateIds || []).map((templateId) => {
                      const template = templateStageGroups.find((item) => item.id === templateId);
                      if (!template) return null;
                      return (
                        <button key={`template-${templateId}`} type="button" className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground" onClick={() => toggleTemplateSelection(templateId)}>
                          {template.name} ×
                        </button>
                      );
                    })}
                    {(filters.stageSelections || []).map((stage) => (
                      <button key={`stage-${stage.templateId}-${stage.stageId}`} type="button" className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-900" onClick={() => toggleStage(stage.templateId, stage.stageId, stage.stageName)}>
                        {stage.stageName} ×
                      </button>
                    ))}
                    {(filters.stageTaskFilters || []).map((task) => (
                      <button key={`task-${task.taskId}`} type="button" className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-900" onClick={() => toggleStageTask(task.templateId, task.stageId, task.taskId, task.title)}>
                        {task.title} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
                <div className="p-3">
                  <div className="space-y-2">
                    {stageTemplatesLoading ? (
                      <p className="text-center text-muted-foreground py-8">
                        טוען תבניות שלבים...
                      </p>
                    ) : dialogStageGroups.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        אין תבניות שלבים מוגדרות
                      </p>
                    ) : (
                      dialogStageGroups.map((template) => {
                        const isExpanded =
                          activeStageTemplateId === template.id ||
                          expandedStageTemplates.has(template.id);
                        const selectedCount = (filters.stageSelections || []).filter(
                          (stage) => stage.templateId === template.id,
                        ).length;
                        const templateSelected = (filters.stageTemplateIds || []).includes(template.id);
                        const selectedTaskCount = (filters.stageTaskFilters || []).filter(
                          (task) => task.templateId === template.id,
                        ).length;
                        const templateClientCount =
                          stageTemplateCategoryCounts[template.id] || 0;

                        return (
                          <div
                            key={template.id}
                            className="overflow-hidden rounded-lg border border-border bg-background"
                          >
                            <div
                              role="button"
                              tabIndex={0}
                              aria-expanded={isExpanded}
                              className={cn(
                                "flex cursor-pointer items-center gap-2 p-3 transition-colors hover:bg-muted/60",
                                (templateSelected || selectedCount > 0 || selectedTaskCount > 0) && "bg-primary/5",
                              )}
                              onClick={() =>
                                !activeStageTemplate &&
                                toggleStageTemplate(template.id)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  if (!activeStageTemplate) {
                                    toggleStageTemplate(template.id);
                                  }
                                }
                              }}
                            >
                              {!activeStageTemplate && (isExpanded ? (
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ))}
                              <span className="flex-1 text-right font-semibold text-foreground">
                                {template.name}
                              </span>
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                {template.stages.length} שלבים
                              </Badge>
                              {selectedCount > 0 && (
                                <Badge className="h-5 px-1.5 text-[10px]">
                                  {selectedCount} נבחרו
                                </Badge>
                              )}
                              {selectedTaskCount > 0 && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                                  {selectedTaskCount} משימות
                                </Badge>
                              )}
                              {templateClientCount > 0 && (
                                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
                                  {templateClientCount}
                                </Badge>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 rounded-full text-[#9a741d] hover:bg-[#d4a843]/20 hover:text-[#1e3a5f]"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setManagedStageTemplateId(template.id);
                                }}
                                aria-label={`נהל לקוחות בקטגוריה ${template.name}`}
                                title="הוסף או הסר לקוחות מהקטגוריה"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                              <Checkbox
                                checked={templateSelected ? true : selectedCount > 0 || selectedTaskCount > 0 ? "indeterminate" : false}
                                aria-label={`בחר תהליך ${template.name}`}
                                onClick={(event) => event.stopPropagation()}
                                onCheckedChange={() => toggleTemplateSelection(template.id)}
                              />
                            </div>

                            {isExpanded && (
                              <div className="space-y-1 border-t border-border bg-muted/20 p-2 pr-7">
                                {template.stages.length === 0 ? (
                                  <p className="py-5 text-center text-xs text-muted-foreground">
                                    עדיין לא הוגדרו שלבים בתהליך זה
                                  </p>
                                ) : template.stages.map((stage) => {
                                  const stageClientCount = stageCounts[stage.stage_name] || 0;
                                  const checked = (filters.stageSelections || []).some(
                                    (selection) => selection.templateId === template.id && selection.stageId === stage.stage_id,
                                  );
                                  const stageExpanded = expandedTemplateStages.has(stage.stage_id);
                                  const selectedStageTasks = (filters.stageTaskFilters || []).filter(
                                    (task) => task.stageId === stage.stage_id,
                                  );
                                  return (
                                    <div key={stage.stage_id} className="overflow-hidden rounded-md border border-transparent bg-background">
                                      <div
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={stage.tasks.length > 0 ? stageExpanded : undefined}
                                        className={cn(
                                          "flex cursor-pointer items-center gap-2 p-2.5 transition-all",
                                          checked || selectedStageTasks.length > 0
                                            ? "bg-primary/10"
                                            : "hover:bg-muted/50",
                                        )}
                                        onClick={() => stage.tasks.length > 0 && toggleTemplateStageExpansion(stage.stage_id)}
                                      >
                                        {stage.tasks.length > 0 ? (
                                          stageExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />
                                        ) : <span className="w-3.5" />}
                                        <Checkbox
                                          checked={checked ? true : selectedStageTasks.length > 0 ? "indeterminate" : false}
                                          aria-label={`בחר שלב ${stage.stage_name}`}
                                          onClick={(event) => event.stopPropagation()}
                                          onCheckedChange={() => toggleStage(template.id, stage.stage_id, stage.stage_name)}
                                        />
                                        <span className="flex-1 text-right text-sm font-medium text-foreground">
                                          {stage.stage_name}
                                        </span>
                                        {stage.tasks.length > 0 && <Badge variant="outline" className="h-5 text-[10px]">{stage.tasks.length}</Badge>}
                                        {stageClientCount > 0 && (
                                          <Badge variant="secondary" className="h-5 min-w-5 bg-primary/10 px-1.5 text-[10px] text-primary">
                                            {stageClientCount}
                                          </Badge>
                                        )}
                                      </div>

                                      {stageExpanded && stage.tasks.length > 0 && (
                                        <div className="space-y-1 border-t bg-muted/20 p-2 pr-8">
                                          {stage.tasks.map((task) => {
                                            const selectedTask = (filters.stageTaskFilters || []).find((item) => item.taskId === task.id);
                                            const statusLabel = selectedTask?.status === "complete"
                                              ? "הושלמה"
                                              : selectedTask?.status === "any"
                                                ? "בכל מצב"
                                                : "לא הושלמה";
                                            return (
                                              <div key={task.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-background">
                                                <Checkbox
                                                  checked={!!selectedTask}
                                                  aria-label={`בחר משימה ${task.title}`}
                                                  onCheckedChange={() => toggleStageTask(template.id, stage.stage_id, task.id, task.title)}
                                                />
                                                <span className="min-w-0 flex-1 truncate text-right text-xs">{task.title}</span>
                                                {selectedTask && (
                                                  <button
                                                    type="button"
                                                    className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
                                                    onClick={() => cycleTaskStatus(task.id)}
                                                    title="לחץ לשינוי מצב המשימה"
                                                  >
                                                    {statusLabel}
                                                  </button>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* ===== Consultants Tree ===== */}
                  {!activeStageTemplate && (
                  <div className="mt-5 pt-4 border-t border-border">
                    <ConsultantsTreeFilter
                      selectedConsultantIds={filters.consultantIds || []}
                      selectedProfessions={filters.consultantProfessions || []}
                      onChange={({ consultantIds, consultantProfessions }) =>
                        onFiltersChange({
                          ...filters,
                          consultantIds,
                          consultantProfessions,
                        })
                      }
                    />
                  </div>
                  )}
                </div>
              </div>
            </div>
            </div>,
            document.body
          )}
        </>
        )}

        {/* Date filter merged into the unified Sort & Date dropdown above */}

        {/* Payments relevant up to the client's current workflow stage */}
        {visibleFilterSections.has("payments") && (
          <Button
            variant="outline"
            size="sm"
            style={{ order: getFilterSectionOrder("payments") }}
            aria-expanded={activeQuickPanel === "payments"}
            onClick={() => {
              closeStagesDialog();
              setActiveQuickPanel((current) =>
                current === "payments" ? null : "payments",
              );
            }}
            className={cn(
              "gap-1.5 h-7 bg-white text-[#1e293b] border border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b] text-xs",
              filters.paymentStatus &&
                "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a]",
            )}
          >
            <CircleDollarSign className="h-4 w-4" />
            תשלומים
            <Badge variant="secondary" className="mr-1">
              {paymentSummary.due.clients}
            </Badge>
            <ChevronDown
              className={cn(
                "h-3 w-3 opacity-50 transition-transform",
                activeQuickPanel === "payments" && "rotate-180",
              )}
            />
          </Button>
        )}

        {/* Has Reminders Toggle */}
        {visibleFilterSections.has("reminders") && (
        <Button
          variant="outline"
          size="sm"
          style={{ order: getFilterSectionOrder("reminders") }}
          onClick={toggleHasReminders}
          className={cn(
            "gap-1.5 h-7 bg-white text-[#1e293b] border border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b] text-xs",
            filters.hasReminders === true &&
              "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a] text-xs",
          )}
        >
          <Bell className="h-4 w-4" />
          תזכורות
          <Badge variant="secondary" className="mr-1">
            {clientsWithReminders.size}
          </Badge>
        </Button>
        )}

        {/* Has Tasks Toggle */}
        {visibleFilterSections.has("tasks") && (
        <Button
          variant="outline"
          size="sm"
          style={{ order: getFilterSectionOrder("tasks") }}
          onClick={toggleHasTasks}
          className={cn(
            "gap-1.5 h-7 bg-white text-[#1e293b] border border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b] text-xs",
            filters.hasTasks === true &&
              "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a] text-xs",
          )}
        >
          <CheckSquare className="h-4 w-4" />
          משימות
          <Badge variant="secondary" className="mr-1">
            {clientsWithTasks.size}
          </Badge>
        </Button>
        )}

        {/* Recently active clients */}
        {visibleFilterSections.has("recent") && (
        <div
          style={{ order: getFilterSectionOrder("recent") }}
          className={cn(
            "flex h-7 items-center overflow-hidden rounded-md border border-[#d4a843] bg-white shadow-sm",
            filters.recentClientsDays && "bg-[#d4a843]",
          )}
        >
          <button
            type="button"
            aria-expanded={activeQuickPanel === "recent"}
            onClick={() => {
              closeStagesDialog();
              setActiveQuickPanel((current) =>
                current === "recent" ? null : "recent",
              );
            }}
            className={cn(
              "flex h-full items-center gap-1.5 px-2.5 text-xs font-medium text-[#1e293b] transition-colors hover:bg-[#fef9ee]",
              filters.recentClientsDays && "hover:bg-[#c49a3a]",
            )}
            title="לקוחות שנעשתה בהם פעילות לאחרונה"
          >
            <History className="h-3.5 w-3.5" />
            <span>לקוחות אחרונים</span>
            <Badge
              variant="secondary"
              className="mr-0.5 h-5 min-w-5 px-1.5 text-[10px]"
            >
              {filters.recentClientsDays
                ? recentClientsCount
                : `${recentClientsSettings.days}י׳`}
            </Badge>
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "grid h-6 w-7 shrink-0 place-items-center border-r border-[#d4a843]/70 text-[#1e3a5f] transition-colors hover:bg-[#fff7df]",
                  filters.recentClientsDays && "hover:bg-[#c49a3a]",
                )}
                aria-label="הגדרות לקוחות אחרונים"
                title="הגדרות לקוחות אחרונים"
              >
                <Settings2 className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={8}
              dir="rtl"
              className="w-80 border-[#d4a843] p-0 shadow-xl"
            >
              <div className="border-b border-[#d4a843]/30 bg-[#fffaf0] px-4 py-3">
                <div className="flex items-center gap-2 font-semibold text-[#1e3a5f]">
                  <Settings2 className="h-4 w-4 text-[#d4a843]" />
                  הגדרות לקוחות אחרונים
                </div>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  לקוח ייחשב אחרון אם נמצאה עבורו לפחות פעילות אחת בטווח
                  שבחרת.
                </p>
              </div>

              <div className="space-y-4 p-4">
                <div>
                  <Label className="mb-2 block text-xs font-semibold">
                    טווח זמן
                  </Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { days: 7, label: "שבוע" },
                      { days: 14, label: "שבועיים" },
                      { days: 30, label: "חודש" },
                      { days: 90, label: "3 חודשים" },
                    ].map((option) => (
                      <button
                        key={option.days}
                        type="button"
                        onClick={() => updateRecentClientsDays(option.days)}
                        className={cn(
                          "rounded-md border px-1 py-1.5 text-[11px] transition-colors",
                          recentClientsSettings.days === option.days
                            ? "border-[#d4a843] bg-[#d4a843] font-semibold text-[#1e293b]"
                            : "border-border bg-white hover:border-[#d4a843] hover:bg-[#fffaf0]",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={3650}
                      value={recentClientsSettings.days}
                      onChange={(event) => {
                        const days = Number(event.target.value);
                        if (Number.isFinite(days) && days >= 1) {
                          updateRecentClientsDays(Math.floor(days));
                        }
                      }}
                      className="h-8 w-24 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">
                      ימים אחרונים
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-xs font-semibold">
                    מה נחשב לפעילות?
                  </Label>
                  <div className="space-y-2 rounded-lg border bg-muted/20 p-2.5">
                    {[
                      { id: "client" as const, label: "עדכון בכרטיס הלקוח" },
                      { id: "process" as const, label: "תהליך, שלב או משימת שלב" },
                      { id: "tasks" as const, label: "משימה רגילה" },
                      { id: "reminders" as const, label: "תזכורת" },
                      { id: "meetings" as const, label: "פגישה" },
                    ].map((activity) => {
                      const selected =
                        recentClientsSettings.activityTypes?.length > 0
                          ? recentClientsSettings.activityTypes
                          : ["client", "process", "tasks", "reminders", "meetings"];
                      return (
                        <label
                          key={activity.id}
                          className="flex cursor-pointer items-center gap-2 text-xs text-[#1e293b]"
                        >
                          <Checkbox
                            checked={selected.includes(activity.id)}
                            onCheckedChange={() =>
                              toggleRecentActivityType(activity.id)
                            }
                          />
                          {activity.label}
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                    חייב להישאר לפחות סוג פעילות אחד. הלקוחות מוצגים מהפעילות
                    החדשה לישנה.
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        )}

        {/* Has Meetings Toggle */}
        {visibleFilterSections.has("meetings") && (
        <Button
          variant="outline"
          size="sm"
          style={{ order: getFilterSectionOrder("meetings") }}
          onClick={toggleHasMeetings}
          className={cn(
            "gap-1.5 h-7 bg-white text-[#1e293b] border border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b] text-xs",
            filters.hasMeetings === true &&
              "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a] text-xs",
          )}
        >
          <Users className="h-4 w-4" />
          פגישות
          <Badge variant="secondary" className="mr-1">
            {clientsWithMeetings.size}
          </Badge>
        </Button>
        )}

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            style={{ order: 1000 }}
            onClick={clearAllFilters}
            className="gap-1.5 h-7 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
            נקה
          </Button>
        )}
      </div>

      {activeQuickPanel === "stages" && visibleFilterSections.has("stages") && (
        <div
          className="mt-2 overflow-hidden rounded-xl border border-[#d4a843]/70 bg-gradient-to-l from-[#fffaf0] via-white to-[#f7f9fc] shadow-[0_8px_24px_rgba(30,58,95,0.08)]"
          aria-label="קיצורי דרך לתהליכים"
        >
          <div className="flex items-center gap-2 border-b border-[#d4a843]/25 px-3 py-1.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1e3a5f] text-[#e7b941] shadow-sm">
              <Layers className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#1e3a5f]">
                בחירת תהליך מהירה
              </p>
              <p className="text-[10px] text-slate-500">
                לחיצה על שם התהליך מסננת לקוחות; האייקון פותח שלבים ומשימות
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-full text-slate-500 hover:bg-[#1e3a5f]/10 hover:text-[#1e3a5f]"
              onClick={() => {
                setActiveQuickPanel(null);
                closeStagesDialog();
              }}
              aria-label="סגור קיצורי תהליכים"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="overflow-x-auto px-3 py-2.5 [scrollbar-color:#d4a843_transparent] [scrollbar-width:thin]">
            <div className="flex min-w-max items-center gap-2">
              {stageTemplatesLoading ? (
                <span className="px-3 py-2 text-xs text-slate-500">
                  טוען תהליכים...
                </span>
              ) : templateStageGroups.length === 0 ? (
                <span className="px-3 py-2 text-xs text-slate-500">
                  אין תהליכים עם שלבים מוגדרים
                </span>
              ) : (
                templateStageGroups.map((template) => {
                  const isActive =
                    stagesDialogOpen &&
                    activeStageTemplateId === template.id;
                  const selectedStages = (
                    filters.stageSelections || []
                  ).filter(
                    (selection) => selection.templateId === template.id,
                  ).length;
                  const isTemplateSelected = (
                    filters.stageTemplateIds || []
                  ).includes(template.id);

                  return (
                    <div
                      key={template.id}
                      className={cn(
                        "group flex h-10 items-center overflow-hidden rounded-xl border text-right transition-all duration-200",
                        "border-[#d4a843]/70 bg-white text-[#1e3a5f] shadow-sm hover:-translate-y-0.5 hover:border-[#d4a843] hover:bg-[#fff8e7] hover:shadow-md",
                        isActive &&
                          "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-md",
                        isTemplateSelected &&
                          !isActive &&
                          "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => applyQuickTemplateFilter(template.id)}
                        className="flex h-full min-w-0 flex-1 items-center gap-2 px-3 text-right"
                        aria-label={`סנן לקוחות לפי ${template.name}`}
                        aria-pressed={isTemplateSelected}
                      >
                        <span className="max-w-[190px] truncate text-xs font-bold">
                          {template.name}
                        </span>
                        <span
                          className={cn(
                            "rounded-full bg-[#f4ead3] px-2 py-0.5 text-[10px] font-semibold text-[#1e3a5f]",
                            isActive && "bg-white/15 text-white",
                            isTemplateSelected &&
                              !isActive &&
                              "bg-emerald-100 text-emerald-800",
                          )}
                        >
                          {template.stages.length} שלבים
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setManagedStageTemplateId(template.id);
                        }}
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          "bg-[#d4a843]/12 text-[#9a741d] hover:bg-[#d4a843]/25 hover:text-[#1e3a5f]",
                          isActive && "bg-white/10 text-white hover:bg-white/20",
                        )}
                        aria-label={`הוסף או הסר לקוחות מהקטגוריה ${template.name}`}
                        title="ניהול לקוחות בקטגוריה"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openStageTemplateDialog(template.id);
                        }}
                        className={cn(
                          "ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#d4a843] transition-colors",
                          "bg-[#1e3a5f]/8 hover:bg-[#1e3a5f]/15",
                          isActive && "bg-white/10 text-[#e7b941] hover:bg-white/20",
                          (selectedStages > 0 || isTemplateSelected) &&
                            !isActive &&
                            "bg-emerald-500 text-white hover:bg-emerald-600",
                        )}
                        aria-label={`בחר שלבים ומשימות עבור ${template.name}`}
                        title="בחירת שלבים ומשימות"
                      >
                        <Layers className="h-3.5 w-3.5" />
                      </button>
                      <span
                        className={cn(
                          "ml-2 text-[9px] font-semibold text-slate-500",
                          isActive && "text-white/75",
                        )}
                        title="מספר הלקוחות המסווגים בקטגוריה"
                      >
                        {stageTemplateCategoryCounts[template.id] || 0}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeQuickPanel === "recent" && visibleFilterSections.has("recent") && (
        <div
          className="mt-2 overflow-hidden rounded-xl border border-[#d4a843]/70 bg-gradient-to-l from-[#fffaf0] via-white to-[#f7f9fc] shadow-[0_8px_24px_rgba(30,58,95,0.08)]"
          aria-label="אפשרויות לקוחות אחרונים"
        >
          <div className="flex items-center gap-2 border-b border-[#d4a843]/25 px-3 py-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1e3a5f] text-[#e7b941] shadow-sm">
              <History className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#1e3a5f]">
                לקוחות אחרונים
              </p>
              <p className="text-[10px] text-slate-500">
                בחר טווח זמן וסוגי פעילות להצגה מהירה
              </p>
            </div>
            {filters.recentClientsDays && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-3 text-[10px] text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
                onClick={() =>
                  onFiltersChange({ ...filters, recentClientsDays: null })
                }
              >
                הצג את כל הלקוחות
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-full text-slate-500 hover:bg-[#1e3a5f]/10 hover:text-[#1e3a5f]"
              onClick={() => setActiveQuickPanel(null)}
              aria-label="סגור אפשרויות לקוחות אחרונים"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid gap-2 px-2.5 py-2 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.25fr_1.45fr]">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 rounded-lg border border-[#d4a843]/25 bg-white/75 px-2.5 py-2 shadow-sm">
              <span className="ml-1 text-[10px] font-bold text-[#1e3a5f]">
                סדר תצוגה
              </span>
              {[
                {
                  id: "activity" as const,
                  label: "פעילות אחרונה",
                  description: "הלקוח שעבדו עליו לאחרונה מופיע ראשון",
                },
                {
                  id: "custom" as const,
                  label: "סדר אישי בגרירה",
                  description: "כל משתמש שומר לעצמו סדר אחר",
                },
              ].map((option) => {
                const isSelected =
                  (filters.recentClientsSortMode || "activity") === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        recentClientsDays:
                          filters.recentClientsDays ||
                          recentClientsSettings.days,
                        recentClientsSortMode: option.id,
                      })
                    }
                    className={cn(
                      "h-8 rounded-lg border border-[#d4a843]/70 bg-white px-3 text-[11px] font-semibold text-[#1e3a5f] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#fff8e7]",
                      isSelected &&
                        "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-md hover:bg-[#1e3a5f]",
                    )}
                    title={option.description}
                    aria-pressed={isSelected}
                  >
                    {option.label}
                  </button>
                );
              })}
              {(filters.recentClientsSortMode || "activity") === "custom" && (
                <>
                  <span className="min-w-[150px] flex-1 text-[10px] leading-4 text-slate-500">
                    גרור בידית שעל הכרטיס כדי לקבוע מי יופיע ראשון
                  </span>
                  {hasRecentCustomOrder && onResetRecentCustomOrder && (
                    <button
                      type="button"
                      onClick={onResetRecentCustomOrder}
                      className="h-7 rounded-full border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-500 transition-colors hover:border-[#d4a843] hover:text-[#1e3a5f]"
                    >
                      איפוס הסדר האישי
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-1.5 rounded-lg border border-[#d4a843]/25 bg-white/75 px-2.5 py-2 shadow-sm">
              <span className="ml-1 text-[10px] font-bold text-[#1e3a5f]">
                טווח זמן
              </span>
              {[
                { days: 7, label: "שבוע" },
                { days: 14, label: "שבועיים" },
                { days: 30, label: "חודש" },
                { days: 90, label: "3 חודשים" },
              ].map((option) => {
                const isSelected =
                  filters.recentClientsDays === option.days;
                return (
                  <button
                    key={option.days}
                    type="button"
                    onClick={() => applyRecentClientsDays(option.days)}
                    className={cn(
                      "h-8 rounded-lg border border-[#d4a843]/70 bg-white px-2.5 text-[11px] font-semibold text-[#1e3a5f] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#fff8e7]",
                      isSelected &&
                        "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-md hover:bg-[#1e3a5f]",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
              <label className="flex h-8 items-center gap-1.5 rounded-lg border border-[#d4a843]/70 bg-white px-2 text-[10px] text-slate-500">
                <Input
                  type="number"
                  min={1}
                  max={3650}
                  value={recentClientsSettings.days}
                  onChange={(event) => {
                    const days = Number(event.target.value);
                    if (Number.isFinite(days) && days >= 1) {
                      applyRecentClientsDays(Math.floor(days));
                    }
                  }}
                  className="h-6 w-14 border-0 bg-transparent p-0 text-center text-xs font-bold text-[#1e3a5f] shadow-none focus-visible:ring-0"
                  aria-label="מספר ימים ללקוחות אחרונים"
                />
                ימים
              </label>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-1.5 rounded-lg border border-[#d4a843]/25 bg-white/75 px-2.5 py-2 shadow-sm sm:col-span-2 lg:col-span-1">
              <span className="ml-1 text-[10px] font-bold text-[#1e3a5f]">
                פעילות
              </span>
              {[
                { id: "client" as const, label: "כרטיס לקוח" },
                { id: "process" as const, label: "תהליכים ושלבים" },
                { id: "tasks" as const, label: "משימות" },
                { id: "reminders" as const, label: "תזכורות" },
                { id: "meetings" as const, label: "פגישות" },
              ].map((activity) => {
                const selectedTypes =
                  recentClientsSettings.activityTypes?.length > 0
                    ? recentClientsSettings.activityTypes
                    : [
                        "client",
                        "process",
                        "tasks",
                        "reminders",
                        "meetings",
                      ];
                const isSelected = selectedTypes.includes(activity.id);
                return (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => toggleRecentActivityType(activity.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[10px] transition-colors",
                      isSelected
                        ? "border-[#d4a843] bg-[#f8edcf] font-semibold text-[#1e3a5f]"
                        : "border-slate-200 bg-white text-slate-400 hover:border-[#d4a843]",
                    )}
                    aria-pressed={isSelected}
                  >
                    {activity.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeQuickPanel === "payments" &&
        visibleFilterSections.has("payments") && (
          <div
            className="mt-2 overflow-hidden rounded-xl border border-[#d4a843]/70 bg-gradient-to-l from-[#fffaf0] via-white to-[#f7f9fc] shadow-[0_8px_24px_rgba(30,58,95,0.08)]"
            aria-label="אפשרויות סינון תשלומים"
          >
            <div className="flex items-center gap-2 border-b border-[#d4a843]/25 px-3 py-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1e3a5f] text-[#e7b941] shadow-sm">
                <CircleDollarSign className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#1e3a5f]">
                  תשלומים עד השלב הנוכחי
                </p>
                <p className="text-[10px] text-slate-500">
                  תשלומים משלבים עתידיים אינם נכללים בחישוב
                </p>
              </div>
              {filters.paymentStatus && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-3 text-[10px] text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
                  onClick={() =>
                    onFiltersChange({ ...filters, paymentStatus: null })
                  }
                >
                  הצג את כל הלקוחות
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-full text-slate-500 hover:bg-[#1e3a5f]/10 hover:text-[#1e3a5f]"
                onClick={() => setActiveQuickPanel(null)}
                aria-label="סגור אפשרויות תשלומים"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="overflow-x-auto p-2 [scrollbar-color:#d4a843_transparent] [scrollbar-width:thin]">
            <div className="grid min-w-[1040px] grid-cols-4 gap-2">
              {[
                {
                  id: "due" as const,
                  title: "ממתינים לתשלום",
                  description: "לא שולם בשלב הנוכחי או בשלב שכבר עבר",
                  icon: CircleAlert,
                  accent: "text-red-600",
                  selectedClass:
                    "border-red-400 bg-red-50 ring-1 ring-red-200",
                },
                {
                  id: "current" as const,
                  title: "בשלב הנוכחי",
                  description: "תשלומים שמשויכים לשלב שבו הלקוח נמצא",
                  icon: CircleDollarSign,
                  accent: "text-amber-600",
                  selectedClass:
                    "border-amber-400 bg-amber-50 ring-1 ring-amber-200",
                },
                {
                  id: "paid" as const,
                  title: "שולמו עד כה",
                  description: "כל התשלומים שכבר סומנו כשולמו",
                  icon: CircleCheckBig,
                  accent: "text-emerald-600",
                  selectedClass:
                    "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200",
                },
                {
                  id: "reached" as const,
                  title: "הכול עד עכשיו",
                  description: "שולם וממתין, ללא שלבים עתידיים",
                  icon: Layers,
                  accent: "text-[#1e3a5f]",
                  selectedClass:
                    "border-[#1e3a5f] bg-[#eef3f8] ring-1 ring-[#1e3a5f]/20",
                },
              ].map((option) => {
                const Icon = option.icon;
                const summary = paymentSummary[option.id];
                const isSelected = filters.paymentStatus === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        paymentStatus: isSelected ? null : option.id,
                      })
                    }
                    className={cn(
                      "group rounded-lg border border-slate-200 bg-white p-2 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#d4a843] hover:shadow-md",
                      isSelected && option.selectedClass,
                    )}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start gap-1.5">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50",
                          option.accent,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-[#1e3a5f]">
                          {option.title}
                        </span>
                        <span className="mt-0.5 block whitespace-nowrap text-[9px] leading-3.5 text-slate-500">
                          {option.description}
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5">
                      <span className="text-[9px] text-slate-500">
                        {summary.clients} לקוחות · {summary.payments} תשלומים
                      </span>
                      <span className={cn("text-[11px] font-black", option.accent)}>
                        {formatCompactNis(summary.amount)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            </div>
          </div>
        )}

      {/* Active Filters Summary removed per user request */}
    </div>

      <ManageStageTemplateClientsDialog
        open={!!managedStageTemplate}
        onOpenChange={(open) => {
          if (!open) setManagedStageTemplateId(null);
        }}
        stageTemplateId={managedStageTemplate?.id || null}
        stageTemplateName={managedStageTemplate?.name || ""}
        onSaved={onUpdate}
      />

      <Dialog open={dateTabsManagerOpen} onOpenChange={setDateTabsManagerOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>ניהול טאבי טווח תאריכים</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {dateRangeTabs.length === 0 ? (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                אין טאבים. אפשר להוסיף טאב חדש עם כפתור "חדש".
              </div>
            ) : (
              dateRangeTabs.map((tab, idx) => (
                <div key={tab.id} className="flex items-center gap-2 rounded-md border p-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{tab.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {rangeLabel(tab.range)} · {tab.scope === "shared" ? "משותף" : "פרטי"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => moveDateTab(tab.id, "up")}
                      disabled={idx === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => moveDateTab(tab.id, "down")}
                      disabled={idx === dateRangeTabs.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => openEditDateTabEditor(tab)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => duplicateDateTab(tab)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-destructive"
                      onClick={() => removeDateTab(tab.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={openCreateDateTabEditor}>
              <Plus className="h-4 w-4 ml-1" />
              טאב חדש
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dateTabEditorOpen}
        onOpenChange={(open) => {
          setDateTabEditorOpen(open);
          if (!open) resetTabEditor();
        }}
      >
        <DialogContent dir="rtl" className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingDateTabId ? "עריכת טאב" : "טאב חדש"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם הטאב</Label>
              <Input
                value={tabNameInput}
                onChange={(e) => setTabNameInput(e.target.value)}
                placeholder="לדוגמה: 90 ימים"
              />
            </div>

            <div className="space-y-2">
              <Label>הרשאה</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={tabScopeInput === "private" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTabScopeInput("private")}
                >
                  פרטי
                </Button>
                <Button
                  type="button"
                  variant={tabScopeInput === "shared" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTabScopeInput("shared")}
                >
                  משותף
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>סוג טווח</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={rangeKindInput === "relative" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRangeKindInput("relative")}
                >
                  יחסי
                </Button>
                <Button
                  type="button"
                  variant={rangeKindInput === "fixed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRangeKindInput("fixed")}
                >
                  קבוע
                </Button>
                <Button
                  type="button"
                  variant={rangeKindInput === "advanced" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRangeKindInput("advanced")}
                >
                  מתקדם
                </Button>
              </div>
            </div>

            {rangeKindInput === "relative" && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min={1}
                  value={relativeAmountInput}
                  onChange={(e) => setRelativeAmountInput(Number(e.target.value) || 1)}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={relativeUnitInput === "days" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRelativeUnitInput("days")}
                  >
                    ימים
                  </Button>
                  <Button
                    type="button"
                    variant={relativeUnitInput === "weeks" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRelativeUnitInput("weeks")}
                  >
                    שבועות
                  </Button>
                  <Button
                    type="button"
                    variant={relativeUnitInput === "months" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRelativeUnitInput("months")}
                  >
                    חודשים
                  </Button>
                </div>
              </div>
            )}

            {rangeKindInput === "fixed" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">מתאריך</Label>
                  <Input
                    type="date"
                    value={fixedFromInput}
                    onChange={(e) => setFixedFromInput(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">עד תאריך</Label>
                  <Input
                    type="date"
                    value={fixedToInput}
                    onChange={(e) => setFixedToInput(e.target.value)}
                  />
                </div>
              </div>
            )}

            {rangeKindInput === "advanced" && (
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "current_month", label: "חודש נוכחי" },
                  { key: "previous_month", label: "חודש קודם" },
                  { key: "last_week", label: "שבוע שעבר" },
                  { key: "current_quarter", label: "רבעון נוכחי" },
                  { key: "last_year", label: "שנה קודמת" },
                ].map((preset) => (
                  <Button
                    key={preset.key}
                    type="button"
                    variant={advancedPresetInput === preset.key ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setAdvancedPresetInput(
                        preset.key as Extract<ClientDateRangeConfig, { kind: "advanced" }>['preset'],
                      )
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDateTabEditorOpen(false)}>
              ביטול
            </Button>
            <Button type="button" onClick={saveDateTabEditor}>
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
