// Elegant Clients Gallery - tenarch CRM Pro
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { PhoneWithExtras } from "@/components/clients/PhoneWithExtras";
import { Input } from "@/components/ui/input";
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
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useViewSettings, useUserSettings } from "@/hooks/useUserSettings";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { useUserFilter } from "@/components/shared/UserFilterMenu";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { toast } from "@/hooks/use-toast";
import {
  ClientsFilterStrip,
  ClientFilterState,
  type DateRangeTabItem,
  type ClientDateRangeConfig,
  type ClientPaymentFilterSummary,
} from "@/components/clients/ClientsFilterStrip";
import { ClientQuickClassify } from "@/components/clients/ClientQuickClassify";
import SmartComboField from "@/components/clients/SmartComboField";
import CustomFieldsSection from "@/components/clients/CustomFieldsSection";
import {
  useClientCustomFields,
  CustomFieldValues,
} from "@/hooks/useClientCustomFields";
import { useClientFieldConfig } from "@/hooks/useClientFieldConfig";
import { ClientNameWithCategory } from "@/components/clients/ClientNameWithCategory";
import {
  ClientProcessControl,
  type ClientProcessControlSettings,
} from "@/components/clients/ClientProcessControl";
import { TaskClientMessageButton } from "@/components/client-tabs/TaskClientMessageButton";
import { ActivityFollowUpActions } from "@/components/shared/ActivityFollowUpActions";
import { QuickAddTask } from "@/components/layout/sidebar-tasks/QuickAddTask";
import { QuickAddMeeting } from "@/components/layout/sidebar-tasks/QuickAddMeeting";
import { AddReminderDialog } from "@/components/reminders/AddReminderDialog";
import type { Task, TaskInsert } from "@/hooks/useTasksOptimized";
import type { MeetingInsert } from "@/hooks/useMeetingsOptimized";
import { ViewPresetsMenu, type ViewPresetState } from "@/components/clients/ViewPresetsMenu";
import {
  usePageCustomizer,
  PageCustomizerPanel,
  type PageSection,
  type PageFeature,
} from "@/components/page-customizer/PageCustomizer";
import { isValidPhoneForDisplay } from "@/lib/phone-utils";
import { isVisibleClientPaymentStage } from "@/lib/clientPaymentStages";
import {
  Users,
  Heart,
  Building,
  Handshake,
  FolderOpen,
  Search,
  Phone,
  Mail,
  Pencil,
  Trash2,
  Eye,
  Bell,
  CheckSquare,
  Calendar,
  Square,
  Rows3,
  Sheet,
  Upload,
  Loader2,
  Check,
  X,
  CheckCheck,
  UserPlus,
  Tag,
  Settings,
  AlertTriangle,
  Copy,
  RefreshCw,
  HelpCircle,
  Sparkles,
  Clock,
  Layers,
  BarChart3,
  Shield,
  MessageCircle,
  Settings2,
  ClipboardList,
  CircleDollarSign,
  GripVertical,
  Plus,
} from "lucide-react";
import {
  moveRecentClientBefore,
  sortByPersonalRecentOrder,
} from "@/lib/recentClientOrder";
import { cn } from "@/lib/utils";

const ClientsByStageView = React.lazy(() =>
  import("@/components/clients/ClientsByStageView").then((module) => ({
    default: module.ClientsByStageView,
  })),
);
const ClientsStatisticsView = React.lazy(() =>
  import("@/components/clients/ClientsStatisticsView").then((module) => ({
    default: module.ClientsStatisticsView,
  })),
);
const ClientAccessSection = React.lazy(() =>
  import("@/components/clients/ClientAccessSection").then((module) => ({
    default: module.ClientAccessSection,
  })),
);
const BulkClassifyDialog = React.lazy(() =>
  import("@/components/clients/BulkClassifyDialog").then((module) => ({
    default: module.BulkClassifyDialog,
  })),
);
const BulkStageDialog = React.lazy(() =>
  import("@/components/clients/BulkStageDialog").then((module) => ({
    default: module.BulkStageDialog,
  })),
);
const BulkConsultantDialog = React.lazy(() =>
  import("@/components/clients/BulkConsultantDialog").then((module) => ({
    default: module.BulkConsultantDialog,
  })),
);
const CategoryTagsManager = React.lazy(() =>
  import("@/components/clients/CategoryTagsManager").then((module) => ({
    default: module.CategoryTagsManager,
  })),
);

function isDateInCustomRange(
  createdAt: Date,
  range: ClientDateRangeConfig,
  now: Date,
): boolean {
  if (range.kind === "relative") {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const start = new Date(end);
    if (range.unit === "days") {
      start.setDate(start.getDate() - range.amount);
    } else if (range.unit === "weeks") {
      start.setDate(start.getDate() - range.amount * 7);
    } else {
      start.setMonth(start.getMonth() - range.amount);
    }
    return createdAt >= start && createdAt < end;
  }

  if (range.kind === "fixed") {
    const from = new Date(range.from);
    const to = new Date(range.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return true;
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
    return createdAt >= start && createdAt < end;
  }

  const year = now.getFullYear();
  const month = now.getMonth();
  let start: Date;
  let end: Date;

  switch (range.preset) {
    case "last_week": {
      const day = now.getDay();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      end = weekStart;
      start = new Date(weekStart);
      start.setDate(start.getDate() - 7);
      break;
    }
    case "current_quarter": {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      start = new Date(year, quarterStartMonth, 1);
      end = new Date(year, quarterStartMonth + 3, 1);
      break;
    }
    case "last_year": {
      start = new Date(year - 1, 0, 1);
      end = new Date(year, 0, 1);
      break;
    }
    case "previous_month": {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 1);
      break;
    }
    case "current_month":
    default: {
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 1);
      break;
    }
  }

  return createdAt >= start && createdAt < end;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: "active" | "inactive" | "pending" | null;
  created_at: string;
  updated_at?: string | null;
  category_id: string | null;
  tags: string[] | null;
  classification: string | null;
}

interface ClientCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ClientTagDefinition {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

interface ClientStageInfo {
  id: string;
  client_id: string;
  stage_id: string;
  stage_name: string;
  sort_order: number;
  is_completed: boolean | null;
  updated_at?: string;
}

interface ClientStageTaskInfo {
  id: string;
  client_id: string;
  stage_id: string;
  title: string;
  completed: boolean;
  due_date?: string | null;
  updated_at?: string;
}

interface ClientPaymentStageInfo {
  id: string;
  client_id: string;
  linked_stage_id: string | null;
  linked_task_id: string | null;
  stage_name: string;
  is_paid: boolean | null;
  amount: number;
  amount_with_vat: number | null;
  paid_amount: number | null;
}

interface ClientPaymentDisplayItem {
  id: string;
  title: string;
  workflowStageName: string;
  workflowStageOrder: number;
  grossAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isCurrent: boolean;
}

interface ClientTaskActivity {
  id: string;
  client_id: string;
  created_by: string;
  assigned_to: string | null;
  title: string;
  due_date: string | null;
  status: string | null;
  updated_at: string;
}

interface ClientReminderActivity {
  id: string;
  client_id: string;
  title: string;
  remind_at: string;
  created_at: string;
  is_dismissed: boolean | null;
}

interface ClientMeetingActivity {
  id: string;
  client_id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string | null;
  updated_at: string;
}

type ClientTaskViewContent =
  | "process"
  | "tasks"
  | "reminders"
  | "meetings"
  | "payments";

type ClientCardQuickCreate = {
  clientId: string;
  clientName: string;
  kind: Exclude<ClientTaskViewContent, "payments">;
};

interface ClientStageTemplateInfo {
  id: string;
  name: string;
  stages: Array<{ id: string; stage_name: string }>;
}

const clientCategoryIconMap: Record<
  string,
  (props: { className?: string; style?: React.CSSProperties }) => React.ReactNode
> = {
  Users: (props) => <Users {...props} />,
  Heart: (props) => <Heart {...props} />,
  Building: (props) => <Building {...props} />,
  Handshake: (props) => <Handshake {...props} />,
  FolderOpen: (props) => <FolderOpen {...props} />,
};

const DEFAULT_CLIENT_DATE_RANGE_TABS: DateRangeTabItem[] = [
  {
    id: "range-30-days",
    name: "30 ימים",
    scope: "private",
    range: { kind: "relative", amount: 30, unit: "days" },
  },
  {
    id: "range-90-days",
    name: "90 ימים",
    scope: "private",
    range: { kind: "relative", amount: 90, unit: "days" },
  },
  {
    id: "range-180-days",
    name: "180 ימים",
    scope: "private",
    range: { kind: "relative", amount: 180, unit: "days" },
  },
];

// In-memory cache of the last loaded clients list. Survives SPA navigation
// (the module stays alive while the app is mounted) so returning to the Clients
// tab renders the previous list instantly while a fresh fetch refreshes it in
// the background — no empty-state flash or "old skeleton".
let clientsCache: Client[] | null = null;
const CLIENTS_FETCH_PAGE_SIZE = 200;
let clientsFirstPageFetch: Promise<Client[]> | null = null;
let clientsRemainingFetch: Promise<Client[]> | null = null;

type ClientFilterDataPayload = {
  stages: ClientStageInfo[];
  stageTasks: ClientStageTaskInfo[];
  paymentStages: ClientPaymentStageInfo[];
  stageTemplates: ClientStageTemplateInfo[];
  reminderClientIds: string[];
  meetingClientIds: string[];
  tasks: ClientTaskActivity[];
  reminders: ClientReminderActivity[];
  meetings: ClientMeetingActivity[];
  latestActivityByClient: Record<string, string>;
  latestActivityByType: Record<
    "process" | "tasks" | "reminders" | "meetings",
    Record<string, string>
  >;
  latestSignedByClient: Record<string, string>;
};

let clientFilterDataFetch: Promise<ClientFilterDataPayload> | null = null;
let categoriesAndTagsFetch: Promise<{
  categories: ClientCategory[];
  tags: string[];
  tagDefinitions: ClientTagDefinition[];
}> | null = null;
let clientConsultantsFetch: Promise<
  Record<string, Array<{ consultantId: string; profession: string }>>
> | null = null;

const FILTER_DATA_PAGE_SIZE = 1000;

async function fetchAllFilterRows(
  table: "client_stages" | "client_stage_tasks" | "client_payment_stages",
  columns: string,
) {
  const rows: any[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select(columns)
      .order("created_at", { ascending: true })
      .range(offset, offset + FILTER_DATA_PAGE_SIZE - 1);

    if (error) return { data: null, error };

    const page = data || [];
    rows.push(...page);
    if (page.length < FILTER_DATA_PAGE_SIZE) break;
    offset += FILTER_DATA_PAGE_SIZE;
  }

  return { data: rows, error: null };
}

function fetchClientsFirstPage(): Promise<Client[]> {
  if (clientsFirstPageFetch) return clientsFirstPageFetch;

  clientsFirstPageFetch = (async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false })
      .range(0, CLIENTS_FETCH_PAGE_SIZE - 1);

    if (error) throw error;
    return (data || []) as Client[];
  })().finally(() => {
    clientsFirstPageFetch = null;
  });

  return clientsFirstPageFetch;
}

function fetchRemainingClients(initial: Client[]): Promise<Client[]> {
  if (initial.length < CLIENTS_FETCH_PAGE_SIZE) return Promise.resolve(initial);
  if (clientsRemainingFetch) return clientsRemainingFetch;

  clientsRemainingFetch = (async () => {
    const merged = [...initial];
    const seen = new Set(initial.map((client) => client.id));
    let offset = CLIENTS_FETCH_PAGE_SIZE;

    while (true) {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + CLIENTS_FETCH_PAGE_SIZE - 1);
      if (error) throw error;

      const batch = (data || []) as Client[];
      for (const client of batch) {
        if (!seen.has(client.id)) {
          seen.add(client.id);
          merged.push(client);
        }
      }

      if (batch.length < CLIENTS_FETCH_PAGE_SIZE) break;
      offset += CLIENTS_FETCH_PAGE_SIZE;
    }

    return merged;
  })().finally(() => {
    clientsRemainingFetch = null;
  });

  return clientsRemainingFetch;
}

