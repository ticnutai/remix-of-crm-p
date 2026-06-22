// Clients Filter Strip Component - tenarch CRM Pro
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { supabase } from "@/integrations/supabase/client";
import { AddClientsToCategoryDialog } from './AddClientsToCategoryDialog';
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConsultantsFilterPopover } from "./ConsultantsFilterPopover";

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
  dateFilter: "all" | "today" | "week" | "month" | "older";
  hasReminders: boolean | null;
  hasTasks: boolean | null;
  hasMeetings: boolean | null;
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

interface ClientStageDefinition {
  stage_id: string;
  stage_name: string;
  stage_icon: string | null;
}

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
  categories?: ClientCategory[];
  categoryCounts?: Record<string, number>;
  stageCounts?: Record<string, number>;
  monthAgeCounts?: {
    ranges: Record<"m4_plus" | "m6_plus" | "m8_plus", number>;
    byExact: Record<number, number>;
  };
  allTags?: string[];
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

export function ClientsFilterStrip({
  filters,
  onFiltersChange,
  clientsWithReminders,
  clientsWithTasks,
  clientsWithMeetings,
  categories = [],
  categoryCounts = {},
  stageCounts = {},
  monthAgeCounts = {
    ranges: { m4_plus: 0, m6_plus: 0, m8_plus: 0 },
    byExact: {},
  },
  allTags = [],
  visibleClientsCount,
  onOpenCategoryManager,
  onUpdate,
  dateRangeTabs = [],
  onDateRangeTabsChange,
}: ClientsFilterStripProps) {
  const [stageDefinitions, setStageDefinitions] = useState<
    ClientStageDefinition[]
  >([]);
  const [stagesDialogOpen, setStagesDialogOpen] = useState(false);
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
  const [addToCategoryId, setAddToCategoryId] = useState<string | null>(null);
  const addToCategory = categories.find((c) => c.id === addToCategoryId);

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
  // Fetch unique stages from all clients
  useEffect(() => {
    fetchStageDefinitions();
  }, []);

  const fetchStageDefinitions = async () => {
    try {
      const { data, error } = await supabase
        .from("client_stages")
        .select("stage_id, stage_name, stage_icon")
        .order("sort_order");

      if (error) throw error;

      // Deduplicate by stage_name to show each unique stage definition only once
      const uniqueStages =
        data?.reduce((acc, stage) => {
          if (!acc.some((s) => s.stage_name === stage.stage_name)) {
            acc.push(stage);
          }
          return acc;
        }, [] as ClientStageDefinition[]) || [];

      setStageDefinitions(uniqueStages);
    } catch (error) {
      console.error("Error fetching stage definitions:", error);
    }
  };

  const toggleStage = (stageName: string) => {
    const newStages = filters.stages.includes(stageName)
      ? filters.stages.filter((s) => s !== stageName)
      : [...filters.stages, stageName];
    onFiltersChange({ ...filters, stages: newStages });
  };

  const clearStages = () => {
    onFiltersChange({ ...filters, stages: [] });
  };

  const selectAllStages = () => {
    onFiltersChange({
      ...filters,
      stages: stageDefinitions.map((s) => s.stage_name),
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
    onFiltersChange({ ...filters, hasReminders: newValue });
  };

  const toggleHasTasks = () => {
    const newValue = filters.hasTasks === true ? null : true;
    onFiltersChange({ ...filters, hasTasks: newValue });
  };

  const toggleHasMeetings = () => {
    const newValue = filters.hasMeetings === true ? null : true;
    onFiltersChange({ ...filters, hasMeetings: newValue });
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
    filters.dateFilter !== "all" ||
    filters.hasReminders !== null ||
    filters.hasTasks !== null ||
    filters.hasMeetings !== null ||
    filters.categories.length > 0 ||
    filters.tags.length > 0 ||
    !!filters.customDateRange ||
    (filters.monthAgeRanges && filters.monthAgeRanges.length > 0) ||
    filters.exactMonth !== null ||
    (filters.hiddenClassifications && filters.hiddenClassifications.length > 0);

  const clearAllFilters = () => {
    onFiltersChange({
      stages: [],
      dateFilter: "all",
      hasReminders: null,
      hasTasks: null,
      hasMeetings: null,
      categories: [],
      tags: [],
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

  // Visible filter sections (persisted)
  const FILTER_SECTIONS: { id: string; label: string }[] = [
    { id: "sort", label: "מיון / תאריך" },
    { id: "classification", label: "סיווג" },
    { id: "consultants", label: "יועצים" },
    { id: "categories", label: "קטגוריות" },
    { id: "tags", label: "תגיות" },
    { id: "stages", label: "שלבים" },
    { id: "reminders", label: "תזכורות" },
    { id: "tasks", label: "משימות" },
    { id: "meetings", label: "פגישות" },
  ];
  const [visibleFilterSectionsArr, setVisibleFilterSectionsArr] = useSyncedSetting<string[]>({
    key: "clients-filter-strip-visible-sections",
    defaultValue: FILTER_SECTIONS.map((s) => s.id),
  });
  const visibleFilterSections = useMemo(() => new Set(visibleFilterSectionsArr), [visibleFilterSectionsArr]);
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
              className="h-7 w-7 bg-white border border-[#d4a843] hover:bg-[#fef9ee]"
              title="הגדרת פילטרים מוצגים"
            >
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[260px] p-0" dir="rtl" align="end">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">פילטרים מוצגים</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFilterSettingsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-2 space-y-1">
              {FILTER_SECTIONS.map((s) => {
                const on = visibleFilterSections.has(s.id);
                return (
                  <div key={s.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      {on ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      <Label htmlFor={`flt-${s.id}`} className="text-xs cursor-pointer">{s.label}</Label>
                    </div>
                    <Switch id={`flt-${s.id}`} checked={on} onCheckedChange={() => toggleFilterSection(s.id)} />
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
        )}

        {/* Categories Filter */}
        {visibleFilterSections.has("categories") && (
        <Popover
          open={categoriesDialogOpen}
          onOpenChange={setCategoriesDialogOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-1.5 h-7 bg-white text-[#1e293b] border border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b] text-xs",
                filters.categories.length > 0 &&
                  "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a] text-xs",
              )}
            >
              <FolderOpen className="h-4 w-4" />
              קטגוריות
              {selectedCategories.length > 0 && (
                <span className="inline-flex items-center -space-x-1 rtl:space-x-reverse mr-1">
                  {selectedCategories.slice(0, 2).map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#f5d27a] bg-[#1e3a5f] text-[#d4a843]"
                      title={category.name}
                    >
                      {iconMap[category.icon] || <FolderOpen className="h-3 w-3" />}
                    </span>
                  ))}
                </span>
              )}
              {filters.categories.length > 0 && (
                <Badge
                  variant="secondary"
                  className="mr-1 bg-accent text-accent-foreground"
                >
                  {filters.categories.length}
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
                <FolderOpen className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">סינון לפי קטגוריה</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 mr-auto bg-primary/10 hover:bg-primary/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCategoriesDialogOpen(false);
                    onOpenCategoryManager?.();
                  }}
                  title="הוסף קטגוריה"
                >
                  <Plus className="h-4 w-4 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setCategoriesDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {filters.categories.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearCategories}>
                  נקה הכל
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-[50vh] p-4">
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    אין קטגוריות מוגדרות
                  </p>
                ) : (
                  categories.map((category) => {
                    const categoryClientCount = categoryCounts[category.id] || 0;

                    return (
                      <div
                        key={category.id}
                        className={cn(
                          "group flex items-center gap-2 p-2 pr-3 rounded-lg border transition-all",
                          filters.categories.includes(category.id)
                            ? "bg-primary/10 border-primary"
                            : "bg-background border-border hover:border-primary/50",
                        )}
                      >
                        <Checkbox
                          checked={filters.categories.includes(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        >
                          {iconMap[category.icon] || (
                            <FolderOpen className="h-3 w-3" />
                          )}
                        </div>
                        <button
                          className="font-medium flex-1 text-right cursor-pointer bg-transparent border-0 p-0"
                          onClick={() => toggleCategory(category.id)}
                          type="button"
                        >
                          {category.name}
                        </button>
                        {categoryClientCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-5 min-w-5 px-1.5 text-[10px] bg-primary/10 text-primary"
                          >
                            {categoryClientCount}
                          </Badge>
                        )}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-amber-100 hover:text-amber-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoriesDialogOpen(false);
                              setAddToCategoryId(category.id);
                            }}
                            title={`הוסף לקוחות ל${category.name}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-blue-100 hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoriesDialogOpen(false);
                              onOpenCategoryManager?.();
                            }}
                            title="ערוך קטגוריה"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-red-100 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoriesDialogOpen(false);
                              onOpenCategoryManager?.();
                            }}
                            title="מחק קטגוריה"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        )}

        {/* Tags Filter */}
        {visibleFilterSections.has("tags") && (
        <Popover open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
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
              {filters.tags.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearTags}>
                  נקה הכל
                </Button>
              )}
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
                        "cursor-pointer transition-all",
                        filters.tags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary/10",
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      <Tag className="h-3 w-3 ml-1" />
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
        <Popover open={stagesDialogOpen} onOpenChange={setStagesDialogOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-1.5 h-7 bg-white text-[#1e293b] border border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b] text-xs",
                filters.stages.length > 0 &&
                  "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a] text-xs",
              )}
            >
              <Layers className="h-4 w-4" />
              שלבים
              {filters.stages.length > 0 && (
                <Badge
                  variant="secondary"
                  className="mr-1 bg-accent text-accent-foreground"
                >
                  {filters.stages.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0" dir="rtl" align="end">
            <div className="p-4 border-b">
              <div className="flex flex-row-reverse items-center gap-2 mb-3">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">סינון לפי שלבים</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-auto"
                  onClick={() => setStagesDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-row-reverse gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={selectAllStages}>
                  בחר הכל
                </Button>
                <Button variant="outline" size="sm" onClick={clearStages}>
                  נקה הכל
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[300px] p-4">
              <div className="space-y-3">
                {stageDefinitions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    אין שלבים מוגדרים
                  </p>
                ) : (
                  stageDefinitions.map((stage) => {
                    const stageClientCount = stageCounts[stage.stage_name] || 0;

                    return (
                      <div
                        key={stage.stage_name}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          filters.stages.includes(stage.stage_name)
                            ? "bg-primary/10 border-primary"
                            : "bg-background border-border hover:border-primary/50",
                        )}
                        onClick={() => toggleStage(stage.stage_name)}
                      >
                        <Checkbox
                          checked={filters.stages.includes(stage.stage_name)}
                          onCheckedChange={() => toggleStage(stage.stage_name)}
                        />
                        <span className="font-medium text-foreground text-right flex-1">
                          {stage.stage_name}
                        </span>
                        {stageClientCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-5 min-w-5 px-1.5 text-[10px] bg-primary/10 text-primary"
                          >
                            {stageClientCount}
                          </Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        )}

        {/* Date filter merged into the unified Sort & Date dropdown above */}

        {/* Has Reminders Toggle */}
        {visibleFilterSections.has("reminders") && (
        <Button
          variant="outline"
          size="sm"
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

        {/* Has Meetings Toggle */}
        {visibleFilterSections.has("meetings") && (
        <Button
          variant="outline"
          size="sm"
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
            onClick={clearAllFilters}
            className="gap-1.5 h-7 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
            נקה
          </Button>
        )}
      </div>

      {/* Active Filters Summary removed per user request */}
    </div>

      {/* Add Clients to Category Dialog */}
      {addToCategory && (
        <AddClientsToCategoryDialog
          isOpen={!!addToCategoryId}
          onClose={() => setAddToCategoryId(null)}
          categoryId={addToCategory.id}
          categoryName={addToCategory.name}
          categoryColor={addToCategory.color || '#d4a843'}
          onUpdate={() => {
            onUpdate?.();
            setAddToCategoryId(null);
          }}
        />
      )}

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