export default function Clients() {
  const normalizeSearchText = useCallback(
    (value: string) => value.toLowerCase().trim().replace(/\s+/g, " "),
    [],
  );

  const matchesQueryTokens = useCallback(
    (searchableText: string, query: string) => {
      const normalizedText = normalizeSearchText(searchableText);
      const queryTokens = normalizeSearchText(query).split(" ").filter(Boolean);

      if (queryTokens.length === 0) return true;

      return queryTokens.every((token) => normalizedText.includes(token));
    },
    [normalizeSearchText],
  );

  const getElapsedMonths = useCallback((fromDate: string | null | undefined) => {
    if (!fromDate) return 0;

    const start = new Date(fromDate);
    if (Number.isNaN(start.getTime())) return 0;

    const now = new Date();
    let months =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());

    if (now.getDate() < start.getDate()) {
      months -= 1;
    }

    return Math.max(0, months);
  }, []);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, isAdmin, isManager } = useAuth();

  // Google Sheets integration
  const {
    isConnected: isGoogleSheetsConnected,
    isLoading: googleSheetsLoading,
    connect: connectGoogleSheets,
    syncClientsToSheets,
  } = useGoogleSheets();

  const [clients, setClients] = useState<Client[]>(() => clientsCache ?? []);
  const [isLoading, setIsLoading] = useState(() => clientsCache === null);
  const [searchQuery, setSearchQuery] = useState("");

  // Persistent view settings from cloud
  const {
    viewMode: savedViewMode,
    columns: savedColumns,
    sortBy: savedSortBy,
    setViewMode: saveViewMode,
    setColumns: saveColumns,
    setSortBy: saveSortBy,
    isLoading: settingsLoading,
  } = useViewSettings("clients");

  // Cloud-persisted classification filter (legacy - kept for backward compat)
  const {
    value: savedHiddenClassifications,
    setValue: saveHiddenClassifications,
    isLoading: classFilterLoading,
  } = useUserSettings<string[]>({
    key: "clients_hidden_classifications",
    defaultValue: [],
  });

  const {
    value: processControlSettings,
    setValue: setProcessControlSettings,
  } = useUserSettings<ClientProcessControlSettings>({
    key: "clients_process_control_v1",
    defaultValue: {
      enabled: true,
      stagesToShow: 1,
      tasksToShow: 3,
      verticalScroll: true,
      clientsPerRow: 3,
      pageScrollSpeed: 0.45,
    },
  });

  const {
    value: recentClientPersonalOrder,
    setValue: setRecentClientPersonalOrder,
  } = useUserSettings<string[]>({
    key: "clients_recent_personal_order_v1",
    defaultValue: [],
  });

  // Cloud-persisted FULL filter + view state
  const {
    value: savedFullFilters,
    setValue: saveFullFilters,
    isLoading: fullFiltersLoading,
  } = useUserSettings<{
    stages?: string[];
    stageSelections?: ClientFilterState["stageSelections"];
    stageTemplateIds?: string[];
    stageTaskFilters?: ClientFilterState["stageTaskFilters"];
    dateFilter?: string;
    hasReminders?: boolean | null;
    hasTasks?: boolean | null;
    hasMeetings?: boolean | null;
    paymentStatus?: ClientFilterState["paymentStatus"];
    recentClientsDays?: number | null;
    recentClientsSortMode?: ClientFilterState["recentClientsSortMode"];
    recentActivityTypes?: ClientFilterState["recentActivityTypes"];
    categories?: string[];
    tags?: string[];
    hiddenClassifications?: string[];
    monthAgeRanges?: Array<"m4_plus" | "m6_plus" | "m8_plus">;
    exactMonth?: number | null;
    customDateRange?: ClientDateRangeConfig | null;
    activeDateTabId?: string | null;
    consultantIds?: string[];
    consultantProfessions?: string[];
    sortBy?: string;
    showStagesView?: boolean;
    showStatisticsView?: boolean;
  }>({
    key: "clients_full_filters",
    defaultValue: {},
  });

  const [viewMode, setViewModeLocal] = useState<
    "grid" | "list" | "compact" | "cards" | "minimal" | "portrait" | "luxury" | "tasks"
  >("grid");
  const [minimalColumns, setMinimalColumnsLocal] = useState<2 | 3>(2);
  const [showStagesView, setShowStagesViewLocal] = useState(false);
  const [showStatisticsView, setShowStatisticsViewLocal] = useState(false);
  const [showAccessView, setShowAccessView] = useSyncedSetting<boolean>({ key: "clients-show-access-view", defaultValue: false });
  const [dateRangeTabs, setDateRangeTabs] = useSyncedSetting<DateRangeTabItem[]>({
    key: "clients-date-range-tabs-v1",
    defaultValue: DEFAULT_CLIENT_DATE_RANGE_TABS,
  });
  const [autoJumpToFirstResult, setAutoJumpToFirstResult] =
    useSyncedSetting<boolean>({
      key: "clients-auto-jump-first-result",
      defaultValue: true,
    });

  useEffect(() => {
    if (!dateRangeTabs || dateRangeTabs.length === 0) {
      setDateRangeTabs(DEFAULT_CLIENT_DATE_RANGE_TABS);
    }
  }, [dateRangeTabs, setDateRangeTabs]);

  // Wrapper: persist showStagesView to cloud
  const setShowStagesView = useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      setShowStagesViewLocal((prev) => {
        const next = typeof val === "function" ? val(prev) : val;
        saveFullFilters((old) => ({ ...old, showStagesView: next }));
        return next;
      });
    },
    [saveFullFilters],
  );

  // Wrapper: persist showStatisticsView to cloud
  const setShowStatisticsView = useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      setShowStatisticsViewLocal((prev) => {
        const next = typeof val === "function" ? val(prev) : val;
        saveFullFilters((old) => ({ ...old, showStatisticsView: next }));
        return next;
      });
    },
    [saveFullFilters],
  );

  // Sync with cloud settings when loaded
  useEffect(() => {
    if (!settingsLoading && savedViewMode) {
      setViewModeLocal(savedViewMode as any);
    }
    if (!settingsLoading && savedColumns) {
      setMinimalColumnsLocal(savedColumns as 2 | 3);
    }
    if (!settingsLoading && savedSortBy) {
      setFilters((prev) => ({ ...prev, sortBy: savedSortBy as any }));
    }
  }, [settingsLoading, savedViewMode, savedColumns, savedSortBy]);

  // Sync full filter state from cloud (takes priority)
  useEffect(() => {
    if (fullFiltersLoading) return;
    if (!savedFullFilters || Object.keys(savedFullFilters).length === 0) {
      // Fallback: load legacy hidden classifications
      if (
        !classFilterLoading &&
        savedHiddenClassifications &&
        savedHiddenClassifications.length > 0
      ) {
        setFilters((prev) => ({
          ...prev,
          hiddenClassifications: savedHiddenClassifications,
        }));
      }
      return;
    }
    setFilters((prev) => ({
      ...prev,
      stages: savedFullFilters.stages ?? prev.stages,
      stageSelections: savedFullFilters.stageSelections ?? prev.stageSelections,
      stageTemplateIds: savedFullFilters.stageTemplateIds ?? prev.stageTemplateIds,
      stageTaskFilters: savedFullFilters.stageTaskFilters ?? prev.stageTaskFilters,
      dateFilter: (savedFullFilters.dateFilter as any) ?? prev.dateFilter,
      hasReminders: savedFullFilters.hasReminders ?? prev.hasReminders,
      hasTasks: savedFullFilters.hasTasks ?? prev.hasTasks,
      hasMeetings: savedFullFilters.hasMeetings ?? prev.hasMeetings,
      paymentStatus:
        savedFullFilters.paymentStatus === undefined
          ? prev.paymentStatus
          : savedFullFilters.paymentStatus,
      recentClientsDays:
        savedFullFilters.recentClientsDays ?? prev.recentClientsDays,
      recentClientsSortMode:
        savedFullFilters.recentClientsSortMode ??
        prev.recentClientsSortMode,
      recentActivityTypes:
        savedFullFilters.recentActivityTypes ?? prev.recentActivityTypes,
      // Legacy categories are no longer a filter source; workflow templates
      // are the single source of truth for process/stage/task filtering.
      categories: [],
      tags: savedFullFilters.tags ?? prev.tags,
      hiddenClassifications:
        savedFullFilters.hiddenClassifications ?? prev.hiddenClassifications,
      monthAgeRanges: savedFullFilters.monthAgeRanges ?? prev.monthAgeRanges,
      exactMonth:
        savedFullFilters.exactMonth === undefined
          ? prev.exactMonth
          : savedFullFilters.exactMonth,
      customDateRange:
        savedFullFilters.customDateRange === undefined
          ? prev.customDateRange
          : savedFullFilters.customDateRange,
      activeDateTabId:
        savedFullFilters.activeDateTabId === undefined
          ? prev.activeDateTabId
          : savedFullFilters.activeDateTabId,
      consultantIds: savedFullFilters.consultantIds ?? prev.consultantIds,
      consultantProfessions:
        savedFullFilters.consultantProfessions ?? prev.consultantProfessions,
      sortBy: (savedFullFilters.sortBy as any) ?? prev.sortBy,
    }));
    if (savedFullFilters.showStagesView != null) {
      setShowStagesViewLocal(savedFullFilters.showStagesView);
    }
    if (savedFullFilters.showStatisticsView != null) {
      setShowStatisticsViewLocal(savedFullFilters.showStatisticsView);
    }
  }, [
    fullFiltersLoading,
    savedFullFilters,
    classFilterLoading,
    savedHiddenClassifications,
  ]);

  // Wrapper functions to save to cloud (memoized)
  const setViewMode = useCallback(
    (
      mode:
        | "grid"
        | "list"
        | "compact"
        | "cards"
        | "minimal"
        | "portrait"
        | "luxury"
        | "tasks",
    ) => {
      setViewModeLocal(mode);
      saveViewMode(mode);
    },
    [saveViewMode],
  );

  const setMinimalColumns = useCallback(
    (cols: 2 | 3) => {
      setMinimalColumnsLocal(cols);
      saveColumns(cols);
    },
    [saveColumns],
  );

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(
    new Set(),
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination / Infinite Scroll state
  const PAGE_SIZE = 50;
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation state
  const [keyboardSearch, setKeyboardSearch] = useState("");
  const [highlightedClientId, setHighlightedClientId] = useState<string | null>(
    null,
  );
  const keyboardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingKeyboardScrollClientIdRef = useRef<string | null>(null);

  // Add client dialog state
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [showFeaturesHelp, setShowFeaturesHelp] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    idNumber: "",
    gush: "",
    helka: "",
    migrash: "",
    taba: "",
    street: "",
    moshav: "",
    agudaAddress: "",
    agudaEmail: "",
    vaadMoshavAddress: "",
    vaadMoshavEmail: "",
  });
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValues>(
    {},
  );

  // Custom fields hook
  const {
    definitions: customFieldDefs,
    isLoading: customFieldsLoading,
    addField: addCustomField,
    deleteField: deleteCustomField,
    updateField: updateCustomField,
    buildCustomData,
  } = useClientCustomFields({ enabled: isAddClientDialogOpen });

  // Built-in field visibility config
  const { isVisible, isConditionallyVisible } = useClientFieldConfig();

  // ===== Page customizer (פריסה + פונקציות) =====
  const clientsPageSections: PageSection[] = useMemo(() => [
    { id: "header",       label: "כותרת ופעולות עליונות",   description: "כותרת הדף + כפתורי פעולה (הוסף/בחירה/שלבים/סטטיסטיקות)" },
    { id: "search",       label: "סרגל חיפוש",              description: "תיבת חיפוש לקוחות בכותרת" },
    { id: "filter-strip", label: "סרגל סינון מתקדם",        description: "סינון לפי שלבים, תאריכים, תזכורות, תגיות וקטגוריות" },
    { id: "stats-view",   label: "תצוגת סטטיסטיקות",        description: "פאנל הסטטיסטיקות (כשפעיל)" },
    { id: "stages-view",  label: "תצוגת שלבים",             description: "תצוגת לקוחות לפי שלבים (כשפעיל)" },
    { id: "main-grid",    label: "גלריית הלקוחות",          description: "רשת/רשימה ראשית של הלקוחות" },
  ], []);

  const clientsPageFeatures: PageFeature[] = useMemo(() => [
    { id: "add-client",       label: "כפתור הוסף לקוח",          description: "כפתור 'הוסף לקוח חדש' בכותרת" },
    { id: "goto-table",       label: "מעבר לטבלת לקוחות",        description: "כפתור הניווט לדף DataTable Pro" },
    { id: "bulk-select",      label: "מצב בחירה מרובה",          description: "אפשרות לבחור כמה לקוחות לפעולות גורפות" },
    { id: "stages-toggle",    label: "מעבר לתצוגת שלבים",        description: "כפתור הצגת לקוחות לפי שלבים" },
    { id: "stats-toggle",     label: "מעבר לסטטיסטיקות",         description: "כפתור הצגת תצוגת סטטיסטיקות" },
    { id: "view-presets",     label: "תפריט תצוגות שמורות",      description: "שמירה וטעינה של פריסטי תצוגה" },
    { id: "access-mgmt",      label: "ניהול גישות לפורטל",       description: "(מנהלים בלבד) כפתור ניהול גישות" },
    { id: "search-bar",       label: "חיפוש בכותרת",             description: "פעיל/כבוי לתיבת החיפוש העליונה" },
    { id: "filter-strip",     label: "סינון מתקדם",              description: "פעיל/כבוי לסרגל הסינון" },
    { id: "inactive-alerts",  label: "התראות לקוחות לא פעילים",   description: "התראה אוטומטית על לקוחות שלא היה איתם קשר" },
  ], []);

  const pageCustomizer = usePageCustomizer({
    storageKey: "clients-page-customizer",
    sections: clientsPageSections,
    features: clientsPageFeatures,
  });
  const pcVisible = pageCustomizer.isVisible;
  const pcEnabled = pageCustomizer.isEnabled;

  // Filter state
  const [filters, setFilters] = useState<ClientFilterState>({
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
    recentClientsSortMode: "activity",
    recentActivityTypes: [
      "client",
      "process",
      "tasks",
      "reminders",
      "meetings",
    ],
    categories: [],
    tags: [],
    hiddenClassifications: [],
    monthAgeRanges: [],
    exactMonth: null,
    customDateRange: null,
    activeDateTabId: null,
    consultantIds: [],
    consultantProfessions: [],
    sortBy: "date_desc",
  });
  const [storedTagDefinitions, setStoredTagDefinitions] = useSyncedSetting<ClientTagDefinition[]>({
    key: "clients-tag-definitions-v1",
    defaultValue: [],
  });
  const storedTagDefinitionsRef = useRef(storedTagDefinitions);

  useEffect(() => {
    storedTagDefinitionsRef.current = storedTagDefinitions;
  }, [storedTagDefinitions]);

  const taskViewContent: ClientTaskViewContent =
    filters.paymentStatus
      ? "payments"
      : filters.hasTasks === true
      ? "tasks"
      : filters.hasReminders === true
        ? "reminders"
        : filters.hasMeetings === true
          ? "meetings"
          : "process";
  const [clientTaskViewOverrides, setClientTaskViewOverrides] = useState<
    Record<string, ClientTaskViewContent>
  >({});
  const [clientCardQuickCreate, setClientCardQuickCreate] =
    useState<ClientCardQuickCreate | null>(null);
  const [stageTaskTitle, setStageTaskTitle] = useState("");
  const [stageTaskStageId, setStageTaskStageId] = useState("");
  const [isCreatingClientCardItem, setIsCreatingClientCardItem] =
    useState(false);

  useEffect(() => {
    setClientTaskViewOverrides({});
  }, [taskViewContent]);

  const quickCreateInitialData = useMemo(
    () =>
      clientCardQuickCreate
        ? { clientId: clientCardQuickCreate.clientId }
        : undefined,
    [clientCardQuickCreate?.clientId],
  );
  const reminderQuickCreateInitialValues = useMemo(
    () =>
      clientCardQuickCreate
        ? { client_id: clientCardQuickCreate.clientId }
        : undefined,
    [clientCardQuickCreate?.clientId],
  );

  // client_id -> Array<{ consultantId, profession }>
  const [clientConsultantsMap, setClientConsultantsMap] = useState<
    Record<string, Array<{ consultantId: string; profession: string }>>
  >({});

  useEffect(() => {
    let cancelled = false;

    if (!clientConsultantsFetch) {
      clientConsultantsFetch = (async () => {
        const { data, error } = await supabase
          .from("client_consultants")
          .select("client_id, consultant_id, consultant:consultants(profession)")
          .eq("status", "active");
        if (error) throw error;

        const map: Record<
          string,
          Array<{ consultantId: string; profession: string }>
        > = {};
        (data || []).forEach((row: any) => {
          if (!map[row.client_id]) map[row.client_id] = [];
          map[row.client_id].push({
            consultantId: row.consultant_id,
            profession: row.consultant?.profession || "ללא תחום",
          });
        });
        return map;
      })().finally(() => {
        clientConsultantsFetch = null;
      });
    }

    clientConsultantsFetch
      .then((map) => {
        if (!cancelled) setClientConsultantsMap(map);
      })
      .catch((error) => {
        console.error("Error fetching client consultants:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Client data for filtering
  const [clientStages, setClientStages] = useState<ClientStageInfo[]>([]);
  const [clientStageTasks, setClientStageTasks] = useState<ClientStageTaskInfo[]>([]);
  const [clientPaymentStages, setClientPaymentStages] = useState<
    ClientPaymentStageInfo[]
  >([]);
  const [stageTemplates, setStageTemplates] = useState<ClientStageTemplateInfo[]>([]);
  const [clientsWithReminders, setClientsWithReminders] = useState<Set<string>>(
    new Set(),
  );
  const [clientsWithMeetings, setClientsWithMeetings] = useState<Set<string>>(
    new Set(),
  );
  const [clientTasks, setClientTasks] = useState<ClientTaskActivity[]>([]);
  const { matches: matchesGlobalUserFilter } = useUserFilter();
  const scopedClientTasks = useMemo(
    () =>
      clientTasks.filter((task) =>
        matchesGlobalUserFilter(task, "tasks"),
      ),
    [clientTasks, matchesGlobalUserFilter],
  );
  const clientsWithTasks = useMemo(
    () => new Set(scopedClientTasks.map((task) => task.client_id)),
    [scopedClientTasks],
  );
  const [clientReminders, setClientReminders] = useState<
    ClientReminderActivity[]
  >([]);
  const [clientMeetings, setClientMeetings] = useState<
    ClientMeetingActivity[]
  >([]);
  const [latestActivityByClient, setLatestActivityByClient] = useState<
    Record<string, string>
  >({});
  const [latestActivityByType, setLatestActivityByType] = useState<
    ClientFilterDataPayload["latestActivityByType"]
  >({
    process: {},
    tasks: {},
    reminders: {},
    meetings: {},
  });
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagDefinitions, setTagDefinitions] = useState<ClientTagDefinition[]>([]);
  const [latestContractSignedByClient, setLatestContractSignedByClient] =
    useState<Record<string, string>>({});

  const workflowStateByClient = useMemo(() => {
    const result = new Map<
      string,
      Map<string, { currentStage: ClientStageInfo | null; stages: ClientStageInfo[] }>
    >();
    const tasksByClientAndStage = new Map<string, ClientStageTaskInfo[]>();
    clientStageTasks.forEach((task) => {
      const key = `${task.client_id}:${task.stage_id}`;
      const existing = tasksByClientAndStage.get(key) || [];
      existing.push(task);
      tasksByClientAndStage.set(key, existing);
    });

    clients.forEach((client) => {
      const clientMap = new Map<string, { currentStage: ClientStageInfo | null; stages: ClientStageInfo[] }>();
      stageTemplates.forEach((template) => {
        const prefix = `template_${template.id}_`;
        const stages = clientStages
          .filter(
            (stage) =>
              stage.client_id === client.id &&
              stage.stage_id.startsWith(prefix),
          )
          .sort((a, b) => a.sort_order - b.sort_order);
        if (stages.length === 0) return;

        const currentStage = stages.find((stage) => {
          const tasks = tasksByClientAndStage.get(`${client.id}:${stage.stage_id}`) || [];
          const isCompleted =
            stage.is_completed === true ||
            (tasks.length > 0 && tasks.every((task) => task.completed));
          return !isCompleted;
        }) || null;
        clientMap.set(template.id, { currentStage, stages });
      });
      if (clientMap.size > 0) result.set(client.id, clientMap);
    });

    return result;
  }, [clientStageTasks, clientStages, clients, stageTemplates]);

  const { paymentProgressByClient, paymentItemsByClient } = useMemo(() => {
    type Bucket = { payments: number; amount: number };
    type Progress = Record<
      "due" | "current" | "paid" | "reached",
      Bucket
    >;
    const result = new Map<string, Progress>();
    const itemsByClient = new Map<string, ClientPaymentDisplayItem[]>();
    const stageByClientAndId = new Map<string, ClientStageInfo>();
    const taskStageById = new Map<string, string>();
    const tasksByClientAndStage = new Map<string, ClientStageTaskInfo[]>();
    const currentStageIdsByClient = new Map<string, Set<string>>();

    clientStages.forEach((stage) => {
      stageByClientAndId.set(`${stage.client_id}:${stage.stage_id}`, stage);
    });
    clientStageTasks.forEach((task) => {
      taskStageById.set(task.id, task.stage_id);
      const key = `${task.client_id}:${task.stage_id}`;
      const existing = tasksByClientAndStage.get(key) || [];
      existing.push(task);
      tasksByClientAndStage.set(key, existing);
    });
    workflowStateByClient.forEach((workflows, clientId) => {
      const currentIds = new Set<string>();
      workflows.forEach((workflow) => {
        if (workflow.currentStage?.stage_id) {
          currentIds.add(workflow.currentStage.stage_id);
        }
      });
      currentStageIdsByClient.set(clientId, currentIds);
    });

    const getProgress = (clientId: string) => {
      const existing = result.get(clientId);
      if (existing) return existing;
      const created: Progress = {
        due: { payments: 0, amount: 0 },
        current: { payments: 0, amount: 0 },
        paid: { payments: 0, amount: 0 },
        reached: { payments: 0, amount: 0 },
      };
      result.set(clientId, created);
      return created;
    };

    clientPaymentStages
      .filter(isVisibleClientPaymentStage)
      .forEach((payment) => {
        const grossAmount =
          Number(payment.amount_with_vat || 0) ||
          Number(payment.amount || 0);
        const paidAmount = Math.max(
          Number(payment.paid_amount || 0),
          payment.is_paid ? grossAmount : 0,
        );
        const remainingAmount = Math.max(grossAmount - paidAmount, 0);
        const linkedStageId =
          payment.linked_stage_id ||
          (payment.linked_task_id
            ? taskStageById.get(payment.linked_task_id) || null
            : null);
        const linkedStage = linkedStageId
          ? stageByClientAndId.get(`${payment.client_id}:${linkedStageId}`)
          : null;
        const linkedStageTasks = linkedStageId
          ? tasksByClientAndStage.get(
              `${payment.client_id}:${linkedStageId}`,
            ) || []
          : [];
        const linkedStageCompleted =
          linkedStage?.is_completed === true ||
          (linkedStageTasks.length > 0 &&
            linkedStageTasks.every((task) => task.completed));
        const isCurrent =
          Boolean(linkedStageId) &&
          Boolean(
            currentStageIdsByClient
              .get(payment.client_id)
              ?.has(linkedStageId!),
          );
        const stageWasReached =
          payment.is_paid === true ||
          paidAmount > 0 ||
          linkedStageCompleted ||
          isCurrent;

        // Unpaid milestones without a reached/current stage are future money
        // and intentionally stay outside every clients-page payment filter.
        if (!stageWasReached) return;

        const progress = getProgress(payment.client_id);
        const paymentItems = itemsByClient.get(payment.client_id) || [];
        paymentItems.push({
          id: payment.id,
          title: payment.stage_name || "תשלום",
          workflowStageName: linkedStage?.stage_name || "תשלום כללי",
          workflowStageOrder: linkedStage?.sort_order ?? Number.MAX_SAFE_INTEGER,
          grossAmount,
          paidAmount: Math.min(paidAmount, grossAmount),
          remainingAmount,
          isCurrent,
        });
        itemsByClient.set(payment.client_id, paymentItems);

        progress.reached.payments += 1;
        progress.reached.amount += grossAmount;

        if (isCurrent) {
          progress.current.payments += 1;
          progress.current.amount += grossAmount;
        }
        if (paidAmount > 0) {
          progress.paid.payments += 1;
          progress.paid.amount += Math.min(paidAmount, grossAmount);
        }
        if (remainingAmount > 0.01) {
          progress.due.payments += 1;
          progress.due.amount += remainingAmount;
        }
      });

    itemsByClient.forEach((items) => {
      items.sort(
        (a, b) =>
          a.workflowStageOrder - b.workflowStageOrder ||
          a.title.localeCompare(b.title, "he"),
      );
    });

    return {
      paymentProgressByClient: result,
      paymentItemsByClient: itemsByClient,
    };
  }, [
    clientPaymentStages,
    clientStageTasks,
    clientStages,
    workflowStateByClient,
  ]);

  const paymentSummary = useMemo<ClientPaymentFilterSummary>(() => {
    const summary: ClientPaymentFilterSummary = {
      due: { clients: 0, payments: 0, amount: 0 },
      current: { clients: 0, payments: 0, amount: 0 },
      paid: { clients: 0, payments: 0, amount: 0 },
      reached: { clients: 0, payments: 0, amount: 0 },
    };
    paymentProgressByClient.forEach((progress) => {
      (Object.keys(summary) as Array<keyof ClientPaymentFilterSummary>).forEach(
        (key) => {
          if (progress[key].payments <= 0) return;
          summary[key].clients += 1;
          summary[key].payments += progress[key].payments;
          summary[key].amount += progress[key].amount;
        },
      );
    });
    return summary;
  }, [paymentProgressByClient]);

  // Quick Classification dialogs
  const [isBulkClassifyOpen, setIsBulkClassifyOpen] = useState(false);
  const [isBulkStageOpen, setIsBulkStageOpen] = useState(false);
  const [isBulkConsultantOpen, setIsBulkConsultantOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Duplicate detection state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateClient, setDuplicateClient] = useState<Client | null>(null);
  const [pendingClientData, setPendingClientData] = useState<any>(null);

  const effectiveLatestActivityByClient = useMemo(() => {
    const result: Record<string, string> = {};
    const selectedTypes =
      filters.recentActivityTypes?.length
        ? filters.recentActivityTypes
        : ["client", "process", "tasks", "reminders", "meetings"];
    const record = (clientId: string, candidate: string | null | undefined) => {
      if (!candidate) return;
      const candidateTime = new Date(candidate).getTime();
      const currentTime = result[clientId]
        ? new Date(result[clientId]).getTime()
        : -Infinity;
      if (!Number.isNaN(candidateTime) && candidateTime > currentTime) {
        result[clientId] = candidate;
      }
    };

    if (selectedTypes.includes("client")) {
      clients.forEach((client) =>
        record(client.id, client.updated_at || client.created_at),
      );
    }
    (["process", "tasks", "reminders", "meetings"] as const).forEach(
      (type) => {
        if (!selectedTypes.includes(type)) return;
        Object.entries(latestActivityByType[type]).forEach(
          ([clientId, activityDate]) => record(clientId, activityDate),
        );
      },
    );

    // Backwards-compatible fallback while cached filter data from an older
    // module version is being replaced.
    if (Object.keys(result).length === 0 && selectedTypes.length === 5) {
      Object.assign(result, latestActivityByClient);
    }
    return result;
  }, [
    clients,
    filters.recentActivityTypes,
    latestActivityByClient,
    latestActivityByType,
  ]);

  // Memoized filtered clients for performance - replaces applyFilters + useEffect pattern
  // MUST be defined before useEffects that use it
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Search filter
    if (searchQuery.trim() !== "") {
      result = result.filter((client) => {
        const searchableText =
          [client.name, client.email, client.phone, client.company]
            .filter(Boolean)
            .join(" ");

        return matchesQueryTokens(searchableText, searchQuery);
      });
    }

    // Hierarchical workflow filter. Within one template the most specific
    // selection wins (task > current stage > whole template); templates are OR.
    const selectedTemplateIds = new Set(filters.stageTemplateIds || []);
    const selectedStages = filters.stageSelections || [];
    const selectedTasks = filters.stageTaskFilters || [];
    const selectedWorkflowTemplateIds = new Set([
      ...selectedTemplateIds,
      ...selectedStages.map((stage) => stage.templateId),
      ...selectedTasks.map((task) => task.templateId),
    ]);
    if (selectedWorkflowTemplateIds.size > 0) {
      result = result.filter((client) => {
        const clientWorkflows = workflowStateByClient.get(client.id);
        if (!clientWorkflows) return false;

        return Array.from(selectedWorkflowTemplateIds).some((templateId) => {
          const workflow = clientWorkflows.get(templateId);
          if (!workflow) return false;

          const templateTasks = selectedTasks.filter((task) => task.templateId === templateId);
          if (templateTasks.length > 0) {
            return templateTasks.some((taskFilter) => {
              const matchingTasks = clientStageTasks.filter(
                (task) =>
                  task.client_id === client.id &&
                  task.title.trim() === taskFilter.title.trim() &&
                  workflow.stages.some(
                    (stage) =>
                      stage.stage_id === task.stage_id &&
                      (stage.stage_id ===
                        `template_${taskFilter.templateId}_${taskFilter.stageId}` ||
                        stage.stage_id.startsWith(
                          `template_${taskFilter.templateId}_${taskFilter.stageId}_`,
                        )),
                  ),
              );
              if (taskFilter.status === "any") return matchingTasks.length > 0;
              if (taskFilter.status === "complete") return matchingTasks.some((task) => task.completed);
              return matchingTasks.some((task) => !task.completed);
            });
          }

          const templateStages = selectedStages.filter((stage) => stage.templateId === templateId);
          if (templateStages.length > 0) {
            return templateStages.some(
              (selection) =>
                workflow.currentStage?.stage_name === selection.stageName ||
                workflow.currentStage?.stage_id ===
                  `template_${selection.templateId}_${selection.stageId}` ||
                workflow.currentStage?.stage_id.startsWith(
                  `template_${selection.templateId}_${selection.stageId}_`,
                ),
            );
          }

          return selectedTemplateIds.has(templateId);
        });
      });
    }

    // Date filter
    if (filters.customDateRange) {
      const now = new Date();
      result = result.filter((client) => {
        const createdAt = new Date(client.created_at);
        if (Number.isNaN(createdAt.getTime())) return false;
        return isDateInCustomRange(createdAt, filters.customDateRange!, now);
      });
    } else if (filters.dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      result = result.filter((client) => {
        const createdAt = new Date(client.created_at);
        switch (filters.dateFilter) {
          case "today":
            return createdAt >= today;
          case "week":
            return createdAt >= weekAgo;
          case "month":
            return createdAt >= monthAgo;
          case "older":
            return createdAt < monthAgo;
          default:
            return true;
        }
      });
    }

    // Has reminders filter
    if (filters.hasReminders === true) {
      result = result.filter((client) => clientsWithReminders.has(client.id));
    }

    // Has tasks filter
    if (filters.hasTasks === true) {
      result = result.filter((client) => clientsWithTasks.has(client.id));
    }

    // Payment relevance follows workflow progress: paid milestones and
    // unpaid milestones in the current/completed stages only. Future-stage
    // money never enters these buckets.
    if (filters.paymentStatus) {
      result = result.filter(
        (client) =>
          (paymentProgressByClient.get(client.id)?.[
            filters.paymentStatus!
          ].payments || 0) > 0,
      );
    }

    // Consultant filter (specific consultants OR any consultant of selected profession)
    const consultantIds = filters.consultantIds || [];
    const consultantProfessions = filters.consultantProfessions || [];
    if (consultantIds.length > 0 || consultantProfessions.length > 0) {
      result = result.filter((client) => {
        const assignments = clientConsultantsMap[client.id] || [];
        if (assignments.length === 0) return false;
        const idMatch =
          consultantIds.length === 0 ||
          assignments.some((a) => consultantIds.includes(a.consultantId));
        const profMatch =
          consultantProfessions.length === 0 ||
          assignments.some((a) => consultantProfessions.includes(a.profession));
        // OR semantics between the two groups
        if (consultantIds.length > 0 && consultantProfessions.length > 0) {
          return idMatch || profMatch;
        }
        return idMatch && profMatch;
      });
    }

    // Has meetings filter
    if (filters.hasMeetings === true) {
      result = result.filter((client) => clientsWithMeetings.has(client.id));
    }

    // Recently active clients — based on the latest real activity connected
    // to the client, not only on the date the client record was created.
    if (filters.recentClientsDays) {
      const cutoff =
        Date.now() - filters.recentClientsDays * 24 * 60 * 60 * 1000;
      result = result.filter((client) => {
        const activityDate = effectiveLatestActivityByClient[client.id];
        return (
          Boolean(activityDate) &&
          new Date(activityDate).getTime() >= cutoff
        );
      });
    }

    // Tags filter
    if (filters.tags.length > 0) {
      result = result.filter(
        (client) =>
          client.tags && client.tags.some((tag) => filters.tags.includes(tag)),
      );
    }

    // Classification filter — hide clients whose classification is in hiddenClassifications
    if (
      filters.hiddenClassifications &&
      filters.hiddenClassifications.length > 0
    ) {
      result = result.filter((client) => {
        const cls = client.classification || "_none"; // null/undefined → '_none'
        return !filters.hiddenClassifications.includes(cls);
      });
    }

    // Month-age filter (OR between selected ranges and exact month)
    if ((filters.monthAgeRanges?.length || 0) > 0 || filters.exactMonth !== null) {
      result = result.filter((client) => {
        const anchorDate = latestContractSignedByClient[client.id] || client.created_at;
        const start = new Date(anchorDate);
        if (Number.isNaN(start.getTime())) return false;

        const now = new Date();
        let months =
          (now.getFullYear() - start.getFullYear()) * 12 +
          (now.getMonth() - start.getMonth());
        if (now.getDate() < start.getDate()) months -= 1;
        months = Math.max(0, months);

        const ranges = filters.monthAgeRanges || [];
        const rangeMatch = ranges.some((range) => {
          if (range === "m4_plus") return months >= 4;
          if (range === "m6_plus") return months >= 6;
          if (range === "m8_plus") return months >= 8;
          return false;
        });

        const exactMatch =
          filters.exactMonth !== null ? months === filters.exactMonth : false;

        if (ranges.length > 0 && filters.exactMonth !== null) {
          return rangeMatch || exactMatch;
        }
        if (ranges.length > 0) return rangeMatch;
        if (filters.exactMonth !== null) return exactMatch;
        return true;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      if (filters.recentClientsDays) {
        if (filters.recentClientsSortMode === "custom") {
          return 0;
        }
        return (
          new Date(effectiveLatestActivityByClient[b.id] || 0).getTime() -
          new Date(effectiveLatestActivityByClient[a.id] || 0).getTime()
        );
      }
      switch (filters.sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name, "he");
        case "name_desc":
          return b.name.localeCompare(a.name, "he");
        case "date_desc":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "date_asc":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "classification_asc": {
          const classA = (a.classification || "תתת").localeCompare("", "he")
            ? a.classification || "תתת"
            : "תתת";
          const classB = (b.classification || "תתת").localeCompare("", "he")
            ? b.classification || "תתת"
            : "תתת";
          const classCompare = classA.localeCompare(classB, "he");
          if (classCompare !== 0) return classCompare;
          return a.name.localeCompare(b.name, "he");
        }
        case "classification_desc": {
          const classA = (a.classification || "תתת").localeCompare("", "he")
            ? a.classification || "תתת"
            : "תתת";
          const classB = (b.classification || "תתת").localeCompare("", "he")
            ? b.classification || "תתת"
            : "תתת";
          const classCompare = classB.localeCompare(classA, "he");
          if (classCompare !== 0) return classCompare;
          return b.name.localeCompare(a.name, "he");
        }
        default:
          return 0;
      }
    });

    if (
      filters.recentClientsDays &&
      filters.recentClientsSortMode === "custom"
    ) {
      return sortByPersonalRecentOrder(
        result,
        recentClientPersonalOrder,
        effectiveLatestActivityByClient,
      );
    }

    return result;
  }, [
    clients,
    searchQuery,
    filters,
    clientStageTasks,
    workflowStateByClient,
    clientsWithReminders,
    clientsWithTasks,
    clientsWithMeetings,
    paymentProgressByClient,
    effectiveLatestActivityByClient,
    recentClientPersonalOrder,
    latestContractSignedByClient,
    clientConsultantsMap,
    matchesQueryTokens,
  ]);

  const [draggedRecentClientId, setDraggedRecentClientId] = useState<
    string | null
  >(null);
  const [recentClientDropTargetId, setRecentClientDropTargetId] = useState<
    string | null
  >(null);
  const personalRecentOrderingActive =
    Boolean(filters.recentClientsDays) &&
    filters.recentClientsSortMode === "custom";

  const handleRecentClientDrop = useCallback(
    (targetClientId: string) => {
      if (!draggedRecentClientId || !personalRecentOrderingActive) return;

      const nextOrder = moveRecentClientBefore(
        recentClientPersonalOrder,
        filteredClients.map((client) => client.id),
        draggedRecentClientId,
        targetClientId,
      );
      if (nextOrder !== recentClientPersonalOrder) {
        setRecentClientPersonalOrder(nextOrder);
      }
      setDraggedRecentClientId(null);
      setRecentClientDropTargetId(null);
    },
    [
      draggedRecentClientId,
      filteredClients,
      personalRecentOrderingActive,
      recentClientPersonalOrder,
      setRecentClientPersonalOrder,
    ],
  );

  const scrollToClientCard = useCallback((clientId: string) => {
    const clientElement = clientRefs.current.get(clientId);
    if (!clientElement) return false;

    clientElement.scrollIntoView({ behavior: "smooth", block: "center" });
    return true;
  }, []);

  const ensureClientVisibleForKeyboardSearch = useCallback(
    (clientId: string) => {
      const targetIndex = filteredClients.findIndex(
        (client) => client.id === clientId,
      );
      if (targetIndex === -1) return;

      const requiredCount = targetIndex + 1;

      if (requiredCount > displayedCount) {
        // Grow rendered items so the matched client card is mounted, then scroll in a follow-up effect.
        pendingKeyboardScrollClientIdRef.current = clientId;
        setDisplayedCount((prev) => {
          const nextBatchCount = Math.ceil(requiredCount / PAGE_SIZE) * PAGE_SIZE;
          return Math.min(filteredClients.length, Math.max(prev, nextBatchCount));
        });
        return;
      }

      requestAnimationFrame(() => {
        void scrollToClientCard(clientId);
      });
    },
    [displayedCount, filteredClients, scrollToClientCard],
  );

  useEffect(() => {
    const pendingClientId = pendingKeyboardScrollClientIdRef.current;
    if (!pendingClientId) return;

    const didScroll = scrollToClientCard(pendingClientId);
    if (didScroll) {
      pendingKeyboardScrollClientIdRef.current = null;
    }
  }, [displayedCount, filteredClients, scrollToClientCard]);

  const selectedSearchClient = useMemo(() => {
    if (!highlightedClientId) return null;
    return filteredClients.find((client) => client.id === highlightedClientId) || null;
  }, [filteredClients, highlightedClientId]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      if (!keyboardSearch) {
        setHighlightedClientId(null);
      }
      return;
    }

    if (!autoJumpToFirstResult) return;

    const firstMatch = filteredClients[0];
    if (!firstMatch) {
      if (!keyboardSearch) {
        setHighlightedClientId(null);
      }
      return;
    }

    setHighlightedClientId((prev) =>
      prev === firstMatch.id ? prev : firstMatch.id,
    );
    ensureClientVisibleForKeyboardSearch(firstMatch.id);
  }, [
    autoJumpToFirstResult,
    searchQuery,
    keyboardSearch,
    filteredClients,
    ensureClientVisibleForKeyboardSearch,
  ]);

  // Calculate client count per category for sidebar
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach((client) => {
      if (client.category_id) {
        counts[client.category_id] = (counts[client.category_id] || 0) + 1;
      }
    });
    return counts;
  }, [clients]);

  const stageCounts = useMemo(() => {
    const byStage = new Map<string, Set<string>>();

    clientStages.forEach((stage) => {
      if (!stage.stage_name || !stage.client_id) return;
      if (!byStage.has(stage.stage_name)) {
        byStage.set(stage.stage_name, new Set());
      }
      byStage.get(stage.stage_name)!.add(stage.client_id);
    });

    const counts: Record<string, number> = {};
    byStage.forEach((clientIds, stageName) => {
      counts[stageName] = clientIds.size;
    });

    return counts;
  }, [clientStages]);

  const processStagesByClient = useMemo(() => {
    const result = new Map<string, ClientStageInfo[]>();
    clientStages.forEach((stage) => {
      const current = result.get(stage.client_id) || [];
      current.push(stage);
      result.set(stage.client_id, current);
    });
    result.forEach((stages) =>
      stages.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    );
    return result;
  }, [clientStages]);

  const processTasksByClient = useMemo(() => {
    const result = new Map<string, ClientStageTaskInfo[]>();
    clientStageTasks.forEach((task) => {
      const current = result.get(task.client_id) || [];
      current.push(task);
      result.set(task.client_id, current);
    });
    return result;
  }, [clientStageTasks]);

  const tasksByClient = useMemo(() => {
    const result = new Map<string, ClientTaskActivity[]>();
    scopedClientTasks.forEach((task) => {
      const current = result.get(task.client_id) || [];
      current.push(task);
      result.set(task.client_id, current);
    });
    result.forEach((items) =>
      items.sort((a, b) => {
        const aTime = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bTime = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return aTime - bTime;
      }),
    );
    return result;
  }, [scopedClientTasks]);

  const remindersByClient = useMemo(() => {
    const result = new Map<string, ClientReminderActivity[]>();
    clientReminders.forEach((reminder) => {
      if (!reminder.client_id) return;
      const current = result.get(reminder.client_id) || [];
      current.push(reminder);
      result.set(reminder.client_id, current);
    });
    result.forEach((items) =>
      items.sort(
        (a, b) =>
          new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime(),
      ),
    );
    return result;
  }, [clientReminders]);

  const meetingsByClient = useMemo(() => {
    const result = new Map<string, ClientMeetingActivity[]>();
    clientMeetings.forEach((meeting) => {
      const current = result.get(meeting.client_id) || [];
      current.push(meeting);
      result.set(meeting.client_id, current);
    });
    result.forEach((items) =>
      items.sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      ),
    );
    return result;
  }, [clientMeetings]);

  const recentClientsCount = useMemo(() => {
    const days = filters.recentClientsDays;
    if (!days) return 0;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return clients.filter((client) => {
      const activity = effectiveLatestActivityByClient[client.id];
      return activity && new Date(activity).getTime() >= cutoff;
    }).length;
  }, [clients, effectiveLatestActivityByClient, filters.recentClientsDays]);

  const handleToggleStageTask = useCallback(
    async (taskId: string, completed: boolean) => {
      const previousTasks = clientStageTasks;
      setClientStageTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, completed } : task,
        ),
      );

      const { error } = await supabase
        .from("client_stage_tasks")
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", taskId);

      if (error) {
        setClientStageTasks(previousTasks);
        toast({
          title: "לא ניתן לעדכן את המשימה",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    [clientStageTasks],
  );

  const selectedWorkflowStageByClient = useMemo(() => {
    const result = new Map<string, { stageName: string | null; templateName: string }>();
    const selectedTemplateIds = Array.from(new Set([
      ...(filters.stageTemplateIds || []),
      ...(filters.stageSelections || []).map((stage) => stage.templateId),
      ...(filters.stageTaskFilters || []).map((task) => task.templateId),
    ]));
    if (selectedTemplateIds.length === 0) return result;

    clients.forEach((client) => {
      const workflows = workflowStateByClient.get(client.id);
      const matchedTemplateId = selectedTemplateIds.find((templateId) => workflows?.has(templateId));
      if (!matchedTemplateId) return;
      const matchedTemplate = stageTemplates.find((template) => template.id === matchedTemplateId);
      if (!matchedTemplate) return;
      const currentStage = workflows?.get(matchedTemplateId)?.currentStage || null;

      result.set(client.id, {
        stageName: currentStage?.stage_name || null,
        templateName: matchedTemplate.name,
      });
    });

    return result;
  }, [clients, filters.stageSelections, filters.stageTaskFilters, filters.stageTemplateIds, stageTemplates, workflowStateByClient]);

  const monthAgeCounts = useMemo(() => {
    const counts = {
      ranges: { m4_plus: 0, m6_plus: 0, m8_plus: 0 } as Record<
        "m4_plus" | "m6_plus" | "m8_plus",
        number
      >,
      byExact: {} as Record<number, number>,
    };

    clients.forEach((client) => {
      const anchorDate = latestContractSignedByClient[client.id] || client.created_at;
      const start = new Date(anchorDate);
      if (Number.isNaN(start.getTime())) return;

      const now = new Date();
      let months =
        (now.getFullYear() - start.getFullYear()) * 12 +
        (now.getMonth() - start.getMonth());
      if (now.getDate() < start.getDate()) months -= 1;
      months = Math.max(0, months);

      if (months >= 4) counts.ranges.m4_plus += 1;
      if (months >= 6) counts.ranges.m6_plus += 1;
      if (months >= 8) counts.ranges.m8_plus += 1;

      counts.byExact[months] = (counts.byExact[months] || 0) + 1;
    });

    return counts;
  }, [clients, latestContractSignedByClient]);

  // Data fetching effect moved below function declarations

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(PAGE_SIZE);
  }, [searchQuery, filters]);

  // Infinite Scroll with Intersection Observer - uses scroll container
  useEffect(() => {
    if (!loadMoreRef.current || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          displayedCount < filteredClients.length &&
          !isLoadingMore
        ) {
          setIsLoadingMore(true);
          // Load more quickly for smoother experience
          setTimeout(() => {
            setDisplayedCount((prev) =>
              Math.min(prev + PAGE_SIZE, filteredClients.length),
            );
            setIsLoadingMore(false);
          }, 50);
        }
      },
      {
        root: scrollContainerRef.current, // Use the scroll container as root
        threshold: 0.1,
        rootMargin: "200px", // Increased margin to trigger earlier
      },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [displayedCount, filteredClients.length, isLoadingMore]);

  // In the task-focused view, the clients grid is the page's primary scroll
  // surface. Route wheel input from every non-interactive area on the page to
  // that grid, while preserving native scrolling inside task lists and dialogs.
  useEffect(() => {
    if (viewMode !== "tasks") return;

    let pendingWheelDelta = 0;
    let wheelFrame: number | null = null;

    const handlePageWheel = (event: WheelEvent) => {
      const target = event.target;
      const container = scrollContainerRef.current;
      if (!(target instanceof Element) || !container || event.deltaY === 0) return;

      const ownsItsScroll = target.closest(
        [
          "[data-client-task-scroll='true']",
          "[role='dialog']",
          "[data-radix-popper-content-wrapper]",
          "button",
          "input",
          "textarea",
          "select",
          "a[href]",
        ].join(","),
      );
      if (ownsItsScroll) return;

      event.preventDefault();

      let wheelStep = event.deltaY;
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) wheelStep *= 40;
      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        wheelStep *= container.clientHeight;
      }
      if (Math.abs(wheelStep) < 40) {
        wheelStep =
          Math.sign(wheelStep) * Math.max(12, Math.abs(wheelStep) * 4);
      }

      const configuredSpeed = Math.min(
        1.5,
        Math.max(0.15, processControlSettings.pageScrollSpeed ?? 0.45),
      );
      pendingWheelDelta += wheelStep * configuredSpeed;
      if (wheelFrame !== null) return;

      wheelFrame = window.requestAnimationFrame(() => {
        const activeContainer = scrollContainerRef.current;
        if (activeContainer) {
          activeContainer.scrollTop += pendingWheelDelta;
        }
        pendingWheelDelta = 0;
        wheelFrame = null;
      });
    };

    document.addEventListener("wheel", handlePageWheel, {
      capture: true,
      passive: false,
    });
    return () => {
      document.removeEventListener("wheel", handlePageWheel, true);
      if (wheelFrame !== null) window.cancelAnimationFrame(wheelFrame);
    };
  }, [processControlSettings.pageScrollSpeed, viewMode]);

  // Keyboard navigation - jump to client by typing letters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key;

      // Handle Escape - clear search
      if (key === "Escape") {
        setKeyboardSearch("");
        setHighlightedClientId(null);
        if (keyboardTimeoutRef.current) {
          clearTimeout(keyboardTimeoutRef.current);
        }
        return;
      }

      // Handle Backspace/Delete - remove last character
      if (key === "Backspace" || key === "Delete") {
        e.preventDefault();
        if (keyboardSearch.length > 0) {
          const newSearch = keyboardSearch.slice(0, -1);
          setKeyboardSearch(newSearch);

          if (newSearch.length === 0) {
            setHighlightedClientId(null);
          } else {
            // Find matching client with new search
            const matchingClient = filteredClients.find((client) =>
              client.name.toLowerCase().startsWith(newSearch.toLowerCase()) ||
              matchesQueryTokens(client.name, newSearch),
            );
            if (matchingClient) {
              setHighlightedClientId(matchingClient.id);
              ensureClientVisibleForKeyboardSearch(matchingClient.id);
            }
          }

          // Reset timeout
          if (keyboardTimeoutRef.current) {
            clearTimeout(keyboardTimeoutRef.current);
          }
          keyboardTimeoutRef.current = setTimeout(() => {
            setKeyboardSearch("");
            setHighlightedClientId(null);
          }, 3000);
        }
        return;
      }

      // Only handle letter keys (Hebrew and English) and space
      const isLetter = /^[a-zA-Zא-ת ]$/.test(key);

      if (!isLetter) return;

      // Prevent default for space to avoid page scroll
      if (key === " ") {
        e.preventDefault();
      }

      // Clear previous timeout
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }

      // Build search string
      const newSearch = keyboardSearch + key;
      setKeyboardSearch(newSearch);

      // Find matching client
      const matchingClient = filteredClients.find((client) =>
        client.name.toLowerCase().startsWith(newSearch.toLowerCase()) ||
        matchesQueryTokens(client.name, newSearch),
      );

      if (matchingClient) {
        setHighlightedClientId(matchingClient.id);
        ensureClientVisibleForKeyboardSearch(matchingClient.id);

        // Show toast with found client
        toast({
          title: `🔍 ${matchingClient.name}`,
          description: `הקלדת: "${newSearch}"`,
          duration: 1500,
        });
      } else {
        // No match found
        toast({
          title: "לא נמצא",
          description: `אין לקוח שתואם ל-"${newSearch}"`,
          variant: "destructive",
          duration: 1500,
        });
      }

      // Reset after 3 seconds of no typing
      keyboardTimeoutRef.current = setTimeout(() => {
        setKeyboardSearch("");
        setHighlightedClientId(null);
      }, 3000);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }
    };
  }, [
    keyboardSearch,
    filteredClients,
    matchesQueryTokens,
    ensureClientVisibleForKeyboardSearch,
  ]);

  const fetchFilterData = useCallback(async () => {
    try {
      if (!clientFilterDataFetch) {
        clientFilterDataFetch = (async () => {
          const [
            stagesRes,
            stageTasksRes,
            paymentStagesRes,
            stageTemplatesRes,
            templateStagesRes,
            remindersRes,
            tasksRes,
            meetingsRes,
            allTaskActivityRes,
            allReminderActivityRes,
            allMeetingActivityRes,
            contractsRes,
          ] =
            await Promise.all([
              fetchAllFilterRows(
                "client_stages",
                "id, client_id, stage_id, stage_name, sort_order, is_completed, created_at, updated_at",
              ),
              fetchAllFilterRows(
                "client_stage_tasks",
                "id, client_id, stage_id, title, completed, due_date, created_at, updated_at",
              ),
              fetchAllFilterRows(
                "client_payment_stages",
                "id, client_id, linked_stage_id, linked_task_id, stage_name, is_paid, amount, amount_with_vat, paid_amount, created_at",
              ),
              (supabase as any)
                .from("stage_templates")
                .select("id, name"),
              (supabase as any)
                .from("stage_template_stages")
                .select("id, template_id, stage_name")
                .order("sort_order"),
              supabase
                .from("reminders")
                .select(
                  "id, entity_id, client_id, title, remind_at, created_at, is_dismissed",
                )
                .eq("entity_type", "client")
                .eq("is_dismissed", false),
              supabase
                .from("tasks")
                .select(
                  "id, client_id, created_by, assigned_to, title, due_date, status, updated_at",
                )
                .not("client_id", "is", null)
                .or(
                  "status.is.null,status.not.in.(done,completed,cancelled,canceled)",
                ),
              supabase
                .from("meetings")
                .select(
                  "id, client_id, title, start_time, end_time, status, updated_at",
                )
                .not("client_id", "is", null)
                .or("status.is.null,status.not.in.(completed,cancelled,canceled)")
                .gte("start_time", new Date().toISOString()),
              supabase
                .from("tasks")
                .select("client_id, updated_at")
                .not("client_id", "is", null)
                .order("updated_at", { ascending: false })
                .limit(1000),
              supabase
                .from("reminders")
                .select("client_id, entity_id, entity_type, created_at")
                .order("created_at", { ascending: false })
                .limit(1000),
              supabase
                .from("meetings")
                .select("client_id, updated_at")
                .not("client_id", "is", null)
                .order("updated_at", { ascending: false })
                .limit(1000),
              supabase
                .from("contracts")
                .select("client_id, signed_date")
                .not("client_id", "is", null)
                .not("signed_date", "is", null),
            ]);

          const firstError = [
            stagesRes,
            stageTasksRes,
            paymentStagesRes,
            stageTemplatesRes,
            templateStagesRes,
            remindersRes,
            tasksRes,
            meetingsRes,
            allTaskActivityRes,
            allReminderActivityRes,
            allMeetingActivityRes,
            contractsRes,
          ].find((response) => response.error)?.error;
          if (firstError) throw firstError;

          const latestSignedMap: Record<string, string> = {};
          const latestActivityMap: Record<string, string> = {};
          const latestActivityTypeMap: ClientFilterDataPayload["latestActivityByType"] =
            {
              process: {},
              tasks: {},
              reminders: {},
              meetings: {},
            };
          const recordActivity = (
            type: keyof ClientFilterDataPayload["latestActivityByType"],
            clientId: string | null | undefined,
            activityDate: string | null | undefined,
          ) => {
            if (!clientId || !activityDate) return;
            const timestamp = new Date(activityDate).getTime();
            if (Number.isNaN(timestamp)) return;
            const existing = latestActivityMap[clientId];
            if (
              !existing ||
              timestamp > new Date(existing).getTime()
            ) {
              latestActivityMap[clientId] = activityDate;
            }
            const existingForType = latestActivityTypeMap[type][clientId];
            if (
              !existingForType ||
              timestamp > new Date(existingForType).getTime()
            ) {
              latestActivityTypeMap[type][clientId] = activityDate;
            }
          };

          (stagesRes.data || []).forEach((row: any) =>
            recordActivity(
              "process",
              row.client_id,
              row.updated_at || row.created_at,
            ),
          );
          (stageTasksRes.data || []).forEach((row: any) =>
            recordActivity(
              "process",
              row.client_id,
              row.updated_at || row.created_at,
            ),
          );
          (allTaskActivityRes.data || []).forEach((row: any) =>
            recordActivity("tasks", row.client_id, row.updated_at),
          );
          (allReminderActivityRes.data || []).forEach((row: any) => {
            const clientId =
              row.client_id ||
              (row.entity_type === "client" ? row.entity_id : null);
            recordActivity("reminders", clientId, row.created_at);
          });
          (allMeetingActivityRes.data || []).forEach((row: any) =>
            recordActivity("meetings", row.client_id, row.updated_at),
          );

          (contractsRes.data || []).forEach((contract: any) => {
            const clientId = contract?.client_id;
            const signedDate = contract?.signed_date;
            if (!clientId || !signedDate) return;

            const existing = latestSignedMap[clientId];
            if (
              !existing ||
              new Date(signedDate).getTime() > new Date(existing).getTime()
            ) {
              latestSignedMap[clientId] = signedDate;
            }
          });

          return {
            stages: (stagesRes.data || []) as ClientStageInfo[],
            stageTasks: (stageTasksRes.data || []) as ClientStageTaskInfo[],
            paymentStages: (paymentStagesRes.data ||
              []) as ClientPaymentStageInfo[],
            stageTemplates: (stageTemplatesRes.data || []).map((template: any) => ({
              id: template.id,
              name: template.name,
              stages: (templateStagesRes.data || [])
                .filter((stage: any) => stage.template_id === template.id)
                .map((stage: any) => ({ id: stage.id, stage_name: stage.stage_name })),
            })),
            reminderClientIds:
              remindersRes.data
                ?.map((row) => row.client_id || row.entity_id)
                .filter(Boolean) || [],
            meetingClientIds:
              meetingsRes.data?.map((row) => row.client_id).filter(Boolean) || [],
            tasks: (tasksRes.data || []) as ClientTaskActivity[],
            reminders: (remindersRes.data || []).map((row: any) => ({
              ...row,
              client_id: row.client_id || row.entity_id,
            })) as ClientReminderActivity[],
            meetings: (meetingsRes.data || []) as ClientMeetingActivity[],
            latestActivityByClient: latestActivityMap,
            latestActivityByType: latestActivityTypeMap,
            latestSignedByClient: latestSignedMap,
          } as ClientFilterDataPayload;
        })().finally(() => {
          clientFilterDataFetch = null;
        });
      }

      const payload = await clientFilterDataFetch;

      // Batch all state updates
      React.startTransition(() => {
        setClientStages(payload.stages);
        setClientStageTasks(payload.stageTasks);
        setClientPaymentStages(payload.paymentStages);
        setStageTemplates(payload.stageTemplates);
        setClientsWithReminders(new Set(payload.reminderClientIds));
        setClientsWithMeetings(new Set(payload.meetingClientIds));
        setClientTasks(payload.tasks);
        setClientReminders(payload.reminders);
        setClientMeetings(payload.meetings);
        setLatestActivityByClient(payload.latestActivityByClient);
        setLatestActivityByType(payload.latestActivityByType);
        setLatestContractSignedByClient(payload.latestSignedByClient);
      });
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  }, []);

  const openClientCardQuickCreate = useCallback(
    (
      client: Client,
      kind: Exclude<ClientTaskViewContent, "payments">,
    ) => {
      setClientCardQuickCreate({
        clientId: client.id,
        clientName: client.name,
        kind,
      });

      if (kind === "process") {
        const stages = [...(processStagesByClient.get(client.id) || [])].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
        const preferredStage =
          stages.find((stage) => !stage.is_completed) || stages[0];
        setStageTaskStageId(preferredStage?.stage_id || "");
        setStageTaskTitle("");
      }
    },
    [processStagesByClient],
  );

  const handleCreateClientTask = useCallback(
    async (task: TaskInsert): Promise<Task> => {
      if (!clientCardQuickCreate || !user) {
        throw new Error("לא נמצא לקוח או משתמש מחובר");
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...task,
          client_id: clientCardQuickCreate.clientId,
          created_by: user.id,
        })
        .select("*, client:clients(name), project:projects(name)")
        .single();

      if (error) {
        toast({
          title: "לא ניתן ליצור את המשימה",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      await Promise.all([
        fetchFilterData(),
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      ]);
      toast({ title: "המשימה נוספה ללקוח" });
      return data as Task;
    },
    [clientCardQuickCreate, fetchFilterData, queryClient, user],
  );

  const handleCreateClientMeeting = useCallback(
    async (meeting: MeetingInsert): Promise<{ id?: string }> => {
      if (!clientCardQuickCreate || !user) {
        throw new Error("לא נמצא לקוח או משתמש מחובר");
      }

      const { data, error } = await supabase
        .from("meetings")
        .insert({
          ...meeting,
          client_id: clientCardQuickCreate.clientId,
          created_by: user.id,
        } as any)
        .select("id")
        .single();

      if (error) {
        toast({
          title: "לא ניתן ליצור את הפגישה",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      await Promise.all([
        fetchFilterData(),
        queryClient.invalidateQueries({ queryKey: ["meetings"] }),
      ]);
      toast({ title: "הפגישה נוספה ללקוח" });
      return data || {};
    },
    [clientCardQuickCreate, fetchFilterData, queryClient, user],
  );

  const handleCreateClientStageTask = useCallback(async () => {
    if (
      !clientCardQuickCreate ||
      clientCardQuickCreate.kind !== "process" ||
      !stageTaskStageId ||
      !stageTaskTitle.trim()
    ) {
      return;
    }

    setIsCreatingClientCardItem(true);
    try {
      const stageTaskCount = clientStageTasks.filter(
        (task) =>
          task.client_id === clientCardQuickCreate.clientId &&
          task.stage_id === stageTaskStageId,
      ).length;
      const { data, error } = await supabase
        .from("client_stage_tasks")
        .insert({
          client_id: clientCardQuickCreate.clientId,
          stage_id: stageTaskStageId,
          title: stageTaskTitle.trim(),
          sort_order: stageTaskCount,
        } as any)
        .select(
          "id, client_id, stage_id, title, completed, created_at, updated_at",
        )
        .single();

      if (error) throw error;

      setClientStageTasks((current) => [
        ...current,
        data as ClientStageTaskInfo,
      ]);
      await fetchFilterData();
      toast({ title: "המשימה נוספה לשלב" });
      setClientCardQuickCreate(null);
      setStageTaskTitle("");
      setStageTaskStageId("");
    } catch (error: any) {
      toast({
        title: "לא ניתן להוסיף משימה לשלב",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingClientCardItem(false);
    }
  }, [
    clientCardQuickCreate,
    clientStageTasks,
    fetchFilterData,
    stageTaskStageId,
    stageTaskTitle,
  ]);

  const fetchCategoriesAndTags = useCallback(async () => {
    try {
      if (!categoriesAndTagsFetch) {
        categoriesAndTagsFetch = (async () => {
          const [categoriesResponse, tagsResponse, tagDefinitionsResponse] = await Promise.all([
            supabase
              .from("client_categories")
              .select("id, name, color, icon")
              .order("sort_order"),
            supabase
              .from("clients")
              .select("tags")
              .not("tags", "is", null),
            supabase
              .from("client_tag_definitions")
              .select("id, name, color, sort_order")
              .order("sort_order")
              .order("name"),
          ]);

          if (categoriesResponse.error) throw categoriesResponse.error;
          if (tagsResponse.error) throw tagsResponse.error;

          const uniqueTags = new Set<string>();
          const persistedTagDefinitions = tagDefinitionsResponse.error
            ? storedTagDefinitionsRef.current
            : ((tagDefinitionsResponse.data || []) as ClientTagDefinition[]);
          persistedTagDefinitions.forEach((tag) => uniqueTags.add(tag.name));
          tagsResponse.data?.forEach((client) => {
            if (client.tags && Array.isArray(client.tags)) {
              client.tags.forEach((tag: string) => uniqueTags.add(tag));
            }
          });

          return {
            categories: (categoriesResponse.data || []) as ClientCategory[],
            tags: Array.from(uniqueTags).sort(),
            tagDefinitions: persistedTagDefinitions,
          };
        })().finally(() => {
          categoriesAndTagsFetch = null;
        });
      }

      const payload = await categoriesAndTagsFetch;
      React.startTransition(() => {
        setCategories(payload.categories);
        setAllTags(payload.tags);
        setTagDefinitions(payload.tagDefinitions);
      });
    } catch (error) {
      console.error("Error fetching categories and tags:", error);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    // Only show the loading bar when we have nothing cached to display yet.
    if (clientsCache === null) {
      setIsLoading(true);
    }
    try {
      // First page — render immediately so the UI feels instant
      // Concurrent calls (including React StrictMode in development) share the
      // same request instead of querying the complete list twice.
      const initial = await fetchClientsFirstPage();
      setClients(initial);
      clientsCache = initial;
      setIsLoading(false); // progress bar disappears, page is interactive

      // Background: stream the rest in batches without blocking the UI
      if (initial.length === CLIENTS_FETCH_PAGE_SIZE) {
        const completeList = await fetchRemainingClients(initial);
        clientsCache = completeList;
        React.startTransition(() => setClients(completeList));
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת הלקוחות",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, []);

  // Data fetching on mount
  useEffect(() => {
    void fetchClients();

    // Filters, counters and tags are useful immediately after the gallery is
    // visible, but they should not compete with the first client paint.
    const loadSecondaryData = () => {
      void fetchFilterData();
      void fetchCategoriesAndTags();
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(loadSecondaryData, {
        timeout: 700,
      });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(loadSecondaryData, 0);
    return () => clearTimeout(timeoutId);
  }, [fetchClients, fetchFilterData, fetchCategoriesAndTags]);

  // Keep the compact process controls aligned with edits made in a client
  // profile (including another tab). Refetch on focus and after realtime
  // changes so open-task counts do not remain stale.
  useEffect(() => {
    const refreshProcessData = () => {
      void fetchFilterData();
    };

    window.addEventListener("focus", refreshProcessData);
    document.addEventListener("visibilitychange", refreshProcessData);

    const processChannel = supabase
      .channel("clients-process-control-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_stages" },
        refreshProcessData,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_stage_tasks" },
        refreshProcessData,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_payment_stages" },
        refreshProcessData,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        refreshProcessData,
      )
      .subscribe();

    return () => {
      window.removeEventListener("focus", refreshProcessData);
      document.removeEventListener("visibilitychange", refreshProcessData);
      if (typeof (supabase as any).removeChannel === "function") {
        void supabase.removeChannel(processChannel);
      } else if (typeof (processChannel as any)?.unsubscribe === "function") {
        void (processChannel as any).unsubscribe();
      }
    };
  }, [fetchFilterData]);

  // Check for duplicate clients
  const checkForDuplicates = async (
    name: string,
    email: string | null,
    phone: string | null,
    idNumber: string | null,
  ) => {
    // Run separate safe queries for each field to avoid filter injection
    const results: Client[] = [];

    // Check by name (fuzzy match)
    if (name.trim()) {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .ilike("name", `%${name.trim()}%`);
      if (data?.length) results.push(...(data as Client[]));
    }

    // Check by email (exact match)
    if (email && email.trim()) {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("email", email.trim());
      if (data?.length) results.push(...(data as Client[]));
    }

    // Check by phone (exact match)
    if (phone && phone.trim()) {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("phone", phone.trim());
      if (data?.length) results.push(...(data as Client[]));
    }

    // Check by ID number (exact match)
    if (idNumber && idNumber.trim()) {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("id_number", idNumber.trim());
      if (data?.length) results.push(...(data as Client[]));
    }

    if (results.length === 0) return null;

    // Deduplicate by id and return first match
    const seen = new Set<string>();
    const unique = results.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    // Return first matching duplicate
    return unique.length > 0 ? unique[0] : null;
  };

  // Helper to build client data object from form
  const buildClientData = (userId: string | null) => ({
    name: newClientForm.name.trim(),
    email: newClientForm.email.trim() || null,
    phone: newClientForm.phone.trim() || null,
    id_number: newClientForm.idNumber.trim() || null,
    gush: newClientForm.gush.trim() || null,
    helka: newClientForm.helka.trim() || null,
    migrash: newClientForm.migrash.trim() || null,
    taba: newClientForm.taba.trim() || null,
    street: newClientForm.street.trim() || null,
    moshav: newClientForm.moshav.trim() || null,
    aguda_address: newClientForm.agudaAddress.trim() || null,
    aguda_email: newClientForm.agudaEmail.trim() || null,
    vaad_moshav_address: newClientForm.vaadMoshavAddress.trim() || null,
    vaad_moshav_email: newClientForm.vaadMoshavEmail.trim() || null,
    custom_data: buildCustomData(customFieldValues),
    status: "active" as const,
    user_id: userId,
    created_by: userId,
  });

  // Add new client with duplicate check
  const handleAddClient = async () => {
    if (!newClientForm.name.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין שם לקוח",
        variant: "destructive",
      });
      return;
    }

    setIsAddingClient(true);

    try {
      // Add timeout wrapper to prevent UI freeze
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("הבקשה ארכה יותר מדי זמן")), 15000),
      );

      await Promise.race([
        (async () => {
          // Ensure we have a valid session, try to refresh if lost
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            await supabase.auth.refreshSession();
          }

          // Get current user for ownership fields
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const userId = user?.id || null;

          const clientData = buildClientData(userId);

          // Check for duplicates first
          const duplicate = await checkForDuplicates(
            clientData.name,
            clientData.email,
            clientData.phone,
            clientData.id_number,
          );

          if (duplicate) {
            // Store pending data and show duplicate dialog
            setPendingClientData(clientData);
            setDuplicateClient(duplicate);
            setDuplicateDialogOpen(true);
            setIsAddingClient(false);
            return;
          }

          // No duplicate found, proceed with insert
          await insertNewClient(clientData);
        })(),
        timeoutPromise,
      ]);
    } catch (error: any) {
      console.error("Error adding client:", error);
      toast({
        title: "שגיאה",
        description: error?.message || "לא ניתן להוסיף את הלקוח",
        variant: "destructive",
      });
      setIsAddingClient(false);
    }
  };

  // Insert new client (used after duplicate check)
  const insertNewClient = async (clientData: any) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert(clientData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "לקוח נוסף בהצלחה",
        description: `הלקוח "${clientData.name}" נוסף למערכת`,
      });

      // Reset form and close dialog
      resetAddClientForm();
      setIsAddClientDialogOpen(false);

      // Refresh clients list
      fetchClients();

      // Navigate to new client
      if (data?.id) {
        navigate(`/client-profile/${data.id}`);
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error?.message || "לא ניתן להוסיף את הלקוח",
        variant: "destructive",
      });
      setIsAddingClient(false);
    }
  };

  // Handle overwrite duplicate
  const handleOverwriteDuplicate = async () => {
    if (!duplicateClient || !pendingClientData) return;

    setIsAddingClient(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update(pendingClientData)
        .eq("id", duplicateClient.id);

      if (error) throw error;

      toast({
        title: "לקוח עודכן בהצלחה",
        description: `הלקוח "${pendingClientData.name}" עודכן במערכת`,
      });

      // Reset and close dialogs
      resetAddClientForm();
      setDuplicateDialogOpen(false);
      setIsAddClientDialogOpen(false);
      setDuplicateClient(null);
      setPendingClientData(null);

      // Refresh clients list
      fetchClients();

      // Navigate to updated client
      navigate(`/client-profile/${duplicateClient.id}`);
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הלקוח",
        variant: "destructive",
      });
    } finally {
      setIsAddingClient(false);
    }
  };

  // Handle skip duplicate (add anyway with different identifier)
  const handleSkipDuplicate = () => {
    setDuplicateDialogOpen(false);
    setDuplicateClient(null);
    setPendingClientData(null);
    toast({
      title: "פעולה בוטלה",
      description: "הלקוח לא נוסף",
    });
  };

  // Handle add anyway (force add despite duplicate)
  const handleAddAnyway = async () => {
    if (!pendingClientData) return;

    setDuplicateDialogOpen(false);
    setDuplicateClient(null);

    await insertNewClient(pendingClientData);
    setPendingClientData(null);
  };

  // Reset add client form
  const resetAddClientForm = () => {
    setNewClientForm({
      name: "",
      email: "",
      phone: "",
      idNumber: "",
      gush: "",
      helka: "",
      migrash: "",
      taba: "",
      street: "",
      moshav: "",
      agudaAddress: "",
      agudaEmail: "",
      vaadMoshavAddress: "",
      vaadMoshavEmail: "",
    });
    setCustomFieldValues({});
  };

  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case "active":
        return { label: "פעיל", bgColor: "#1e3a5f", textColor: "#ffffff" };
      case "pending":
        return { label: "ממתין", bgColor: "#64748b", textColor: "#ffffff" };
      case "inactive":
        return { label: "לא פעיל", bgColor: "#94a3b8", textColor: "#1e293b" };
      default:
        return { label: "ממתין", bgColor: "#64748b", textColor: "#ffffff" };
    }
  };

  // Export to Google Sheets
  const handleExportToGoogleSheets = async () => {
    if (!isGoogleSheetsConnected) {
      await connectGoogleSheets();
      return;
    }

    if (clients.length === 0) {
      toast({
        title: "אין לקוחות לייצוא",
        description: "אין נתונים לייצא",
      });
      return;
    }

    await syncClientsToSheets(clients);
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedClients(new Set());
  };

  // Toggle client selection
  const toggleClientSelection = (clientId: string) => {
    setSelectedClients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  // Select all clients
  const selectAllClients = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map((c) => c.id)));
    }
  };

  // Bulk delete selected clients
  const handleBulkDelete = async () => {
    if (selectedClients.size === 0) return;

    const count = selectedClients.size;
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק ${count} לקוחות?`)) return;

    setIsDeleting(true);
    try {
      const idsToDelete = Array.from(selectedClients);
      const { error } = await supabase
        .from("clients")
        .delete()
        .in("id", idsToDelete);

      if (error) throw error;

      setClients((prev) => prev.filter((c) => !selectedClients.has(c.id)));
      setSelectedClients(new Set());
      setSelectionMode(false);

      toast({ title: `${count} לקוחות נמחקו בהצלחה` });
    } catch (error) {
      console.error("Error bulk deleting clients:", error);
      toast({ title: "שגיאה במחיקת הלקוחות", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete client handler
  const handleDeleteClient = async (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    if (!window.confirm("האם אתה בטוח שברצונך למחוק לקוח זה?")) return;

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);
      if (error) throw error;

      setClients((prev) => prev.filter((c) => c.id !== clientId));
      toast({ title: "הלקוח נמחק בהצלחה" });
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast({
        title: "שגיאה במחיקת הלקוח",
        description: error?.message || "לא ניתן למחוק את הלקוח",
        variant: "destructive",
      });
    }
  };

  // Context menu delete (no event needed)
  const handleContextDeleteClient = async (clientId: string) => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק לקוח זה?")) return;
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);
      if (error) throw error;
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      toast({ title: "הלקוח נמחק בהצלחה" });
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast({
        title: "שגיאה במחיקת הלקוח",
        description: error?.message || "לא ניתן למחוק את הלקוח",
        variant: "destructive",
      });
    }
  };

  // Context menu: enter selection mode with this client pre-selected
  const handleStartSelectionWithClient = (clientId: string) => {
    setSelectionMode(true);
    setSelectedClients(new Set([clientId]));
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${label} הועתק ללוח` });
    });
  };

  // Edit client handler
  const handleEditClient = (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    navigate(`/client-profile/${clientId}?edit=true`);
  };

  // Elegant Client Card Component
  const ClientCard = ({ client }: { client: Client }) => {
    const statusConfig = getStatusConfig(client.status);
    const hasReminder = clientsWithReminders.has(client.id);
    const hasTask = clientsWithTasks.has(client.id);
    const hasMeeting = clientsWithMeetings.has(client.id);
    const category = client.category_id
      ? categories.find((c) => c.id === client.category_id)
      : null;
    const selectedCategoryStage = selectedWorkflowStageByClient.get(client.id);
    const signedContractDate = latestContractSignedByClient[client.id] || null;
    const monthsAnchorDate = signedContractDate || client.created_at;
    const monthsSinceStart = getElapsedMonths(monthsAnchorDate);
    const monthsSourceLabel = signedContractDate
      ? "מחתימה אחרונה של חוזה"
      : "ממועד פתיחת תיק הלקוח";
    const renderPersonalOrderHandle = () =>
      personalRecentOrderingActive ? (
        <span
          className="pointer-events-none mr-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[#d4a843]/70 bg-white/95 text-[#d4a843] opacity-0 shadow-sm transition-opacity group-hover/client-name:opacity-100"
          title="גרור לשינוי הסדר האישי"
          aria-hidden="true"
        >
          <GripVertical className="h-3 w-3" />
        </span>
      ) : null;

    const getMonthsPalette = (months: number) => {
      if (months >= 8) {
        return {
          icon: "#dc2626",
          border: "rgba(220, 38, 38, 0.45)",
          background: "rgba(220, 38, 38, 0.10)",
        };
      }

      if (months >= 7) {
        return {
          icon: "#16a34a",
          border: "rgba(22, 163, 74, 0.45)",
          background: "rgba(22, 163, 74, 0.10)",
        };
      }

      if (months >= 6) {
        return {
          icon: "#2563eb",
          border: "rgba(37, 99, 235, 0.45)",
          background: "rgba(37, 99, 235, 0.10)",
        };
      }

      if (months >= 4) {
        return {
          icon: "#db2777",
          border: "rgba(219, 39, 119, 0.45)",
          background: "rgba(219, 39, 119, 0.10)",
        };
      }

      return {
        icon: "#1e3a5f",
        border: "rgba(30, 58, 95, 0.25)",
        background: "rgba(30, 58, 95, 0.10)",
      };
    };

    const monthsPalette = getMonthsPalette(monthsSinceStart);

    const renderMonthsIndicator = (
      variant: "compact" | "regular" = "regular",
    ) => {
      const isCompact = variant === "compact";

      return (
        <span
          title={`${monthsSinceStart} חודשים ${monthsSourceLabel}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            fontSize: isCompact ? "11px" : "12px",
            fontWeight: 700,
            color: "#1e3a5f",
            backgroundColor: "rgba(30, 58, 95, 0.10)",
            border: "1px solid rgba(30,58,95,0.25)",
            borderRadius: "999px",
            padding: isCompact ? "1px 8px" : "2px 9px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {monthsSinceStart} ח׳
        </span>
      );
    };

    const renderMonthsStatusIcon = () => (
      <div
        title={`${monthsSinceStart} חודשים ${monthsSourceLabel}`}
        style={{
          position: "absolute",
          left: "10px",
          bottom: "10px",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: monthsPalette.icon,
          border: `1px solid ${monthsPalette.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 10px ${monthsPalette.border}`,
          zIndex: 11,
        }}
      >
        <Clock style={{ width: "12px", height: "12px", color: "#ffffff" }} />
      </div>
    );
    const [showActions, setShowActions] = useState(false);
    const effectiveTaskViewContent =
      clientTaskViewOverrides[client.id] || taskViewContent;
    const renderTaskViewSwitcher = () => {
      const options: Array<{
        value: ClientTaskViewContent;
        label: string;
        icon: typeof Layers;
      }> = [
        { value: "process", label: "שלבים", icon: Layers },
        { value: "tasks", label: "משימות", icon: CheckSquare },
        { value: "reminders", label: "תזכורות", icon: Bell },
        { value: "meetings", label: "פגישות", icon: Calendar },
        { value: "payments", label: "תשלומים", icon: CircleDollarSign },
      ];

      return (
        <div
          className="flex items-center justify-center gap-1 border-b border-[#d4a843]/25 bg-[#fef9ee]/70 px-3 py-1.5"
          aria-label={`בחירת תוכן עבור ${client.name}`}
        >
          {options.map((option) => {
            const OptionIcon = option.icon;
            const isActive = effectiveTaskViewContent === option.value;

            return (
              <button
                key={option.value}
                type="button"
                title={option.label}
                aria-label={`${option.label} — ${client.name}`}
                aria-pressed={isActive}
                onClick={() =>
                  setClientTaskViewOverrides((current) => {
                    if (option.value === taskViewContent) {
                      const next = { ...current };
                      delete next[client.id];
                      return next;
                    }

                    return { ...current, [client.id]: option.value };
                  })
                }
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg border transition",
                  isActive
                    ? "border-[#d4a843] bg-[#1e3a5f] text-[#f1c75b] shadow-sm"
                    : "border-transparent bg-white/80 text-slate-500 hover:border-[#d4a843]/60 hover:text-[#1e3a5f]",
                )}
              >
                <OptionIcon className="h-3.5 w-3.5" />
              </button>
            );
          })}
          {effectiveTaskViewContent !== "payments" && (
            <>
              <span className="mx-0.5 h-4 w-px bg-[#d4a843]/35" aria-hidden="true" />
              <button
                type="button"
                title={`הוסף ${
                  effectiveTaskViewContent === "process"
                    ? "משימה לשלב"
                    : effectiveTaskViewContent === "tasks"
                      ? "משימה"
                      : effectiveTaskViewContent === "reminders"
                        ? "תזכורת"
                        : "פגישה"
                }`}
                aria-label={`הוסף פריט — ${client.name}`}
                onClick={() =>
                  openClientCardQuickCreate(
                    client,
                    effectiveTaskViewContent,
                  )
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d4a843] bg-[#d4a843] text-[#1e3a5f] shadow-sm transition hover:scale-105 hover:bg-[#f1c75b]"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      );
    };
    const isHighlighted = highlightedClientId === client.id;
    const categoryIconRenderer = category
      ? clientCategoryIconMap[category.icon] || clientCategoryIconMap.FolderOpen
      : null;

    const renderCategoryIndicator = (sizePx: number, iconSizePx: number) => {
      if (!category || !categoryIconRenderer) return null;

      return (
        <div
          style={{
            width: `${sizePx}px`,
            height: `${sizePx}px`,
            borderRadius: "50%",
            backgroundColor: "#1e3a5f",
            border: "1.5px solid #ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 8px rgba(30,58,95,0.35)",
          }}
          title={`קטגוריה: ${category.name}`}
        >
          {categoryIconRenderer({
            style: {
              width: `${iconSizePx}px`,
              height: `${iconSizePx}px`,
              color: "#ffffff",
            },
          })}
        </div>
      );
    };

    const renderSelectedCategoryStage = (compact = false) => {
      if (!selectedCategoryStage) return null;

      return (
        <div
          title={`שלב נוכחי מתוך תבנית ${selectedCategoryStage.templateName}`}
          className={cn(
            "mt-auto flex w-full items-center justify-center gap-1.5 border-t border-[#d4a843]/35 bg-[#fef9ee] text-[#1e3a5f]",
            compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
          )}
        >
          <Layers className={compact ? "h-3 w-3 shrink-0" : "h-3.5 w-3.5 shrink-0"} />
          <span className="truncate font-semibold">
            {selectedCategoryStage.stageName || "טרם הוגדר שלב"}
          </span>
        </div>
      );
    };

    const renderProcessControl = (compact = false) => {
      const stages = processStagesByClient.get(client.id) || [];
      const tasks = processTasksByClient.get(client.id) || [];

      return (
        <ClientProcessControl
          clientId={client.id}
          clientName={client.name}
          compact={compact}
          settings={processControlSettings}
          stages={stages.map((stage) => ({
            id: stage.id,
            stageId: stage.stage_id,
            name: stage.stage_name,
            sortOrder: stage.sort_order ?? 0,
            completed: Boolean(stage.is_completed),
          }))}
          tasks={tasks.map((task) => ({
            id: task.id,
            stageId: task.stage_id,
            title: task.title,
            completed: Boolean(task.completed),
          }))}
          onSettingsChange={setProcessControlSettings}
          onToggleTask={handleToggleStageTask}
          onOpenProcess={() => navigate(`/client-profile/${client.id}`)}
        />
      );
    };

    // Register ref for keyboard navigation
    const cardRef = useCallback(
      (node: HTMLDivElement | null) => {
        if (node) {
          clientRefs.current.set(client.id, node);
        }
      },
      [client.id],
    );

    const handleMouseEnter = () => {
      setShowActions(true);
    };

    const handleMouseLeave = () => {
      setShowActions(false);
    };

    if (viewMode === "tasks") {
      if (effectiveTaskViewContent === "payments") {
        const paymentMode = filters.paymentStatus || "reached";
        const paymentModeLabel = {
          due: "ממתינים לתשלום",
          current: "בשלב הנוכחי",
          paid: "שולמו",
          reached: "עד השלב הנוכחי",
        }[paymentMode];
        const paymentItems = (paymentItemsByClient.get(client.id) || []).filter(
          (item) => {
            switch (paymentMode) {
              case "due":
                return item.remainingAmount > 0.01;
              case "current":
                return item.isCurrent;
              case "paid":
                return item.paidAmount > 0;
              case "reached":
                return true;
            }
          },
        );
        const displayedPayments =
          processControlSettings.verticalScroll !== false
            ? paymentItems
            : paymentItems.slice(0, processControlSettings.tasksToShow);
        const visiblePaymentIds = new Set(
          displayedPayments.map((payment) => payment.id),
        );
        const paymentGroups = Array.from(
          paymentItems.reduce((groups, payment) => {
            const key = `${payment.workflowStageOrder}:${payment.workflowStageName}`;
            const existing = groups.get(key) || {
              name: payment.workflowStageName,
              order: payment.workflowStageOrder,
              items: [] as ClientPaymentDisplayItem[],
            };
            existing.items.push(payment);
            groups.set(key, existing);
            return groups;
          }, new Map<string, { name: string; order: number; items: ClientPaymentDisplayItem[] }>())
          .values(),
        ).sort((a, b) => a.order - b.order);
        const getDisplayedAmount = (payment: ClientPaymentDisplayItem) => {
          switch (paymentMode) {
            case "due":
              return payment.remainingAmount;
            case "paid":
              return payment.paidAmount;
            case "current":
            case "reached":
              return payment.grossAmount;
          }
        };
        const totalDisplayedAmount = paymentItems.reduce(
          (sum, payment) => sum + getDisplayedAmount(payment),
          0,
        );
        const formatPaymentAmount = (amount: number) =>
          `₪${Math.round(amount).toLocaleString("he-IL")}`;

        return (
          <article
            ref={cardRef}
            dir="rtl"
            className="group flex min-h-[260px] flex-col overflow-hidden rounded-2xl border-2 border-[#d4a843] bg-white shadow-[0_10px_30px_rgba(30,58,95,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(30,58,95,0.16)]"
          >
            <button
              type="button"
              onClick={() => navigate(`/client-profile/${client.id}`)}
              className="flex items-center justify-between gap-3 bg-[#1e3a5f] px-4 py-3 text-right text-white"
            >
              <div className="min-w-0">
                <h3 className="group/client-name flex items-center truncate text-base font-bold">
                  <span className="truncate">{client.name}</span>
                  {renderPersonalOrderHandle()}
                </h3>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-white/70">
                  <span>
                    {paymentItems.length} תשלומים {paymentModeLabel}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-[#f1c75b]">
                    {formatPaymentAmount(totalDisplayedAmount)}
                  </span>
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d4a843]/60 bg-white/10 text-[#f1c75b]">
                <CircleDollarSign className="h-4 w-4" />
              </span>
            </button>

            {renderTaskViewSwitcher()}

            <div
              data-client-task-scroll="true"
              className={cn(
                "flex-1 space-y-3 p-3",
                processControlSettings.verticalScroll !== false &&
                  "overflow-y-auto",
              )}
              style={
                processControlSettings.verticalScroll !== false
                  ? {
                      maxHeight: `${Math.max(
                        180,
                        processControlSettings.tasksToShow * 58 + 54,
                      )}px`,
                    }
                  : undefined
              }
            >
              {displayedPayments.length === 0 ? (
                <div className="flex h-full min-h-32 items-center justify-center text-sm text-slate-400">
                  אין תשלומים במצב זה
                </div>
              ) : (
                paymentGroups.map((group) => {
                  const paymentsToRender = group.items.filter((payment) =>
                    visiblePaymentIds.has(payment.id),
                  );
                  if (paymentsToRender.length === 0) return null;

                  return (
                    <section key={`${group.order}:${group.name}`} className="space-y-1.5">
                      <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg bg-[#f7ecd0] px-2.5 py-1.5 text-[#1e3a5f]">
                        <span className="truncate text-xs font-bold">
                          {group.name}
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold">
                          {paymentsToRender.length}
                        </span>
                      </div>

                      {paymentsToRender.map((payment) => {
                        const amount = getDisplayedAmount(payment);
                        const isFullyPaid =
                          payment.remainingAmount <= 0.01 &&
                          payment.paidAmount > 0;
                        const isPartiallyPaid =
                          payment.paidAmount > 0 && !isFullyPaid;
                        const statusLabel = isFullyPaid
                          ? "שולם"
                          : isPartiallyPaid
                            ? "שולם חלקית"
                            : payment.isCurrent
                              ? "שלב נוכחי"
                              : "ממתין";

                        return (
                          <button
                            key={payment.id}
                            type="button"
                            onClick={() =>
                              navigate(`/client-profile/${client.id}`)
                            }
                            className="flex w-full items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-right transition hover:border-[#d4a843] hover:bg-[#fef9ee]"
                          >
                            <span
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                                isFullyPaid
                                  ? "bg-emerald-50 text-emerald-600"
                                  : isPartiallyPaid
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-[#1e3a5f]/8 text-[#1e3a5f]",
                              )}
                            >
                              <CircleDollarSign className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-[#1e3a5f]">
                                {payment.title}
                              </span>
                              <span
                                className={cn(
                                  "mt-0.5 block text-[10px]",
                                  isFullyPaid
                                    ? "text-emerald-600"
                                    : isPartiallyPaid
                                      ? "text-amber-600"
                                      : "text-slate-500",
                                )}
                              >
                                {statusLabel}
                                {isPartiallyPaid &&
                                  ` · מתוך ${formatPaymentAmount(payment.grossAmount)}`}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "shrink-0 rounded-full border px-2 py-1 text-xs font-black",
                                isFullyPaid
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : isPartiallyPaid
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-[#d4a843]/40 bg-[#f7ecd0] text-[#9a6800]",
                              )}
                            >
                              {formatPaymentAmount(amount)}
                            </span>
                          </button>
                        );
                      })}
                    </section>
                  );
                })
              )}
            </div>
          </article>
        );
      }

      if (effectiveTaskViewContent !== "process") {
        const activityConfig = {
          tasks: {
            label: "משימות פתוחות",
            empty: "אין משימות פתוחות",
            icon: CheckSquare,
            items: (tasksByClient.get(client.id) || []).map((item) => ({
              id: item.id,
              title: item.title,
              date: item.due_date,
              entityType: "task" as const,
              completed: item.status === "completed",
            })),
          },
          reminders: {
            label: "תזכורות פעילות",
            empty: "אין תזכורות פעילות",
            icon: Bell,
            items: (remindersByClient.get(client.id) || []).map((item) => ({
              id: item.id,
              title: item.title,
              date: item.remind_at,
              entityType: "reminder" as const,
              completed: Boolean(item.is_dismissed),
            })),
          },
          meetings: {
            label: "פגישות קרובות",
            empty: "אין פגישות קרובות",
            icon: Calendar,
            items: (meetingsByClient.get(client.id) || []).map((item) => ({
              id: item.id,
              title: item.title,
              date: item.start_time,
              entityType: "meeting" as const,
              completed: item.status === "completed",
            })),
          },
        }[effectiveTaskViewContent];
        const ActivityIcon = activityConfig.icon;
        const visibleItems =
          processControlSettings.verticalScroll !== false
            ? activityConfig.items
            : activityConfig.items.slice(
                0,
                processControlSettings.tasksToShow,
              );
        const formatActivityDate = (value: string | null) => {
          if (!value) return "ללא מועד";
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return "ללא מועד";
          return new Intl.DateTimeFormat("he-IL", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(date);
        };

        return (
          <article
            ref={cardRef}
            dir="rtl"
            className="group flex min-h-[260px] flex-col overflow-hidden rounded-2xl border-2 border-[#d4a843] bg-white shadow-[0_10px_30px_rgba(30,58,95,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(30,58,95,0.16)]"
          >
            <button
              type="button"
              onClick={() => navigate(`/client-profile/${client.id}`)}
              className="flex items-center justify-between gap-3 bg-[#1e3a5f] px-4 py-3 text-right text-white"
            >
              <div className="min-w-0">
                <h3 className="group/client-name flex items-center truncate text-base font-bold">
                  <span className="truncate">{client.name}</span>
                  {renderPersonalOrderHandle()}
                </h3>
                <p className="mt-0.5 text-[11px] text-white/65">
                  {activityConfig.items.length} {activityConfig.label}
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d4a843]/60 bg-white/10 text-[#d4a843]">
                <ActivityIcon className="h-4 w-4" />
              </span>
            </button>

            {renderTaskViewSwitcher()}

            <div
              data-client-task-scroll="true"
              className={cn(
                "flex-1 space-y-2 p-3",
                processControlSettings.verticalScroll !== false &&
                  "overflow-y-auto",
              )}
              style={
                processControlSettings.verticalScroll !== false
                  ? {
                      maxHeight: `${Math.max(
                        180,
                        processControlSettings.tasksToShow * 56 + 18,
                      )}px`,
                    }
                  : undefined
              }
            >
              {visibleItems.length === 0 ? (
                <div className="flex h-full min-h-32 items-center justify-center text-sm text-slate-400">
                  {activityConfig.empty}
                </div>
              ) : (
                visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-right transition hover:border-[#d4a843] hover:bg-[#fef9ee]"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/client-profile/${client.id}`)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-right"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1e3a5f]/8 text-[#1e3a5f]">
                        <ActivityIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-[#1e3a5f]">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          {formatActivityDate(item.date)}
                        </span>
                      </span>
                    </button>
                    <ActivityFollowUpActions
                      entityType={item.entityType}
                      entityId={item.id}
                      title={item.title}
                      scheduledAt={item.date}
                      completed={item.completed}
                      compact
                      onChanged={fetchFilterData}
                    />
                  </div>
                ))
              )}
            </div>
          </article>
        );
      }

      const orderedStages = [...(processStagesByClient.get(client.id) || [])]
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const clientTasks = processTasksByClient.get(client.id) || [];
      const stageGroups = orderedStages
        .map((stage) => ({
          stage,
          tasks: clientTasks.filter(
            (task) => task.stage_id === stage.stage_id && !task.completed,
          ),
        }))
        .filter((group) => group.tasks.length > 0)
        .slice(0, processControlSettings.stagesToShow);
      const allVisibleTasks = stageGroups.flatMap((group) =>
        group.tasks.map((task) => ({ ...task, stage: group.stage })),
      );
      const displayedTasks = processControlSettings.verticalScroll !== false
        ? allVisibleTasks
        : allVisibleTasks.slice(0, processControlSettings.tasksToShow);

      return (
        <article
          ref={cardRef}
          dir="rtl"
          className="group flex min-h-[260px] flex-col overflow-hidden rounded-2xl border-2 border-[#d4a843] bg-white shadow-[0_10px_30px_rgba(30,58,95,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(30,58,95,0.16)]"
        >
          <button
            type="button"
            onClick={() => navigate(`/client-profile/${client.id}`)}
            className="flex items-center justify-between gap-3 bg-[#1e3a5f] px-4 py-3 text-right text-white"
          >
            <div className="min-w-0">
              <h3 className="group/client-name flex items-center truncate text-base font-bold">
                <span className="truncate">{client.name}</span>
                {renderPersonalOrderHandle()}
              </h3>
              <p className="mt-0.5 text-[11px] text-white/65">
                {allVisibleTasks.length} משימות פתוחות
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d4a843]/60 bg-white/10 text-[#d4a843]">
              <ClipboardList className="h-4 w-4" />
            </span>
          </button>

          {renderTaskViewSwitcher()}

          <div
            data-client-task-scroll="true"
            className={cn(
              "flex-1 space-y-3 p-3",
              processControlSettings.verticalScroll !== false &&
                "overflow-y-auto",
            )}
            style={
              processControlSettings.verticalScroll !== false
                ? {
                    maxHeight: `${Math.max(
                      180,
                      processControlSettings.tasksToShow * 48 + 54,
                    )}px`,
                  }
                : undefined
            }
          >
            {displayedTasks.length === 0 ? (
              <div className="flex h-full min-h-32 items-center justify-center text-sm text-slate-400">
                אין משימות פתוחות
              </div>
            ) : (
              stageGroups.map(({ stage, tasks: stageTasks }) => {
                const visibleIds = new Set(displayedTasks.map((task) => task.id));
                const tasksToRender = stageTasks.filter((task) => visibleIds.has(task.id));
                if (tasksToRender.length === 0) return null;
                return (
                  <section key={stage.id} className="space-y-1.5">
                    <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg bg-[#f7ecd0] px-2.5 py-1.5 text-[#1e3a5f]">
                      <span className="truncate text-xs font-bold">{stage.stage_name}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold">
                        {stageTasks.length}
                      </span>
                    </div>
                    {tasksToRender.map((task) => (
                      <div
                        key={task.id}
                        className="group/task flex w-full items-center gap-1 rounded-xl border border-slate-100 bg-slate-50/60 pr-2.5 text-right transition hover:border-[#d4a843] hover:bg-[#fef9ee]"
                      >
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-start gap-2 py-2.5 text-right"
                          onClick={() => void handleToggleStageTask(task.id, true)}
                        >
                          <span className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-slate-300 bg-white" />
                          <span className="text-xs leading-5 text-[#1e3a5f]">{task.title}</span>
                        </button>
                        <TaskClientMessageButton
                          clientId={client.id}
                          taskId={task.id}
                          taskTitle={task.title}
                          stageName={stage.stage_name}
                          className="ml-1 opacity-60 transition-opacity group-hover/task:opacity-100"
                        />
                        <ActivityFollowUpActions
                          entityType="client_stage_task"
                          entityId={task.id}
                          title={task.title}
                          scheduledAt={task.due_date}
                          completed={task.completed}
                          showComplete={false}
                          compact
                          onChanged={fetchFilterData}
                          className="opacity-70 transition-opacity group-hover/task:opacity-100"
                        />
                      </div>
                    ))}
                  </section>
                );
              })
            )}
          </div>
        </article>
      );
    }

    // Card style configurations based on viewMode
    const getCardStyle = () => {
      switch (viewMode) {
        case "portrait":
          return {
            minHeight: "200px",
            width: "160px",
            flexDirection: "column" as const,
            borderRadius: "16px",
            padding: "12px",
          };
        case "cards":
          return {
            minHeight: "110px",
            flexDirection: "column" as const,
            borderRadius: "16px",
            padding: "16px",
          };
        case "minimal":
          return {
            minHeight: "50px",
            flexDirection: "row" as const,
            borderRadius: "8px",
            padding: "8px 12px",
          };
        case "list":
          return {
            minHeight: "70px",
            flexDirection: "row" as const,
            borderRadius: "12px",
            padding: "12px 16px",
          };
        case "compact":
          return {
            minHeight: "100px",
            flexDirection: "column" as const,
            borderRadius: "10px",
            padding: "12px",
          };
        case "luxury":
          return {
            minHeight: "180px",
            flexDirection: "column" as const,
            borderRadius: "20px",
            padding: "20px",
          };
        default: // grid
          return {
            minHeight: "160px",
            flexDirection: "column" as const,
            borderRadius: "12px",
            padding: "16px",
          };
      }
    };

    const cardStyle = getCardStyle();
    const isSelected = selectedClients.has(client.id);

    // Handle click based on selection mode
    const handleCardClick = (e: React.MouseEvent) => {
      if (selectionMode) {
        e.preventDefault();
        e.stopPropagation();
        toggleClientSelection(client.id);
      } else {
        navigate(`/client-profile/${client.id}`);
      }
    };

    // Selection checkbox component
    const SelectionCheckbox = ({
      position = "top-left",
    }: {
      position?: string;
    }) => {
      if (!selectionMode) return null;

      const positionStyles =
        position === "top-left"
          ? { top: "8px", left: "8px" }
          : { top: "8px", right: "8px" };

      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleClientSelection(client.id);
          }}
          style={{
            position: "absolute",
            ...positionStyles,
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            backgroundColor: isSelected ? "#3b82f6" : "#ffffff",
            border: isSelected ? "2px solid #3b82f6" : "2px solid #d4a843",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            zIndex: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {isSelected && (
            <Check
              style={{ width: "16px", height: "16px", color: "#ffffff" }}
            />
          )}
        </div>
      );
    };

    // Portrait view - elegant tall card with avatar placeholder
    if (viewMode === "portrait") {
      return (
        <div
          ref={cardRef}
          className="group relative cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: isHighlighted
              ? "#fef3c7"
              : isSelected
                ? "#eff6ff"
                : "#ffffff",
            borderRadius: cardStyle.borderRadius,
            border: isHighlighted
              ? "3px solid #f59e0b"
              : isSelected
                ? "3px solid #3b82f6"
                : "2px solid #d4a843",
            boxShadow: isHighlighted
              ? "0 0 20px rgba(245, 158, 11, 0.5)"
              : isSelected
                ? "0 4px 20px rgba(59, 130, 246, 0.3)"
                : "0 4px 16px rgba(0,0,0,0.08)",
            minHeight: cardStyle.minHeight,
            width: cardStyle.width,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: cardStyle.padding,
          }}
        >
          <SelectionCheckbox position="top-left" />
          {renderProcessControl(true)}

          {showActions && (category || hasReminder || hasTask || hasMeeting) && (
            <div className="absolute top-2 right-2 flex gap-1">
              {renderCategoryIndicator(14, 8)}
              {hasReminder && (
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)] flex items-center justify-center">
                  <Bell className="w-2 h-2 text-white" />
                </div>
              )}
              {hasTask && (
                <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.55)] flex items-center justify-center">
                  <CheckSquare className="w-2 h-2 text-white" />
                </div>
              )}
              {hasMeeting && (
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <Calendar className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
          )}

          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)",
              border: "3px solid #d4a843",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "8px",
            }}
          >
            <span
              style={{
                borderRadius: "999px",
                border: "1.5px solid #d4a843",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: "700",
                color: "#d4a843",
                backgroundColor: "rgba(212,168,67,0.08)",
                padding: "1px 5px",
                lineHeight: 1,
              }}
            >
              {monthsSinceStart}
            </span>
          </div>

          {renderMonthsStatusIcon()}

          <h3
            style={{
              fontSize: "15px",
              fontWeight: "700",
              color: "#1e3a5f",
              textAlign: "center",
              marginTop: "12px",
              lineHeight: "1.3",
              maxWidth: "100%",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <ClientNameWithCategory
                clientName={client.name}
                categoryId={client.category_id}
                categories={categories}
              />
              {showActions && renderMonthsIndicator("compact")}
            </span>
          </h3>

          {showActions && (isValidPhoneForDisplay(client.phone) || ((client as any).additional_phones?.length ?? 0) > 0) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#64748b",
                marginTop: "auto",
                paddingTop: "8px",
              }}
              dir="ltr"
            >
              <PhoneWithExtras
                phone={client.phone}
                additionalPhones={(client as any).additional_phones}
                fontSize={11}
                iconSize={12}
                color="#64748b"
              />
            </div>
          )}

          {showActions && client.email && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#64748b",
                marginTop: "4px",
                maxWidth: "100%",
              }}
            >
              <Mail style={{ width: "12px", height: "12px", flexShrink: 0 }} />
              <span
                style={{
                  fontSize: "11px",
                  maxWidth: "120px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {client.email}
              </span>
            </div>
          )}

          {showActions && (
            <div className="absolute bottom-2 left-2 flex gap-1">
              {isValidPhoneForDisplay(client.phone) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    import("@/utils/whatsapp").then(
                      ({ openWhatsApp, WHATSAPP_TEMPLATES }) => {
                        openWhatsApp(
                          client.phone!,
                          WHATSAPP_TEMPLATES.greeting(client.name),
                        );
                      },
                    );
                  }}
                  className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-700"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3 h-3 text-white" />
                </button>
              )}
              <button
                onClick={(e) => handleEditClient(e, client.id)}
                className="w-6 h-6 rounded-full bg-slate-800 border border-amber-500 flex items-center justify-center hover:bg-amber-500"
              >
                <Pencil className="w-3 h-3 text-white" />
              </button>
              <button
                onClick={(e) => handleDeleteClient(e, client.id)}
                className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700"
              >
                <Trash2 className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
          {renderSelectedCategoryStage(true)}
        </div>
      );
    }

    // Cards view - elegant horizontal rectangle cards
    if (viewMode === "cards") {
      return (
        <div
          ref={cardRef}
          className="group relative cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: isHighlighted
              ? "#fef3c7"
              : isSelected
                ? "#eff6ff"
                : "#ffffff",
            borderRadius: "16px",
            border: isHighlighted
              ? "3px solid #f59e0b"
              : isSelected
                ? "3px solid #3b82f6"
                : "2px solid #d4a843",
            boxShadow: isHighlighted
              ? "0 0 20px rgba(245, 158, 11, 0.5)"
              : isSelected
                ? "0 4px 20px rgba(59, 130, 246, 0.3)"
                : "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(212, 168, 67, 0.3)",
            minHeight: "110px",
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
          }}
        >
          {/* Selection Checkbox */}
          <SelectionCheckbox position="top-left" />
          {renderProcessControl()}
          {/* Left colored section */}
          <div
            style={{
              width: "132px",
              minWidth: "132px",
              background:
                "linear-gradient(180deg, #1e3a5f 0%, #2d5a87 55%, #1e3a5f 100%)",
              borderRight: "2px solid #d4a843",
              boxShadow: "inset -10px 0 18px rgba(0,0,0,0.12)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "18px 14px",
            }}
          >
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.15)",
                border: "2px solid #d4a843",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  borderRadius: "999px",
                  border: "1.5px solid #d4a843",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#d4a843",
                  backgroundColor: "rgba(212,168,67,0.08)",
                  padding: "1px 5px",
                  lineHeight: 1,
                }}
              >
                {monthsSinceStart}
              </span>
            </div>
          </div>

          {renderMonthsStatusIcon()}

          {/* Right content */}
          <div
            style={{
              flex: 1,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {/* Indicators + Hover Actions */}
            {showActions && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
                {(category || hasReminder || hasTask || hasMeeting) && (
                  <div className="flex items-center gap-1">
                    {renderCategoryIndicator(16, 9)}
                    {hasReminder && (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)] flex items-center justify-center">
                        <Bell className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    {hasTask && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.55)] flex items-center justify-center">
                        <CheckSquare className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    {hasMeeting && (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  {isValidPhoneForDisplay(client.phone) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        import("@/utils/whatsapp").then(
                          ({ openWhatsApp, WHATSAPP_TEMPLATES }) => {
                            openWhatsApp(
                              client.phone!,
                              WHATSAPP_TEMPLATES.greeting(client.name),
                            );
                          },
                        );
                      }}
                      className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-700"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-2.5 h-2.5 text-white" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleEditClient(e, client.id)}
                    className="w-5 h-5 rounded-full bg-slate-800 border border-amber-500 flex items-center justify-center hover:bg-amber-500"
                    title="עריכה"
                  >
                    <Pencil className="w-2.5 h-2.5 text-white" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClient(e, client.id)}
                    className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700"
                    title="מחיקה"
                  >
                    <Trash2 className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              </div>
            )}

            <h3
              className="group/client-name"
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1e3a5f",
                marginBottom: "8px",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <ClientNameWithCategory
                  clientName={client.name}
                  categoryId={client.category_id}
                  categories={categories}
                />
                {renderPersonalOrderHandle()}
                {showActions && renderMonthsIndicator()}
              </span>
            </h3>

            {showActions && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                color: "#64748b",
              }}
            >
              {(isValidPhoneForDisplay(client.phone) || ((client as any).additional_phones?.length ?? 0) > 0) && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  dir="ltr"
                >
                  <PhoneWithExtras
                    phone={client.phone}
                    additionalPhones={(client as any).additional_phones}
                    fontSize={13}
                    iconSize={14}
                    color="#64748b"
                  />
                </div>
              )}
              {client.email && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Mail style={{ width: "14px", height: "14px" }} />
                  <span
                    style={{
                      fontSize: "13px",
                      maxWidth: "180px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {client.email}
                  </span>
                </div>
              )}
            </div>
            )}
          </div>
          {renderSelectedCategoryStage()}
        </div>
      );
    }

    // Luxury view - elegant white-gold design
    if (viewMode === "luxury") {
      return (
        <div
          ref={cardRef}
          className="group relative cursor-pointer transition-all duration-300 hover:scale-[1.02]"
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            border: isHighlighted
              ? "3px solid #f59e0b"
              : isSelected
                ? "3px solid #3b82f6"
                : "3px solid #c9a227",
            boxShadow: isHighlighted
              ? "0 0 25px rgba(245, 158, 11, 0.5)"
              : isSelected
                ? "0 8px 30px rgba(59, 130, 246, 0.3)"
                : "0 8px 30px rgba(201, 162, 39, 0.15), 0 0 0 1px rgba(201, 162, 39, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
            minHeight: "200px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "24px 20px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Luxury corner decorations */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "40px",
              height: "40px",
              borderTop: "3px solid #c9a227",
              borderLeft: "3px solid #c9a227",
              borderTopLeftRadius: "20px",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "40px",
              height: "40px",
              borderTop: "3px solid #c9a227",
              borderRight: "3px solid #c9a227",
              borderTopRightRadius: "20px",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "40px",
              height: "40px",
              borderBottom: "3px solid #c9a227",
              borderLeft: "3px solid #c9a227",
              borderBottomLeftRadius: "20px",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "40px",
              height: "40px",
              borderBottom: "3px solid #c9a227",
              borderRight: "3px solid #c9a227",
              borderBottomRightRadius: "20px",
            }}
          />

          {/* Selection Checkbox */}
          <SelectionCheckbox position="top-left" />
          {renderProcessControl()}

          {/* Indicators */}
          {showActions && (category || hasReminder || hasTask || hasMeeting) && (
            <div className="absolute top-3 right-3 flex gap-1.5">
              {renderCategoryIndicator(16, 9)}
              {hasReminder && (
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.55)]">
                  <Bell className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              {hasTask && (
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.55)]">
                  <CheckSquare className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              {hasMeeting && (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                  <Calendar className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          )}

          {/* Luxury Avatar */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1e3a5f 100%)",
              border: "4px solid #c9a227",
              boxShadow:
                "0 4px 15px rgba(201, 162, 39, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "8px",
            }}
          >
            <span
              style={{
                borderRadius: "999px",
                border: "1.5px solid #d4a843",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "700",
                color: "#c9a227",
                backgroundColor: "rgba(212,168,67,0.08)",
                padding: "1px 6px",
                lineHeight: 1,
              }}
            >
              {monthsSinceStart}
            </span>
          </div>

          {renderMonthsStatusIcon()}

          {/* Name - Navy Blue */}
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "#1e3a5f",
              textAlign: "center",
              marginTop: "14px",
              lineHeight: "1.3",
              maxWidth: "100%",
              wordBreak: "break-word",
              letterSpacing: "0.3px",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <ClientNameWithCategory
                clientName={client.name}
                categoryId={client.category_id}
                categories={categories}
              />
              {showActions && renderMonthsIndicator("compact")}
            </span>
          </h3>

          {/* Decorative line */}
          <div
            style={{
              width: "60px",
              height: "2px",
              background:
                "linear-gradient(90deg, transparent, #c9a227, transparent)",
              margin: "12px 0",
            }}
          />

          {/* Contact Info */}
          {showActions && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              marginTop: "auto",
              paddingTop: "12px",
            }}
          >
            {(isValidPhoneForDisplay(client.phone) || ((client as any).additional_phones?.length ?? 0) > 0) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#1e3a5f",
                }}
                dir="ltr"
              >
                <PhoneWithExtras
                  phone={client.phone}
                  additionalPhones={(client as any).additional_phones}
                  fontSize={13}
                  iconSize={14}
                  color="#1e3a5f"
                />
              </div>
            )}
            {client.email && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#1e3a5f",
                }}
              >
                <Mail
                  style={{ width: "14px", height: "14px", color: "#c9a227" }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    maxWidth: "180px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {client.email}
                </span>
              </div>
            )}
          </div>
          )}

          {/* Hover Actions - Luxury Style */}
          {showActions && (
            <div className="absolute bottom-3 left-3 flex gap-2">
              <button
                onClick={(e) => handleEditClient(e, client.id)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#1e3a5f",
                  border: "2px solid #c9a227",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
                className="hover:bg-amber-600"
              >
                <Pencil className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={(e) => handleDeleteClient(e, client.id)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#dc2626",
                  border: "2px solid #c9a227",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
                className="hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
          {renderSelectedCategoryStage()}
        </div>
      );
    }

    // Minimal view - super compact single line
    if (viewMode === "minimal") {
      return (
        <div
          ref={cardRef}
          className="group cursor-pointer transition-all duration-200 hover:bg-slate-50"
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: isHighlighted
              ? "#fef3c7"
              : isSelected
                ? "#eff6ff"
                : "#ffffff",
            borderRadius: "8px",
            border: isHighlighted
              ? "2px solid #f59e0b"
              : isSelected
                ? "2px solid #3b82f6"
                : "1px solid #e2e8f0",
            borderRight: isHighlighted
              ? "4px solid #f59e0b"
              : isSelected
                ? "4px solid #3b82f6"
                : "3px solid #d4a843",
            boxShadow: isHighlighted
              ? "0 0 15px rgba(245, 158, 11, 0.4)"
              : undefined,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            position: "relative",
          }}
        >
          {/* Selection Checkbox (inline for minimal view) */}
          {selectionMode && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleClientSelection(client.id);
              }}
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: isSelected ? "#3b82f6" : "#ffffff",
                border: isSelected ? "2px solid #3b82f6" : "2px solid #d4a843",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {isSelected && (
                <Check
                  style={{ width: "14px", height: "14px", color: "#ffffff" }}
                />
              )}
            </div>
          )}

          {/* Small avatar */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#1e3a5f",
              border: "2px solid #d4a843",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                borderRadius: "999px",
                border: "1.5px solid #d4a843",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "700",
                color: "#d4a843",
                backgroundColor: "rgba(212,168,67,0.08)",
                padding: "1px 4px",
                lineHeight: 1,
              }}
            >
              {monthsSinceStart}
            </span>
          </div>

          {renderMonthsStatusIcon()}

          {showActions && renderCategoryIndicator(16, 9)}

          {/* Name */}
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#1e3a5f",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              <ClientNameWithCategory
                clientName={client.name}
                categoryId={client.category_id}
                categories={categories}
              />
            </span>
            {showActions && renderMonthsIndicator("compact")}
          </h3>

          {renderSelectedCategoryStage(true)}

          {/* Hover Actions */}
          {showActions && (
            <div className="flex gap-1">
              <button
                onClick={(e) => handleEditClient(e, client.id)}
                className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center hover:bg-amber-500"
              >
                <Pencil className="w-3 h-3 text-slate-700" />
              </button>
              <button
                onClick={(e) => handleDeleteClient(e, client.id)}
                className="w-6 h-6 rounded bg-red-100 flex items-center justify-center hover:bg-red-500"
              >
                <Trash2 className="w-3 h-3 text-red-600 hover:text-white" />
              </button>
            </div>
          )}
        </div>
      );
    }

    // Default view modes (grid, list, compact)
    return (
      <div
        ref={cardRef}
        className="group relative cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          backgroundColor: isHighlighted
            ? "#fef3c7"
            : isSelected
              ? "#eff6ff"
              : "#ffffff",
          borderRadius: cardStyle.borderRadius,
          border: isHighlighted
            ? "3px solid #f59e0b"
            : isSelected
              ? "3px solid #3b82f6"
              : "2px solid #d4a843",
          boxShadow: isHighlighted
            ? "0 0 20px rgba(245, 158, 11, 0.5)"
            : isSelected
              ? "0 4px 20px rgba(59, 130, 246, 0.3)"
              : "0 4px 12px rgba(0,0,0,0.1)",
          minHeight: cardStyle.minHeight,
          display: "flex",
          flexDirection: cardStyle.flexDirection,
        }}
      >
        {/* Selection Checkbox */}
        <SelectionCheckbox position="top-left" />
        {renderProcessControl(viewMode === "minimal")}

        {/* Quick Classify Button */}
        {!selectionMode && (
          <ClientQuickClassify
            clientId={client.id}
            clientName={client.name}
            currentCategoryId={client.category_id}
            currentTags={client.tags}
            categories={categories}
            allTags={allTags}
            onUpdate={() => {
              fetchClients();
              fetchCategoriesAndTags();
            }}
          />
        )}
        {/* Client Indicators - Top Right */}
        {showActions && (category || hasReminder || hasTask || hasMeeting) && (
          <div
            className="absolute top-2 right-2"
            style={{ display: "flex", gap: "4px", zIndex: 5 }}
          >
            {renderCategoryIndicator(20, 11)}
            {hasReminder && (
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  boxShadow: "0 0 10px rgba(16, 185, 129, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="יש תזכורות"
              >
                <Bell
                  style={{ width: "10px", height: "10px", color: "#ffffff" }}
                />
              </div>
            )}
            {hasTask && (
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "#2563eb",
                  boxShadow: "0 0 10px rgba(37, 99, 235, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="יש משימות"
              >
                <CheckSquare
                  style={{ width: "10px", height: "10px", color: "#ffffff" }}
                />
              </div>
            )}
            {hasMeeting && (
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="יש פגישות"
              >
                <Calendar
                  style={{ width: "12px", height: "12px", color: "#ffffff" }}
                />
              </div>
            )}
          </div>
        )}

        {/* Hover Action Buttons */}
        {renderMonthsStatusIcon()}

        {showActions && (
          <div
            className="absolute top-2 left-2 transition-opacity duration-200"
            style={{ display: "flex", gap: "4px", zIndex: 10 }}
          >
            <button
              onClick={(e) => handleEditClient(e, client.id)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#1e3a5f",
                border: "2px solid #d4a843",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              className="hover:bg-amber-500"
              title="עריכה"
            >
              <Pencil
                style={{ width: "14px", height: "14px", color: "#ffffff" }}
              />
            </button>
            <button
              onClick={(e) => handleDeleteClient(e, client.id)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#dc2626",
                border: "2px solid #dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              className="hover:bg-red-700"
              title="מחיקה"
            >
              <Trash2
                style={{ width: "14px", height: "14px", color: "#ffffff" }}
              />
            </button>
          </div>
        )}

        {/* Card Content */}
        <div
          style={{
            flex: 1,
            padding: viewMode === "list" ? "12px 16px" : "16px",
            display: "flex",
            flexDirection: viewMode === "list" ? "row" : "column",
            justifyContent: "space-between",
            alignItems: viewMode === "list" ? "center" : "stretch",
          }}
        >
          {/* Center Section - Name */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: viewMode === "list" ? "flex-start" : "center",
              padding: viewMode === "list" ? "0 16px" : "12px 0",
            }}
          >
            <h3
              style={{
                fontSize: viewMode === "compact" ? "16px" : "20px",
                fontWeight: "700",
                color: "#d4a843",
                textAlign: viewMode === "list" ? "right" : "center",
                lineHeight: "1.3",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <ClientNameWithCategory
                  clientName={client.name}
                  categoryId={client.category_id}
                  categories={categories}
                />
                {showActions && renderMonthsIndicator()}
              </span>
            </h3>
          </div>

          {/* Bottom Section - Contact Info */}
          {showActions && (
            <div
              style={{
                display: "flex",
                flexDirection: viewMode === "list" ? "row" : "column",
                gap: "6px",
              }}
            >
              {(isValidPhoneForDisplay(client.phone) || ((client as any).additional_phones?.length ?? 0) > 0) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#1e3a5f",
                  }}
                  dir="ltr"
                >
                  <PhoneWithExtras
                    phone={client.phone}
                    additionalPhones={(client as any).additional_phones}
                    fontSize={14}
                    iconSize={16}
                    color="#1e3a5f"
                  />
                </div>
              )}
              {client.email && viewMode !== "compact" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#1e3a5f",
                    ...(viewMode === "list" ? { marginInlineStart: "16px" } : {}),
                  }}
                >
                  <Mail
                    style={{ width: "16px", height: "16px", flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {client.email}
                  </span>
                </div>
              )}
            </div>
          )}
          {renderSelectedCategoryStage(viewMode === "compact" || viewMode === "list")}
        </div>
      </div>
    );
  };

  // No blocking spinner — show a thin animated top progress bar while loading.

  return (
    <AppLayout title="לקוחות">
      {/* Top progress bar — runs while fetching */}
      {(authLoading || isLoading) && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            zIndex: 9999,
            overflow: "hidden",
            background: "rgba(22, 44, 88, 0.08)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "40%",
              background:
                "linear-gradient(90deg, transparent 0%, #d8ac27 50%, transparent 100%)",
              animation: "clients-progress-slide 1.1s ease-in-out infinite",
            }}
          />
          <style>{`@keyframes clients-progress-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }`}</style>
        </div>
      )}
      {/* Page Layout - Header strip above framed content */}
      <div
        dir="rtl"
        style={{
          height: "calc(100vh - 100px)",
          display: "flex",
          flexDirection: "column",
          gap: "34px",
          overflow: "hidden",
        }}
      >
        {/* ═══ Compact Header — Row 1: Title + Buttons + Search ═══ */}
        <div
          className="group"
          style={{
            background: "linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%)",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: 0,
            border: "1.5px solid #d4a843",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Right side: Title + Action Buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexWrap: "wrap",
              }}
            >
              <Users
                style={{
                  width: "20px",
                  height: "20px",
                  color: "#fbbf24",
                  flexShrink: 0,
                }}
              />
              <h1
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#fff",
                  margin: 0,
                  whiteSpace: "nowrap",
                }}
              >
                לקוחות
              </h1>
              {/* Action buttons — icon-only circular style */}
              {(() => {
                const iconBtnBase: React.CSSProperties = {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "34px",
                  height: "34px",
                  backgroundColor: "transparent",
                  border: "1.5px solid #d4a843",
                  borderRadius: "50%",
                  color: "#d4a843",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  flexShrink: 0,
                };
                const activeStyle: React.CSSProperties = {
                  backgroundColor: "#d4a843",
                  color: "#1e3a5f",
                };
                const handleEnter = (e: React.MouseEvent<HTMLButtonElement>, isActive: boolean) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "#d4a843";
                    e.currentTarget.style.color = "#1e3a5f";
                  }
                };
                const handleLeave = (e: React.MouseEvent<HTMLButtonElement>, isActive: boolean) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#d4a843";
                  }
                };
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {/* Fixed controls near title: keep stable to prevent hover jumps */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      {pcEnabled("add-client") && (
                      <button
                        onClick={() => setIsAddClientDialogOpen(true)}
                        style={iconBtnBase}
                        onMouseEnter={(e) => handleEnter(e, false)}
                        onMouseLeave={(e) => handleLeave(e, false)}
                        title="הוסף לקוח חדש"
                        aria-label="הוסף לקוח חדש"
                      >
                        <UserPlus style={{ width: "16px", height: "16px" }} />
                      </button>
                      )}

                      {pcEnabled("view-presets") && (
                      <ViewPresetsMenu
                        current={{
                          viewMode,
                          minimalColumns,
                          sortBy: filters.sortBy,
                          showStagesView,
                          showStatisticsView,
                        }}
                        onApply={(state: ViewPresetState) => {
                          setViewMode(state.viewMode);
                          setMinimalColumns(state.minimalColumns);
                          setFilters((prev) => ({ ...prev, sortBy: state.sortBy }));
                          saveSortBy(state.sortBy);
                          setShowStagesView(state.showStagesView);
                          setShowStatisticsView(state.showStatisticsView);
                        }}
                      />
                      )}
                    </div>

                    <div
                      className="overflow-hidden invisible opacity-0 max-w-0 pointer-events-none transition-all duration-200 group-hover:visible group-hover:opacity-100 group-hover:max-w-[520px] group-hover:pointer-events-auto"
                      style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap" }}
                    >
                        <button
                          onClick={() => { pageCustomizer.setInitialTab("layout"); pageCustomizer.openPanel(); }}
                          style={iconBtnBase}
                          onMouseEnter={(e) => handleEnter(e, false)}
                          onMouseLeave={(e) => handleLeave(e, false)}
                          title="התאמה אישית של הדף (פריסה + פונקציות)"
                          aria-label="התאמה אישית של הדף"
                        >
                          <Settings style={{ width: "16px", height: "16px" }} />
                        </button>

                        {pcEnabled("goto-table") && (
                        <button
                          onClick={() => navigate("/datatable-pro")}
                          style={iconBtnBase}
                          onMouseEnter={(e) => handleEnter(e, false)}
                          onMouseLeave={(e) => handleLeave(e, false)}
                          title="עבור לטבלת לקוחות"
                          aria-label="עבור לטבלת לקוחות"
                        >
                          <Rows3 style={{ width: "16px", height: "16px" }} />
                        </button>
                        )}

                        {pcEnabled("bulk-select") && (
                        <button
                          onClick={toggleSelectionMode}
                          style={{ ...iconBtnBase, ...(selectionMode ? activeStyle : {}) }}
                          onMouseEnter={(e) => handleEnter(e, selectionMode)}
                          onMouseLeave={(e) => handleLeave(e, selectionMode)}
                          title={selectionMode ? "בטל בחירה מרובה" : "הפעל בחירה מרובה"}
                          aria-label={selectionMode ? "בטל בחירה מרובה" : "הפעל בחירה מרובה"}
                        >
                          <CheckSquare style={{ width: "16px", height: "16px" }} />
                        </button>
                        )}

                        {pcEnabled("stages-toggle") && (
                        <button
                          onClick={() => {
                            setShowStagesView(!showStagesView);
                            if (!showStagesView) setShowStatisticsView(false);
                          }}
                          style={{ ...iconBtnBase, ...(showStagesView ? activeStyle : {}) }}
                          onMouseEnter={(e) => handleEnter(e, showStagesView)}
                          onMouseLeave={(e) => handleLeave(e, showStagesView)}
                          title="תצוגה לפי שלבים"
                          aria-label="תצוגה לפי שלבים"
                        >
                          <Layers style={{ width: "16px", height: "16px" }} />
                        </button>
                        )}

                        {pcEnabled("stats-toggle") && (
                        <button
                          onClick={() => {
                            setShowStatisticsView(!showStatisticsView);
                            if (!showStatisticsView) setShowStagesView(false);
                          }}
                          style={{ ...iconBtnBase, ...(showStatisticsView ? activeStyle : {}) }}
                          onMouseEnter={(e) => handleEnter(e, showStatisticsView)}
                          onMouseLeave={(e) => handleLeave(e, showStatisticsView)}
                          title="סטטיסטיקות לקוחות"
                          aria-label="סטטיסטיקות לקוחות"
                        >
                          <BarChart3 style={{ width: "16px", height: "16px" }} />
                        </button>
                        )}

                        {pcEnabled("access-mgmt") && (isAdmin || isManager) && (
                          <button
                            onClick={() => {
                              setShowAccessView(!showAccessView);
                              if (!showAccessView) {
                                setShowStagesView(false);
                                setShowStatisticsView(false);
                              }
                            }}
                            style={{ ...iconBtnBase, ...(showAccessView ? activeStyle : {}) }}
                            onMouseEnter={(e) => handleEnter(e, showAccessView)}
                            onMouseLeave={(e) => handleLeave(e, showAccessView)}
                            title="ניהול גישות לפורטל"
                            aria-label="ניהול גישות לפורטל"
                          >
                            <Shield style={{ width: "16px", height: "16px" }} />
                          </button>
                        )}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Left side: Selection controls OR Search + View toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {selectionMode ? (
                <>
                  <button
                    onClick={selectAllClients}
                    style={{
                      height: "30px",
                      padding: "0 10px",
                      borderRadius: "15px",
                      backgroundColor:
                        selectedClients.size === filteredClients.length
                          ? "#3b82f6"
                          : "transparent",
                      border: "1.5px solid #3b82f6",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontSize: "11px",
                    }}
                    title={
                      selectedClients.size === filteredClients.length
                        ? "בטל בחירת הכל"
                        : "בחר הכל"
                    }
                  >
                    <CheckCheck
                      style={{
                        width: "14px",
                        height: "14px",
                        color:
                          selectedClients.size === filteredClients.length
                            ? "#fff"
                            : "#3b82f6",
                      }}
                    />
                    <span
                      style={{
                        color:
                          selectedClients.size === filteredClients.length
                            ? "#fff"
                            : "#3b82f6",
                        fontWeight: "500",
                      }}
                    >
                      {selectedClients.size === filteredClients.length
                        ? "בטל הכל"
                        : "בחר הכל"}
                    </span>
                  </button>
                  <span style={{ color: "#94a3b8", fontSize: "11px" }}>
                    ({selectedClients.size} נבחרו)
                  </span>

                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedClients.size === 0 || isDeleting}
                    style={{
                      height: "30px",
                      padding: "0 10px",
                      borderRadius: "15px",
                      backgroundColor:
                        selectedClients.size > 0 ? "#dc2626" : "transparent",
                      border: "1.5px solid #dc2626",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor:
                        selectedClients.size === 0 || isDeleting
                          ? "not-allowed"
                          : "pointer",
                      transition: "all 0.2s",
                      opacity: selectedClients.size === 0 ? 0.5 : 1,
                      fontSize: "11px",
                    }}
                    title="מחק נבחרים"
                  >
                    {isDeleting ? (
                      <Loader2
                        style={{
                          width: "14px",
                          height: "14px",
                          color: "#fff",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                    ) : (
                      <Trash2
                        style={{
                          width: "14px",
                          height: "14px",
                          color: selectedClients.size > 0 ? "#fff" : "#dc2626",
                        }}
                      />
                    )}
                    <span
                      style={{
                        color: selectedClients.size > 0 ? "#fff" : "#dc2626",
                        fontWeight: "500",
                      }}
                    >
                      מחק ({selectedClients.size})
                    </span>
                  </button>

                  <button
                    onClick={() => setIsBulkClassifyOpen(true)}
                    disabled={selectedClients.size === 0}
                    style={{
                      height: "30px",
                      padding: "0 10px",
                      borderRadius: "15px",
                      backgroundColor:
                        selectedClients.size > 0 ? "#8b5cf6" : "transparent",
                      border: "1.5px solid #8b5cf6",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor:
                        selectedClients.size === 0 ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      opacity: selectedClients.size === 0 ? 0.5 : 1,
                      fontSize: "11px",
                    }}
                    title="סווג נבחרים"
                  >
                    <Tag
                      style={{
                        width: "14px",
                        height: "14px",
                        color: selectedClients.size > 0 ? "#fff" : "#8b5cf6",
                      }}
                    />
                    <span
                      style={{
                        color: selectedClients.size > 0 ? "#fff" : "#8b5cf6",
                        fontWeight: "500",
                      }}
                    >
                      סווג ({selectedClients.size})
                    </span>
                  </button>

                  <button
                    onClick={() => setIsBulkStageOpen(true)}
                    disabled={selectedClients.size === 0}
                    style={{
                      height: "30px",
                      padding: "0 10px",
                      borderRadius: "15px",
                      backgroundColor:
                        selectedClients.size > 0 ? "#8b5cf6" : "transparent",
                      border: "1.5px solid #8b5cf6",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor:
                        selectedClients.size === 0 ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      opacity: selectedClients.size === 0 ? 0.5 : 1,
                      fontSize: "11px",
                    }}
                    title="הגדר שלב לנבחרים"
                  >
                    <Layers
                      style={{
                        width: "14px",
                        height: "14px",
                        color: selectedClients.size > 0 ? "#fff" : "#8b5cf6",
                      }}
                    />
                    <span
                      style={{
                        color: selectedClients.size > 0 ? "#fff" : "#8b5cf6",
                        fontWeight: "500",
                      }}
                    >
                      שלב ({selectedClients.size})
                    </span>
                  </button>

                  <button
                    onClick={() => setIsBulkConsultantOpen(true)}
                    disabled={selectedClients.size === 0}
                    style={{
                      height: "30px",
                      padding: "0 10px",
                      borderRadius: "15px",
                      backgroundColor:
                        selectedClients.size > 0 ? "#3b82f6" : "transparent",
                      border: "1.5px solid #3b82f6",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor:
                        selectedClients.size === 0 ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      opacity: selectedClients.size === 0 ? 0.5 : 1,
                      fontSize: "11px",
                    }}
                    title="הגדר יועץ לנבחרים"
                  >
                    <Users
                      style={{
                        width: "14px",
                        height: "14px",
                        color: selectedClients.size > 0 ? "#fff" : "#3b82f6",
                      }}
                    />
                    <span
                      style={{
                        color: selectedClients.size > 0 ? "#fff" : "#3b82f6",
                        fontWeight: "500",
                      }}
                    >
                      יועץ ({selectedClients.size})
                    </span>
                  </button>

                  <button
                    onClick={toggleSelectionMode}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: "transparent",
                      border: "1.5px solid #94a3b8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    className="hover:bg-gray-500/20"
                    title="בטל בחירה"
                  >
                    <X
                      style={{
                        width: "14px",
                        height: "14px",
                        color: "#94a3b8",
                      }}
                    />
                  </button>
                </>
              ) : (
                <>
                  {/* Features / Sparkles button */}
                  <div className="overflow-hidden invisible opacity-0 max-w-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-hover:max-w-[40px]">
                    <button
                      onClick={() => setShowFeaturesHelp(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "30px",
                        height: "30px",
                        backgroundColor: "transparent",
                        border: "1.5px solid #d4a843",
                        borderRadius: "50%",
                        color: "#d4a843",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#d4a843";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#d4a843";
                      }}
                      title="תכונות זמינות"
                      aria-label="תכונות זמינות"
                    >
                      <Sparkles style={{ width: "15px", height: "15px" }} />
                    </button>
                  </div>
                </>
              )}

              <div
                className={cn(
                  "flex h-10 items-center overflow-hidden rounded-full border text-sm font-bold shadow-sm transition",
                  processControlSettings.enabled
                    ? "border-[#d4a843] bg-[#d4a843] text-[#1e3a5f]"
                    : "border-[#d4a843] bg-transparent text-[#d4a843] hover:bg-[#d4a843]/10",
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    setProcessControlSettings({
                      ...processControlSettings,
                      enabled: !processControlSettings.enabled,
                    })
                  }
                  className="flex h-full items-center gap-2 px-4 transition hover:bg-white/15"
                  title={
                    processControlSettings.enabled
                      ? "הסתר מרכז שליטה בכרטיסי לקוחות"
                      : "הצג מרכז שליטה בכרטיסי לקוחות"
                  }
                  aria-pressed={processControlSettings.enabled}
                >
                  <Layers className="h-4 w-4" />
                  מרכז שליטה
                </button>

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="ml-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#1e3a5f]/20 bg-white/25 transition hover:scale-105 hover:bg-white/45"
                      title="הגדרות מרכז שליטה"
                      aria-label="הגדרות מרכז שליטה"
                    >
                      <Settings2 className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="end"
                    sideOffset={10}
                    collisionPadding={16}
                    className="w-72 resize-none overflow-visible rounded-2xl border border-[#d4a843] bg-white p-4 text-right shadow-2xl"
                    dir="rtl"
                  >
                    <div className="mb-4">
                      <div className="font-bold text-[#1e3a5f]">
                        הגדרות מרכז שליטה
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        ההגדרות יחולו על כל כרטיסי הלקוחות
                      </div>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <label className="mb-1.5 block font-semibold text-[#1e3a5f]">
                          מספר שלבים להצגה
                        </label>
                        <select
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3"
                          value={processControlSettings.stagesToShow}
                          onChange={(event) =>
                            setProcessControlSettings({
                              ...processControlSettings,
                              stagesToShow: Number(event.target.value),
                            })
                          }
                        >
                          {[1, 2, 3, 4, 5].map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block font-semibold text-[#1e3a5f]">
                          מספר משימות להצגה
                        </label>
                        <select
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3"
                          value={processControlSettings.tasksToShow}
                          onChange={(event) =>
                            setProcessControlSettings({
                              ...processControlSettings,
                              tasksToShow: Number(event.target.value),
                            })
                          }
                        >
                          {[1, 2, 3, 4, 5, 8, 10, 15, 20].map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>

                      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#fef9ee]/60 p-3">
                        <span>
                          <span className="block font-semibold text-[#1e3a5f]">
                            גלילה אנכית
                          </span>
                          <span className="mt-0.5 block text-[11px] text-slate-500">
                            הצג את הכמות שנבחרה וגלול לשאר המשימות
                          </span>
                        </span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0 accent-[#1e3a5f]"
                          checked={processControlSettings.verticalScroll !== false}
                          onChange={(event) =>
                            setProcessControlSettings({
                              ...processControlSettings,
                              verticalScroll: event.target.checked,
                            })
                          }
                        />
                      </label>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div
                className={cn(
                  "flex h-10 items-center overflow-hidden rounded-full border text-sm font-bold shadow-sm transition",
                  viewMode === "tasks"
                    ? "border-[#d4a843] bg-white text-[#1e3a5f]"
                    : "border-[#d4a843] bg-transparent text-[#d4a843]",
                )}
              >
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "tasks" ? "grid" : "tasks")}
                  className={cn(
                    "flex h-full items-center gap-2 px-4 transition",
                    viewMode === "tasks"
                      ? "bg-white hover:bg-[#fef9ee]"
                      : "hover:bg-[#d4a843]/10",
                  )}
                  aria-pressed={viewMode === "tasks"}
                  title="הצג רק שמות לקוחות, שלבים ומשימות פתוחות"
                >
                  <ClipboardList className="h-4 w-4" />
                  תצוגת משימות
                </button>

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="ml-1 flex h-6 w-6 items-center justify-center rounded-full border border-current/25 bg-white/10 transition hover:scale-105 hover:bg-white/25"
                      title="הגדרות תצוגת משימות"
                      aria-label="הגדרות תצוגת משימות"
                    >
                      <Settings2 className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="end"
                    sideOffset={10}
                    collisionPadding={16}
                    className="w-72 resize-none overflow-visible rounded-2xl border border-[#d4a843] bg-white p-4 text-right shadow-2xl"
                    dir="rtl"
                  >
                    <div className="mb-4">
                      <div className="font-bold text-[#1e3a5f]">הגדרות תצוגת משימות</div>
                      <div className="mt-1 text-xs text-slate-500">
                        אותן הגדרות משמשות גם את מרכז השליטה
                      </div>
                    </div>
                    <div className="space-y-4 text-sm">
                      <div>
                        <label className="mb-1.5 block font-semibold text-[#1e3a5f]">
                          מספר שלבים להצגה
                        </label>
                        <select
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3"
                          value={processControlSettings.stagesToShow}
                          onChange={(event) =>
                            setProcessControlSettings({
                              ...processControlSettings,
                              stagesToShow: Number(event.target.value),
                            })
                          }
                        >
                          {[1, 2, 3, 4, 5].map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block font-semibold text-[#1e3a5f]">
                          מספר משימות הנראות מיד
                        </label>
                        <select
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3"
                          value={processControlSettings.tasksToShow}
                          onChange={(event) =>
                            setProcessControlSettings({
                              ...processControlSettings,
                              tasksToShow: Number(event.target.value),
                            })
                          }
                        >
                          {[1, 2, 3, 4, 5, 8, 10, 15, 20].map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <label className="font-semibold text-[#1e3a5f]">
                            לקוחות בכל שורה
                          </label>
                          <span className="rounded-full bg-[#1e3a5f] px-2 py-0.5 text-[11px] font-bold text-white">
                            {processControlSettings.clientsPerRow ?? 3}
                          </span>
                        </div>
                        <select
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3"
                          value={processControlSettings.clientsPerRow ?? 3}
                          onChange={(event) =>
                            setProcessControlSettings({
                              ...processControlSettings,
                              clientsPerRow: Number(event.target.value),
                            })
                          }
                        >
                          {[1, 2, 3, 4, 5, 6].map((value) => (
                            <option key={value} value={value}>
                              {value} {value === 1 ? "לקוח — כרטיס רחב" : "לקוחות"}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-[11px] leading-4 text-slate-500">
                          ככל שמציגים יותר לקוחות בשורה, כל כרטיס נעשה צר יותר.
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-[#fef9ee]/60 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <label className="font-semibold text-[#1e3a5f]">
                            מהירות גלילת הלקוחות
                          </label>
                          <span className="text-[11px] font-bold text-[#1e3a5f]">
                            {Math.round(
                              (processControlSettings.pageScrollSpeed ?? 0.45) *
                                100,
                            )}
                            %
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.15"
                          max="1.5"
                          step="0.05"
                          value={processControlSettings.pageScrollSpeed ?? 0.45}
                          onChange={(event) =>
                            setProcessControlSettings({
                              ...processControlSettings,
                              pageScrollSpeed: Number(event.target.value),
                            })
                          }
                          className="h-2 w-full cursor-pointer accent-[#d4a843]"
                          aria-label="מהירות גלילת הלקוחות"
                        />
                        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                          <span>איטית</span>
                          <span>מהירה</span>
                        </div>
                      </div>
                      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#fef9ee]/60 p-3">
                        <span>
                          <span className="block font-semibold text-[#1e3a5f]">גלילה אנכית</span>
                          <span className="mt-0.5 block text-[11px] text-slate-500">
                            אפשר לגלול לכל יתר המשימות הפתוחות
                          </span>
                        </span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0 accent-[#1e3a5f]"
                          checked={processControlSettings.verticalScroll !== false}
                          onChange={(event) =>
                            setProcessControlSettings({
                              ...processControlSettings,
                              verticalScroll: event.target.checked,
                            })
                          }
                        />
                      </label>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search - compact */}
              {pcVisible("search") && pcEnabled("search-bar") && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <div className="overflow-hidden invisible opacity-0 max-w-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-hover:max-w-[40px]">
                  <button
                    onClick={() =>
                      setAutoJumpToFirstResult(!autoJumpToFirstResult)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "30px",
                      height: "30px",
                      backgroundColor: autoJumpToFirstResult
                        ? "#d4a843"
                        : "transparent",
                      border: "1.5px solid #d4a843",
                      borderRadius: "50%",
                      color: autoJumpToFirstResult ? "#1e3a5f" : "#d4a843",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!autoJumpToFirstResult) {
                        e.currentTarget.style.backgroundColor = "#d4a843";
                        e.currentTarget.style.color = "#1e3a5f";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!autoJumpToFirstResult) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#d4a843";
                      }
                    }}
                    title={
                      autoJumpToFirstResult
                        ? "קפיצה אוטומטית לתוצאה הראשונה פעילה"
                        : "קפיצה אוטומטית לתוצאה הראשונה כבויה"
                    }
                    aria-label="הפעל או כבה קפיצה אוטומטית לתוצאה הראשונה"
                  >
                    <Clock style={{ width: "15px", height: "15px" }} />
                  </button>
                </div>

                <div
                  style={{
                    position: "relative",
                    width: "220px",
                    maxWidth: "100%",
                  }}
                >
                  <Search
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "14px",
                      height: "14px",
                      color: "#d4a843",
                    }}
                  />
                  <Input
                    type="text"
                    placeholder="חיפוש לקוחות..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      paddingRight: "32px",
                      height: "30px",
                      fontSize: "12px",
                      backgroundColor: "#ffffff",
                      border: "1.5px solid #d4a843",
                      color: "#1e3a5f",
                    }}
                    className="placeholder:text-amber-600/50 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>

                {searchQuery.trim() !== "" && selectedSearchClient && (
                  <Badge
                    variant="outline"
                    style={{
                      height: "30px",
                      borderColor: "#f59e0b",
                      color: "#fbbf24",
                      backgroundColor: "rgba(245, 158, 11, 0.08)",
                      maxWidth: "280px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    תוצאה נבחרת: {selectedSearchClient.name}
                  </Badge>
                )}
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Framed Content - starts from classification tabs */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "3px solid #d4a843",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            padding: "20px 24px 24px",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >

        {/* ═══ Compact Row 2: Filter Strip ═══ */}
        {pcVisible("filter-strip") && pcEnabled("filter-strip") && (
        <div style={{ marginBottom: "18px" }}>
        <ClientsFilterStrip
          filters={filters}
          onFiltersChange={(newFilters) => {
            const selectedActivity =
              newFilters.paymentStatus
                ? "payments"
                : newFilters.hasTasks === true
                ? "tasks"
                : newFilters.hasReminders === true
                  ? "reminders"
                  : newFilters.hasMeetings === true
                    ? "meetings"
                    : null;
            if (selectedActivity) {
              setViewMode("tasks");
            }
            setFilters(newFilters);
            if (newFilters.sortBy !== filters.sortBy) {
              saveSortBy(newFilters.sortBy);
            }
            // Persist hidden classifications to cloud (legacy)
            if (
              JSON.stringify(newFilters.hiddenClassifications || []) !==
              JSON.stringify(filters.hiddenClassifications || [])
            ) {
              saveHiddenClassifications(newFilters.hiddenClassifications || []);
            }
            // Persist FULL filter state to cloud
            saveFullFilters((old) => ({
              ...old,
              stages: newFilters.stages,
              stageSelections: newFilters.stageSelections,
              stageTemplateIds: newFilters.stageTemplateIds,
              stageTaskFilters: newFilters.stageTaskFilters,
              dateFilter: newFilters.dateFilter,
              hasReminders: newFilters.hasReminders,
              hasTasks: newFilters.hasTasks,
              hasMeetings: newFilters.hasMeetings,
              paymentStatus: newFilters.paymentStatus,
              recentClientsDays: newFilters.recentClientsDays,
              recentClientsSortMode: newFilters.recentClientsSortMode,
              recentActivityTypes: newFilters.recentActivityTypes,
              categories: newFilters.categories,
              tags: newFilters.tags,
              hiddenClassifications: newFilters.hiddenClassifications,
              monthAgeRanges: newFilters.monthAgeRanges,
              exactMonth: newFilters.exactMonth,
              customDateRange: newFilters.customDateRange,
              activeDateTabId: newFilters.activeDateTabId,
              consultantIds: newFilters.consultantIds,
              consultantProfessions: newFilters.consultantProfessions,
              sortBy: newFilters.sortBy,
            }));
          }}
          dateRangeTabs={dateRangeTabs}
          onDateRangeTabsChange={setDateRangeTabs}
          clientsWithReminders={clientsWithReminders}
          clientsWithTasks={clientsWithTasks}
          clientsWithMeetings={clientsWithMeetings}
          paymentSummary={paymentSummary}
          recentClientsCount={recentClientsCount}
          hasRecentCustomOrder={recentClientPersonalOrder.length > 0}
          onResetRecentCustomOrder={() => {
            setRecentClientPersonalOrder([]);
            toast({
              title: "הסדר האישי אופס",
              description: "הלקוחות מוצגים שוב לפי הפעילות האחרונה.",
            });
          }}
          categories={categories}
          categoryCounts={categoryCounts}
          stageCounts={stageCounts}
          monthAgeCounts={monthAgeCounts}
          allTags={allTags}
          tagColors={Object.fromEntries(
            tagDefinitions.map((tag) => [tag.name, tag.color]),
          )}
          visibleClientsCount={filteredClients.length}
          onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
          onUpdate={() => {
            fetchClients();
            fetchCategoriesAndTags();
          }}
        />
        </div>
        )}

        {/* Statistics View - When Enabled */}
        {showAccessView ? (
          <div className="flex-1 overflow-auto">
            <React.Suspense fallback={<Loader2 className="m-8 h-6 w-6 animate-spin" />}>
              <ClientAccessSection />
            </React.Suspense>
          </div>
        ) : showStatisticsView && pcVisible("stats-view") ? (
          <div className="flex-1 border rounded-lg bg-card overflow-hidden">
            <React.Suspense fallback={<Loader2 className="m-8 h-6 w-6 animate-spin" />}>
              <ClientsStatisticsView
                clients={clients}
                onClose={() => setShowStatisticsView(false)}
              />
            </React.Suspense>
          </div>
        ) : showStagesView && pcVisible("stages-view") ? (
          <React.Suspense fallback={<Loader2 className="m-8 h-6 w-6 animate-spin" />}>
            <ClientsByStageView className="flex-1" />
          </React.Suspense>
        ) : pcVisible("main-grid") ? (
          <>
            {/* Clients Grid */}
            {/* Minimal View Column Selector */}
            {viewMode === "minimal" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                  padding: "12px 16px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                    fontWeight: "500",
                  }}
                >
                  מספר עמודות:
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[2, 3].map((cols) => (
                    <button
                      key={cols}
                      onClick={() => setMinimalColumns(cols as 2 | 3)}
                      style={{
                        padding: "6px 16px",
                        borderRadius: "8px",
                        border:
                          minimalColumns === cols
                            ? "2px solid #d4a843"
                            : "1px solid #cbd5e1",
                        backgroundColor:
                          minimalColumns === cols ? "#1e3a5f" : "#ffffff",
                        color: minimalColumns === cols ? "#d4a843" : "#64748b",
                        fontWeight: "600",
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clients Content Area - Scrollable */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "row",
                gap: "22px",
                paddingTop: "8px",
                overflow: "hidden",
              }}
            >
              {/* Main Content Area */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {filteredClients.length === 0 ? (
                  isLoading ? null : (
                    <div style={{ textAlign: "center", padding: "64px 0" }}>
                      <Users
                        style={{
                          width: "64px",
                          height: "64px",
                          color: "#cbd5e1",
                          margin: "0 auto 16px",
                        }}
                      />
                      <p
                        style={{
                          fontSize: "20px",
                          color: "#64748b",
                          fontWeight: "500",
                        }}
                      >
                        {searchQuery ||
                        filters.stages.length > 0 ||
                        filters.dateFilter !== "all" ||
                        filters.hasReminders ||
                        filters.hasTasks ||
                        filters.hasMeetings
                          ? "לא נמצאו לקוחות התואמים לסינון"
                          : "אין לקוחות במערכת"}
                      </p>
                    </div>
                  )
                ) : (
                  <>
                    {/* Pagination Info Bar removed per user request */}

                    <div
                      ref={scrollContainerRef}
                      style={{
                        flex: 1,
                        minHeight: 0,
                        display:
                          viewMode === "list"
                            ? "flex"
                            : viewMode === "minimal"
                              ? "grid"
                              : "grid",
                        flexDirection:
                          viewMode === "list" ? "column" : undefined,
                        gridTemplateColumns:
                          viewMode === "minimal"
                            ? `repeat(${minimalColumns}, 1fr)`
                            : viewMode === "portrait"
                              ? "repeat(auto-fill, minmax(160px, 1fr))"
                              : viewMode === "cards"
                                ? "repeat(auto-fill, minmax(320px, 1fr))"
                                : viewMode === "tasks"
                                  ? `repeat(${Math.min(
                                      6,
                                      Math.max(
                                        1,
                                        processControlSettings.clientsPerRow ??
                                          3,
                                      ),
                                    )}, minmax(0, 1fr))`
                                : viewMode === "luxury"
                                  ? "repeat(auto-fill, minmax(280px, 1fr))"
                                  : viewMode === "compact"
                                    ? "repeat(auto-fill, minmax(200px, 1fr))"
                                    : "repeat(auto-fill, minmax(280px, 1fr))",
                        gap:
                          viewMode === "list"
                            ? "12px"
                            : viewMode === "minimal"
                              ? "10px"
                              : viewMode === "portrait"
                                ? "16px"
                                : "20px",
                        // גלילה אנכית
                        overflowY: "auto",
                        overflowX: "hidden",
                        scrollBehavior: "auto",
                        alignContent: "flex-start",
                      }}
                    >
                      {filteredClients
                        .slice(0, displayedCount)
                        .map((client) => (
                          <ContextMenu key={client.id}>
                            <ContextMenuTrigger asChild>
                              <div
                                draggable={personalRecentOrderingActive}
                                onDragStart={(event) => {
                                  if (!personalRecentOrderingActive) return;
                                  setDraggedRecentClientId(client.id);
                                  event.dataTransfer.effectAllowed = "move";
                                  event.dataTransfer.setData(
                                    "text/plain",
                                    client.id,
                                  );
                                }}
                                onDragOver={(event) => {
                                  if (
                                    !personalRecentOrderingActive ||
                                    draggedRecentClientId === client.id
                                  ) {
                                    return;
                                  }
                                  event.preventDefault();
                                  event.dataTransfer.dropEffect = "move";
                                  setRecentClientDropTargetId(client.id);
                                }}
                                onDragLeave={(event) => {
                                  if (
                                    !event.currentTarget.contains(
                                      event.relatedTarget as Node | null,
                                    )
                                  ) {
                                    setRecentClientDropTargetId((current) =>
                                      current === client.id ? null : current,
                                    );
                                  }
                                }}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  handleRecentClientDrop(client.id);
                                }}
                                onDragEnd={() => {
                                  setDraggedRecentClientId(null);
                                  setRecentClientDropTargetId(null);
                                }}
                                className={cn(
                                  "relative rounded-xl transition-all",
                                  personalRecentOrderingActive &&
                                    "cursor-grab active:cursor-grabbing",
                                  draggedRecentClientId === client.id &&
                                    "opacity-45",
                                  recentClientDropTargetId === client.id &&
                                    draggedRecentClientId !== client.id &&
                                    "ring-4 ring-[#d4a843]/60 ring-offset-2",
                                )}
                                style={
                                  viewMode === "tasks"
                                    ? {
                                        contentVisibility: "auto",
                                        containIntrinsicSize: "320px",
                                      }
                                    : undefined
                                }
                              >
                                <ClientCard client={client} />
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent
                              className="w-56"
                              style={{ direction: "rtl" }}
                            >
                              <ContextMenuItem
                                onClick={() =>
                                  navigate(`/client-profile/${client.id}`)
                                }
                                className="gap-2 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                צפה בפרופיל
                              </ContextMenuItem>
                              <ContextMenuItem
                                onClick={() =>
                                  navigate(
                                    `/client-profile/${client.id}?edit=true`,
                                  )
                                }
                                className="gap-2 cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                                ערוך לקוח
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              {client.phone && (
                                <ContextMenuItem
                                  onClick={() =>
                                    copyToClipboard(client.phone!, "מספר טלפון")
                                  }
                                  className="gap-2 cursor-pointer"
                                >
                                  <Copy className="w-4 h-4" />
                                  העתק טלפון
                                </ContextMenuItem>
                              )}
                              {client.email && (
                                <ContextMenuItem
                                  onClick={() =>
                                    copyToClipboard(client.email!, "כתובת מייל")
                                  }
                                  className="gap-2 cursor-pointer"
                                >
                                  <Copy className="w-4 h-4" />
                                  העתק מייל
                                </ContextMenuItem>
                              )}
                              {(client.phone || client.email) && (
                                <ContextMenuSeparator />
                              )}
                              <ContextMenuItem
                                onClick={() =>
                                  handleStartSelectionWithClient(client.id)
                                }
                                className="gap-2 cursor-pointer"
                              >
                                <CheckCheck className="w-4 h-4" />
                                בחר למחיקה מרובה
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem
                                onClick={() =>
                                  handleContextDeleteClient(client.id)
                                }
                                className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                מחק לקוח
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))}
                      {/* Infinite Scroll Trigger - inside scroll container */}
                      {displayedCount < filteredClients.length && (
                        <div
                          ref={loadMoreRef}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "24px",
                            gap: "8px",
                            width: "100%",
                            gridColumn:
                              viewMode !== "list" ? "1 / -1" : undefined,
                          }}
                        >
                          {isLoadingMore ? null : (

                            <span
                              style={{ color: "#94a3b8", fontSize: "14px" }}
                            >
                              גלול למטה לטעינת עוד{" "}
                              {Math.min(
                                PAGE_SIZE,
                                filteredClients.length - displayedCount,
                              )}{" "}
                              לקוחות
                            </span>
                          )}
                        </div>
                      )}

                      {/* Show "All loaded" message when done */}
                      {displayedCount >= filteredClients.length &&
                        filteredClients.length > PAGE_SIZE && (
                          <div
                            style={{
                              textAlign: "center",
                              padding: "16px",
                              color: "#94a3b8",
                              fontSize: "14px",
                              width: "100%",
                              gridColumn:
                                viewMode !== "list" ? "1 / -1" : undefined,
                            }}
                          >
                            ✓ כל {filteredClients.length} הלקוחות נטענו
                          </div>
                        )}
                    </div>
                  </>
                )}
              </div>
              {/* End of Main Content Area */}
            </div>
            {/* End of Clients Content Area with Sidebar */}
          </>
        ) : null}
        </div>
      </div>
      {/* End of Main Container */}

      {/* Add Client Dialog */}
      <Dialog
        open={isAddClientDialogOpen}
        onOpenChange={setIsAddClientDialogOpen}
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          dir="rtl"
        >
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-right">
              <UserPlus className="w-5 h-5 text-green-500" />
              הוספת לקוח חדש
            </DialogTitle>
          </DialogHeader>

          <div
            className="space-y-4 py-2 overflow-y-auto flex-1 pl-2"
            style={{ maxHeight: "calc(90vh - 160px)" }}
          >
            {/* פרטים בסיסיים */}
            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-right">
                שם לקוח *
              </Label>
              <Input
                id="client-name"
                value={newClientForm.name}
                onChange={(e) =>
                  setNewClientForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="הכנס שם לקוח..."
                className="text-right"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newClientForm.name.trim()) {
                    handleAddClient();
                  }
                }}
              />
            </div>

            {isVisible("email") && (
              <div className="space-y-2">
                <Label htmlFor="client-email" className="text-right">
                  אימייל
                </Label>
                <Input
                  id="client-email"
                  type="email"
                  value={newClientForm.email}
                  onChange={(e) =>
                    setNewClientForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="example@email.com"
                  className="text-left"
                  dir="ltr"
                />
              </div>
            )}

            {isVisible("phone") && (
              <div className="space-y-2">
                <Label htmlFor="client-phone" className="text-right">
                  טלפון
                </Label>
                <Input
                  id="client-phone"
                  type="tel"
                  value={newClientForm.phone}
                  onChange={(e) =>
                    setNewClientForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="050-000-0000"
                  className="text-left"
                  dir="ltr"
                />
              </div>
            )}

            {/* כתובת ומיקום */}
            {(isVisible("street") || isVisible("moshav")) && (
              <div className="border-t pt-4 mt-2">
                <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                  כתובת ומיקום
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {isVisible("street") && (
                    <SmartComboField
                      label="רחוב"
                      value={newClientForm.street}
                      onChange={(v) =>
                        setNewClientForm((prev) => ({ ...prev, street: v }))
                      }
                      placeholder="שם הרחוב"
                      fieldColumn="street"
                    />
                  )}
                  {isVisible("moshav") && (
                    <SmartComboField
                      label="מושב / ישוב"
                      value={newClientForm.moshav}
                      onChange={(v) =>
                        setNewClientForm((prev) => ({ ...prev, moshav: v }))
                      }
                      placeholder="שם המושב"
                      fieldColumn="moshav"
                    />
                  )}
                </div>
              </div>
            )}

            {/* שדות נדל"ן */}
            {(isVisible("idNumber") ||
              isVisible("taba") ||
              isVisible("gush") ||
              isVisible("helka") ||
              isVisible("migrash")) && (
              <div className="border-t pt-4 mt-2">
                <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                  פרטי נדל"ן (אופציונלי)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {isVisible("idNumber") && (
                    <div className="space-y-1">
                      <Label
                        htmlFor="client-id-number"
                        className="text-right text-xs"
                      >
                        ת.ז / ח.פ
                      </Label>
                      <Input
                        id="client-id-number"
                        value={newClientForm.idNumber}
                        onChange={(e) =>
                          setNewClientForm((prev) => ({
                            ...prev,
                            idNumber: e.target.value,
                          }))
                        }
                        placeholder="תעודת זהות"
                        className="text-right"
                      />
                    </div>
                  )}
                  {isVisible("taba") && (
                    <SmartComboField
                      label='תב"ע'
                      value={newClientForm.taba}
                      onChange={(v) =>
                        setNewClientForm((prev) => ({ ...prev, taba: v }))
                      }
                      placeholder="תב''ע"
                      fieldColumn="taba"
                    />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {isVisible("gush") && (
                    <SmartComboField
                      label="גוש"
                      value={newClientForm.gush}
                      onChange={(v) =>
                        setNewClientForm((prev) => ({ ...prev, gush: v }))
                      }
                      placeholder="גוש"
                      fieldColumn="gush"
                    />
                  )}
                  {isVisible("helka") && (
                    <SmartComboField
                      label="חלקה"
                      value={newClientForm.helka}
                      onChange={(v) =>
                        setNewClientForm((prev) => ({ ...prev, helka: v }))
                      }
                      placeholder="חלקה"
                      fieldColumn="helka"
                    />
                  )}
                  {isVisible("migrash") && (
                    <SmartComboField
                      label="מגרש"
                      value={newClientForm.migrash}
                      onChange={(v) =>
                        setNewClientForm((prev) => ({ ...prev, migrash: v }))
                      }
                      placeholder="מגרש"
                      fieldColumn="migrash"
                    />
                  )}
                </div>
              </div>
            )}

            {/* ועד האגודה */}
            {(isVisible("agudaAddress") || isVisible("agudaEmail")) && (
              <div className="border-t pt-4 mt-2">
                <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                  ועד האגודה
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {isVisible("agudaAddress") && (
                    <SmartComboField
                      label="כתובת ועד האגודה"
                      value={newClientForm.agudaAddress}
                      onChange={(v) =>
                        setNewClientForm((prev) => ({
                          ...prev,
                          agudaAddress: v,
                        }))
                      }
                      placeholder="כתובת"
                      fieldColumn="aguda_address"
                    />
                  )}
                  {isVisible("agudaEmail") && (
                    <SmartComboField
                      label="מייל ועד האגודה"
                      value={newClientForm.agudaEmail}
                      onChange={(v) =>
                        setNewClientForm((prev) => ({ ...prev, agudaEmail: v }))
                      }
                      placeholder="email@example.com"
                      fieldColumn="aguda_email"
                      dir="ltr"
                      type="email"
                    />
                  )}
                </div>
              </div>
            )}

            {/* ועד המושב */}
            {(isVisible("vaadMoshavAddress") ||
              isVisible("vaadMoshavEmail")) && (
              <div className="border-t pt-4 mt-2">
                <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                  ועד המושב
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {isVisible("vaadMoshavAddress") && (
                    <SmartComboField
                      label="כתובת ועד המושב"
                      value={newClientForm.vaadMoshavAddress}
                      onChange={(v) =>
                        setNewClientForm((prev) => ({
                          ...prev,
                          vaadMoshavAddress: v,
                        }))
                      }
                      placeholder="כתובת"
                      fieldColumn="vaad_moshav_address"
                    />
                  )}
                  {isVisible("vaadMoshavEmail") && (
                    <SmartComboField
                      label="מייל ועד המושב"
                      value={newClientForm.vaadMoshavEmail}
                      onChange={(v) =>
                        setNewClientForm((prev) => ({
                          ...prev,
                          vaadMoshavEmail: v,
                        }))
                      }
                      placeholder="email@example.com"
                      fieldColumn="vaad_moshav_email"
                      dir="ltr"
                      type="email"
                    />
                  )}
                </div>
              </div>
            )}

            {/* שדות מותאמים אישית */}
            <CustomFieldsSection
              definitions={customFieldDefs}
              values={customFieldValues}
              onChange={setCustomFieldValues}
              onAddField={addCustomField}
              onDeleteField={deleteCustomField}
              onUpdateField={updateCustomField}
              isLoading={customFieldsLoading}
            />
          </div>

          <DialogFooter className="flex-row-reverse gap-2 shrink-0 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddClientDialogOpen(false);
                resetAddClientForm();
              }}
            >
              ביטול
            </Button>
            <Button
              onClick={handleAddClient}
              disabled={!newClientForm.name.trim() || isAddingClient}
              className="bg-green-600 hover:bg-green-700"
            >
              {isAddingClient ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  מוסיף...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  הוסף לקוח
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Classify Dialog */}
      {isBulkClassifyOpen && (
        <React.Suspense fallback={null}>
          <BulkClassifyDialog
            isOpen
            onClose={() => setIsBulkClassifyOpen(false)}
            selectedClientIds={Array.from(selectedClients)}
            categories={categories}
            allTags={allTags}
            onUpdate={() => {
              fetchClients();
              fetchCategoriesAndTags();
              setSelectedClients(new Set());
              setSelectionMode(false);
            }}
          />
        </React.Suspense>
      )}

      {/* Bulk Stage Dialog */}
      {isBulkStageOpen && (
        <React.Suspense fallback={null}>
          <BulkStageDialog
            isOpen
            onClose={() => setIsBulkStageOpen(false)}
            selectedClientIds={Array.from(selectedClients)}
            onUpdate={() => {
              fetchClients();
              setSelectedClients(new Set());
              setSelectionMode(false);
            }}
          />
        </React.Suspense>
      )}

      {/* Bulk Consultant Dialog */}
      {isBulkConsultantOpen && (
        <React.Suspense fallback={null}>
          <BulkConsultantDialog
            isOpen
            onClose={() => setIsBulkConsultantOpen(false)}
            selectedClientIds={Array.from(selectedClients)}
            onUpdate={() => {
              fetchClients();
              setSelectedClients(new Set());
              setSelectionMode(false);
            }}
          />
        </React.Suspense>
      )}

      {/* Category & Tags Manager Dialog */}
      {isCategoryManagerOpen && (
        <React.Suspense fallback={null}>
          <CategoryTagsManager
            isOpen
            onClose={() => setIsCategoryManagerOpen(false)}
            categories={categories}
            allTags={allTags}
            tagDefinitions={tagDefinitions}
            initialTab="tags"
            onTagDefinitionsChange={(definitions) => {
              storedTagDefinitionsRef.current = definitions;
              setTagDefinitions(definitions);
              setAllTags(definitions.map((tag) => tag.name).sort());
              setStoredTagDefinitions(definitions);
            }}
            onUpdate={() => {
              fetchClients();
              fetchCategoriesAndTags();
            }}
          />
        </React.Suspense>
      )}

      {/* Duplicate Detection Dialog */}
      <AlertDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
      >
        <AlertDialogContent dir="rtl" className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              נמצא לקוח דומה במערכת
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right space-y-4">
              <p className="text-base">
                נמצא לקוח עם פרטים דומים. מה תרצה לעשות?
              </p>

              {duplicateClient && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    לקוח קיים:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">שם:</span>{" "}
                      <span className="font-medium">
                        {duplicateClient.name}
                      </span>
                    </div>
                    {duplicateClient.email && (
                      <div>
                        <span className="text-muted-foreground">אימייל:</span>{" "}
                        <span className="font-medium">
                          {duplicateClient.email}
                        </span>
                      </div>
                    )}
                    {duplicateClient.phone && (
                      <div>
                        <span className="text-muted-foreground">טלפון:</span>{" "}
                        <span className="font-medium">
                          {duplicateClient.phone}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">סטטוס:</span>{" "}
                      <Badge variant="outline" className="mr-1">
                        {duplicateClient.status === "active"
                          ? "פעיל"
                          : duplicateClient.status === "pending"
                            ? "ממתין"
                            : "לא פעיל"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {pendingClientData && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    לקוח חדש שמנסים להוסיף:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">שם:</span>{" "}
                      <span className="font-medium">
                        {pendingClientData.name}
                      </span>
                    </div>
                    {pendingClientData.email && (
                      <div>
                        <span className="text-muted-foreground">אימייל:</span>{" "}
                        <span className="font-medium">
                          {pendingClientData.email}
                        </span>
                      </div>
                    )}
                    {pendingClientData.phone && (
                      <div>
                        <span className="text-muted-foreground">טלפון:</span>{" "}
                        <span className="font-medium">
                          {pendingClientData.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 sm:flex-row-reverse">
            <Button
              variant="default"
              onClick={handleOverwriteDuplicate}
              disabled={isAddingClient}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              {isAddingClient ? "מעדכן..." : "עדכן קיים (Overwrite)"}
            </Button>
            <Button
              variant="outline"
              onClick={handleAddAnyway}
              disabled={isAddingClient}
            >
              <UserPlus className="h-4 w-4 ml-2" />
              הוסף בכל זאת
            </Button>
            <AlertDialogCancel onClick={handleSkipDuplicate}>
              <X className="h-4 w-4 ml-2" />
              בטל (Skip)
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Features Help Dialog */}
      <Dialog open={showFeaturesHelp} onOpenChange={setShowFeaturesHelp}>
        <DialogContent
          dir="rtl"
          style={{ maxWidth: "900px", maxHeight: "85vh", overflow: "auto" }}
        >
          <DialogHeader>
            <DialogTitle
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#d4a843",
              }}
            >
              <Settings style={{ width: "24px", height: "24px" }} />
              תכונות זמינות
            </DialogTitle>
          </DialogHeader>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "24px",
              padding: "16px 0",
            }}
          >
            {/* תכונות ליבה */}
            <div>
              <h3
                style={{
                  color: "#16a34a",
                  fontWeight: "600",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Check style={{ width: "18px", height: "18px" }} />
                תכונות ליבה
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  fontSize: "14px",
                  color: "#374151",
                  lineHeight: "1.8",
                }}
              >
                <li>• מיון רב-עמודות (Shift+Click)</li>
                <li>• סינון חכם לכל סוג נתון</li>
                <li>• חיפוש גלובלי מהיר</li>
                <li>• עימוד עם בחירת גודל</li>
                <li>• בחירת שורות בודדת/מרובה</li>
              </ul>
            </div>

            {/* תכונות מתקדמות */}
            <div>
              <h3
                style={{
                  color: "#16a34a",
                  fontWeight: "600",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Check style={{ width: "18px", height: "18px" }} />
                תכונות מתקדמות
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  fontSize: "14px",
                  color: "#374151",
                  lineHeight: "1.8",
                }}
              >
                <li>• עריכת תאים Inline - לחץ על תא לעריכה</li>
                <li>• הוספת שורות - כפתור "הוסף שורה"</li>
                <li>• הוספת עמודות - כפתור "הוסף עמודה"</li>
                <li>• Undo/Redo - כפתורי ביטול/חזור</li>
                <li>• גרירת שורות - חצים להזזת שורות</li>
                <li>• מחיקת שורות - בחר ולחץ מחק</li>
                <li>• שינוי גודל עמודות</li>
                <li>• הסתרה/הצגת עמודות</li>
              </ul>
            </div>

            {/* ביצועים ו-UX */}
            <div>
              <h3
                style={{
                  color: "#16a34a",
                  fontWeight: "600",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Check style={{ width: "18px", height: "18px" }} />
                ביצועים ו-UX
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  fontSize: "14px",
                  color: "#374151",
                  lineHeight: "1.8",
                }}
              >
                <li>• Virtual Scrolling לאלפי שורות</li>
                <li>• ניווט מקלדת מלא</li>
                <li>• RTL מושלם</li>
                <li>• Loading Skeletons</li>
                <li>• יצוא CSV, Excel, PDF</li>
                <li>• הרחבת שורה לפרטים</li>
                <li>• שורת סיכום (סה"כ, ממוצע)</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowFeaturesHelp(false)}
              variant="outline"
            >
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickAddTask
        open={clientCardQuickCreate?.kind === "tasks"}
        onOpenChange={(open) => {
          if (!open) setClientCardQuickCreate(null);
        }}
        onSubmit={handleCreateClientTask}
        clients={clients}
        initialData={quickCreateInitialData}
      />

      <QuickAddMeeting
        open={clientCardQuickCreate?.kind === "meetings"}
        onOpenChange={(open) => {
          if (!open) setClientCardQuickCreate(null);
        }}
        onSubmit={handleCreateClientMeeting}
        clients={clients}
        initialData={quickCreateInitialData}
      />

      <AddReminderDialog
        open={clientCardQuickCreate?.kind === "reminders"}
        onOpenChange={(open) => {
          if (!open) {
            setClientCardQuickCreate(null);
            void fetchFilterData();
          }
        }}
        entityType="client"
        entityId={clientCardQuickCreate?.clientId}
        initialValues={reminderQuickCreateInitialValues}
      />

      <Dialog
        open={clientCardQuickCreate?.kind === "process"}
        onOpenChange={(open) => {
          if (!open) {
            setClientCardQuickCreate(null);
            setStageTaskTitle("");
            setStageTaskStageId("");
          }
        }}
      >
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              הוספת משימה לשלב — {clientCardQuickCreate?.clientName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="client-card-stage-select">שלב</Label>
              <select
                id="client-card-stage-select"
                value={stageTaskStageId}
                onChange={(event) => setStageTaskStageId(event.target.value)}
                className="h-10 w-full rounded-lg border border-[#d4a843]/60 bg-white px-3 text-right text-[#1e3a5f]"
              >
                <option value="">בחר שלב</option>
                {[
                  ...(processStagesByClient.get(
                    clientCardQuickCreate?.clientId || "",
                  ) || []),
                ]
                  .sort(
                    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
                  )
                  .map((stage) => (
                    <option key={stage.id} value={stage.stage_id}>
                      {stage.stage_name}
                      {stage.is_completed ? " — הושלם" : ""}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-card-stage-task-title">שם המשימה</Label>
              <Input
                id="client-card-stage-task-title"
                value={stageTaskTitle}
                onChange={(event) => setStageTaskTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleCreateClientStageTask();
                  }
                }}
                placeholder="לדוג: קבלת מסמכים מהלקוח"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              onClick={() => void handleCreateClientStageTask()}
              disabled={
                isCreatingClientCardItem ||
                !stageTaskStageId ||
                !stageTaskTitle.trim()
              }
              className="gap-2"
            >
              {isCreatingClientCardItem ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              הוסף משימה לשלב
            </Button>
            <Button
              variant="outline"
              onClick={() => setClientCardQuickCreate(null)}
              disabled={isCreatingClientCardItem}
            >
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Customizer Panel (פריסה + פונקציות) */}
      <PageCustomizerPanel ctl={pageCustomizer} title="התאמה אישית של עמוד הלקוחות" />
    </AppLayout>
  );
}
