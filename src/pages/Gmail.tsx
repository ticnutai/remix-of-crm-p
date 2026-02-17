// Gmail Page - Email management with Google Gmail integration
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import DOMPurify from "dompurify";
import { AppLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Mail,
  RefreshCw,
  Star,
  StarOff,
  ExternalLink,
  User,
  Clock,
  Search,
  Inbox,
  Send,
  Archive,
  Trash2,
  Settings,
  PenSquare,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Tag,
  Filter,
  MoreVertical,
  Reply,
  ReplyAll,
  Forward,
  Paperclip,
  AlertCircle,
  CheckCircle,
  Circle,
  MailOpen,
  MailPlus,
  FolderOpen,
  Folder,
  Building2,
  Calendar,
  Clock4,
  Users,
  FileText,
  X,
  Plus,
  Eye,
  EyeOff,
  Bookmark,
  Flag,
  Bell,
  BellOff,
  LayoutGrid,
  LayoutList,
  Rows3,
  Maximize2,
  Minimize2,
  Grid3X3,
  MessageSquare,
  Sparkles,
  Download,
  File,
  Image as ImageIcon,
  Film,
  Volume2,
  FileSpreadsheet,
  Printer,
  ShieldAlert,
  BellRing,
  VolumeX,
  Undo2,
  Timer,
  GripVertical,
  Keyboard,
} from "lucide-react";
import {
  useGmailIntegration,
  GmailMessage,
  EmailAttachment,
} from "@/hooks/useGmailIntegration";
import { useGoogleServices } from "@/hooks/useGoogleServices";
import { useEmailActionsOptimistic } from "@/hooks/useEmailActionsOptimistic";
import { useGmailCache } from "@/hooks/useGmailCache";
import { useEmailBodyCache } from "@/hooks/useEmailBodyCache";
import { useGmailNotifications } from "@/hooks/useGmailNotifications";
import { format, isToday, isYesterday, isThisWeek, isSameDay } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmailMetadata } from "@/hooks/useEmailMetadata";
import { useToast } from "@/hooks/use-toast";
import { useTasksOptimized as useTasks } from "@/hooks/useTasksOptimized";
import { useMeetingsOptimized as useMeetings } from "@/hooks/useMeetingsOptimized";
import { QuickAddTask } from "@/components/layout/sidebar-tasks/QuickAddTask";
import { QuickAddMeeting } from "@/components/layout/sidebar-tasks/QuickAddMeeting";
import {
  EmailQuickActions,
  EmailSmartSuggestions,
  ComposeEmailDialog,
  EmailThreadChat,
  ClientEmailsDialog,
  EmailDateNavigator,
  FloatingDateIndicator,
  LoadMoreTrigger,
  DateSeparator,
  useScrollDateTracker,
  EmailFoldersPanel,
  QuickClassifyButton,
  GmailSidebar,
  LabelManagerDialog,
  EmailReminderDialog,
  EmailNoteDialog,
  KeyboardShortcutsDialog,
  UndoSendBar,
  BulkActionsBar,
  EmailListItem,
  EmailDetailView,
  AdvancedSearchPanel,
  EmailSenderChatView,
  DEFAULT_LABELS as IMPORTED_DEFAULT_LABELS,
  PRIORITY_CONFIG as IMPORTED_PRIORITY_CONFIG,
  type Client,
  type EmailLabel,
  type Priority,
} from "@/components/gmail";
import { EmailDndProvider } from "@/components/gmail/EmailDndProvider";
import { useEmailFolders } from "@/hooks/useEmailFolders";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useVirtualizer } from "@tanstack/react-virtual";

// Use shared types from gmail-types
const DEFAULT_LABELS = IMPORTED_DEFAULT_LABELS;
const PRIORITY_CONFIG = IMPORTED_PRIORITY_CONFIG;

export default function Gmail() {
  console.log("🔍 [Gmail] Component render START");
  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchEmails,
    loadMoreEmails,
    searchByDateRange,
    sendEmail,
    isSending,
    getAttachment,
    getFullMessage,
    getThread,
    extractHtmlBody,
    reportSpam,
    batchModify,
  } = useGmailIntegration();
  const { isConnected, getAccessToken } = useGoogleServices();
  const { user } = useAuth();
  const { createTask: createTaskOriginal } = useTasks();
  const { createMeeting: createMeetingOriginal } = useMeetings();
  const emailMetadata = useEmailMetadata();
  const emailFolders = useEmailFolders();
  const { toast } = useToast();
  const { archiveEmail, deleteEmail, toggleStar, markAsRead } =
    useEmailActionsOptimistic();
  const gmailCache = useGmailCache();
  const emailBodyCache = useEmailBodyCache();
  const [hasLoaded, setHasLoaded] = useState(false);
  const gmailNotifications = useGmailNotifications({
    enabled: hasLoaded,
    pollIntervalMs: 60000,
    onNewEmails: (count) => {
      if (count > 0) handleRefresh();
    },
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [serverSearchActive, setServerSearchActive] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
  const [emailAttachments, setEmailAttachments] = useState<
    Array<{ name: string; type: string; attachmentId: string; size: number }>
  >([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [downloadingAtt, setDownloadingAtt] = useState<string | null>(null);

  // Folder state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderEmailIds, setFolderEmailIds] = useState<Set<string>>(new Set());
  const [showFoldersPanel, setShowFoldersPanel] = useState(true);

  // Date navigation state
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(
    null,
  );
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const { currentDate: scrollCurrentDate, isScrolling } = useScrollDateTracker(
    scrollContainerRef as React.RefObject<HTMLElement>,
    messages,
    hasLoaded && !selectedEmail,
  );
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState<
    | {
        to: string;
        subject: string;
        quotedBody?: string;
        mode?: "reply" | "forward" | "replyAll";
        originalFrom?: string;
        originalDate?: string;
      }
    | undefined
  >(undefined);
  const [activeTab, setActiveTab] = useState("inbox");

  // Chat view state
  const [viewMode, setViewMode] = useState<"list" | "chat" | "sender-chat">(
    "list",
  );
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<GmailMessage[]>([]);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  // Sender chat state
  const [senderChatEmail, setSenderChatEmail] = useState<string>("");
  const [senderChatName, setSenderChatName] = useState<string>("");

  // Client emails dialog
  const [isClientEmailsDialogOpen, setIsClientEmailsDialogOpen] =
    useState(false);

  // Undo send state
  const [undoSendState, setUndoSendState] = useState<{
    params: any;
    timeoutId: ReturnType<typeof setTimeout>;
    countdown: number;
  } | null>(null);

  // Snooze state
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [snoozeEmailId, setSnoozeEmailId] = useState<string | null>(null);

  // Full HTML body state
  const [emailHtmlBody, setEmailHtmlBody] = useState<string>("");
  const [loadingBody, setLoadingBody] = useState(false);

  // Resolve inline cid: images in HTML body
  const resolveInlineImages = useCallback(
    async (html: string, messageId: string, payload: any): Promise<string> => {
      if (!html || !payload) return html;
      // Find all cid: references in the HTML
      const cidMatches = html.match(/src=["']cid:([^"']+)["']/gi);
      if (!cidMatches || cidMatches.length === 0) return html;

      // Extract Content-ID to attachmentId mapping from MIME parts
      const cidMap: Record<
        string,
        { attachmentId: string; mimeType: string; data?: string }
      > = {};
      const scanParts = (parts: any[]) => {
        for (const part of parts) {
          const headers = part.headers || [];
          const contentId = headers.find(
            (h: any) => h.name.toLowerCase() === "content-id",
          )?.value;
          if (contentId && part.body) {
            // Remove angle brackets from Content-ID: <image001.png@...>
            const cleanCid = contentId.replace(/^<|>$/g, "");
            if (part.body.attachmentId) {
              cidMap[cleanCid] = {
                attachmentId: part.body.attachmentId,
                mimeType: part.mimeType || "image/png",
              };
            } else if (part.body.data) {
              // Inline data already present
              const base64 = part.body.data
                .replace(/-/g, "+")
                .replace(/_/g, "/");
              cidMap[cleanCid] = {
                attachmentId: "",
                mimeType: part.mimeType || "image/png",
                data: base64,
              };
            }
          }
          if (part.parts) scanParts(part.parts);
        }
      };
      if (payload.parts) scanParts(payload.parts);

      // Replace cid: references with data: URIs
      let resolvedHtml = html;
      for (const [cid, info] of Object.entries(cidMap)) {
        let base64Data = info.data;
        if (!base64Data && info.attachmentId) {
          base64Data =
            (await getAttachment(messageId, info.attachmentId)) ?? undefined;
        }
        if (base64Data) {
          const dataUri = `data:${info.mimeType};base64,${base64Data}`;
          // Replace both cid:xxx and cid:xxx with possible URL encoding
          resolvedHtml = resolvedHtml.replace(
            new RegExp(
              `cid:${cid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
              "gi",
            ),
            dataUri,
          );
        }
      }
      return resolvedHtml;
    },
    [getAttachment],
  );

  // Hover preview state
  const [hoverPreviewId, setHoverPreviewId] = useState<string | null>(null);
  const [hoverPreviewHtml, setHoverPreviewHtml] = useState<string | null>(null);
  const [hoverPreviewLoading, setHoverPreviewLoading] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<GmailMessage | null>(
    null,
  );
  const [previewY, setPreviewY] = useState(200);

  // Draggable + Resizable preview panel state (persisted in localStorage)
  const PREVIEW_STORAGE_KEY = "gmail_preview_panel";
  const getStoredPreviewRect = () => {
    try {
      const s = localStorage.getItem(PREVIEW_STORAGE_KEY);
      if (s) return JSON.parse(s);
    } catch {}
    return null;
  };
  const [previewRect, setPreviewRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  }>(() => {
    const stored = getStoredPreviewRect();
    return stored || { x: window.innerWidth * 0.05, y: 200, w: 600, h: 500 };
  });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    dir: string;
  } | null>(null);
  const previewLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Save preview position/size to localStorage
  const savePreviewRect = useCallback((rect: typeof previewRect) => {
    try {
      localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(rect));
    } catch {}
  }, []);

  // Drag handlers
  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: previewRect.x,
        origY: previewRect.y,
      };
      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        const newX = Math.max(
          4,
          Math.min(
            dragRef.current.origX + dx,
            window.innerWidth - previewRect.w - 4,
          ),
        );
        const newY = Math.max(
          56,
          Math.min(
            dragRef.current.origY + dy,
            window.innerHeight - previewRect.h - 4,
          ),
        );
        const newRect = {
          ...previewRect,
          x: newX,
          y: newY,
        };
        setPreviewRect(newRect);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        setPreviewRect((prev) => {
          savePreviewRect(prev);
          return prev;
        });
        dragRef.current = null;
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [previewRect, savePreviewRect],
  );

  // Resize handlers - supports all edges and corners
  const onEdgeResizeStart = useCallback(
    (e: React.MouseEvent, dir: string) => {
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: previewRect.x,
        origY: previewRect.y,
        origW: previewRect.w,
        origH: previewRect.h,
        dir,
      };
      const onMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const r = resizeRef.current;
        const dx = ev.clientX - r.startX;
        const dy = ev.clientY - r.startY;
        let { x, y, w, h } = { x: r.origX, y: r.origY, w: r.origW, h: r.origH };

        if (r.dir.includes("r")) {
          w = Math.max(300, r.origW + dx);
        }
        if (r.dir.includes("l")) {
          w = Math.max(300, r.origW - dx);
          x = r.origX + (r.origW - Math.max(300, r.origW - dx));
        }
        if (r.dir.includes("b")) {
          h = Math.max(250, r.origH + dy);
        }
        if (r.dir.includes("t")) {
          h = Math.max(250, r.origH - dy);
          y = r.origY + (r.origH - Math.max(250, r.origH - dy));
        }

        w = Math.min(w, window.innerWidth - 40);
        h = Math.min(h, window.innerHeight - 56);
        y = Math.max(56, y);
        setPreviewRect({ x, y, w, h });
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        setPreviewRect((prev) => {
          savePreviewRect(prev);
          return prev;
        });
        resizeRef.current = null;
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [previewRect, savePreviewRect],
  );

  const handleHoverPreview = useCallback(
    async (messageId: string, y: number) => {
      console.warn(
        "📧 ⬛ [HOVER PREVIEW TRIGGERED] messageId:",
        messageId,
        "y:",
        y,
      );
      setHoverPreviewId(messageId);
      // Position: use stored rect position (y), but set initial y near the hovered subject
      const stored = getStoredPreviewRect();
      if (!stored) {
        const clampedY = Math.max(
          40,
          Math.min(y - 60, window.innerHeight - 500),
        );
        setPreviewRect((prev) => ({
          ...prev,
          y: clampedY,
          x: window.innerWidth * 0.05,
        }));
      }
      // Find the message and open the preview
      const msg = messages.find((m) => m.id === messageId);
      if (msg) {
        setPreviewMessage(msg);
        setShowPreviewDialog(true);
      }
      // Check persistent cache first (IndexedDB + memory)
      const cachedBody = await emailBodyCache.getCachedBody(messageId);
      if (cachedBody) {
        console.log(
          "📧 [Preview DEBUG] Got cached body, length:",
          cachedBody.length,
          "first100:",
          cachedBody.substring(0, 100),
        );
        setHoverPreviewHtml(cachedBody);
        return;
      }
      setHoverPreviewHtml(null);
      setHoverPreviewLoading(true);
      try {
        const fullMsg = await getFullMessage(messageId);
        console.log(
          "📧 [Preview DEBUG] fullMsg received:",
          !!fullMsg,
          "has payload:",
          !!fullMsg?.payload,
        );
        if (fullMsg?.payload) {
          const rawHtml = extractHtmlBody(fullMsg.payload);
          console.log(
            "📧 [Preview DEBUG] rawHtml length:",
            rawHtml?.length,
            "first100:",
            rawHtml?.substring(0, 100),
          );
          const html = await resolveInlineImages(
            rawHtml,
            messageId,
            fullMsg.payload,
          );
          console.log("📧 [Preview DEBUG] resolved html length:", html?.length);
          setHoverPreviewHtml(html);
          if (html) {
            await emailBodyCache.cacheBody(messageId, html);
          }
        } else {
          console.log("📧 [Preview DEBUG] No payload in fullMsg");
          setHoverPreviewHtml(null);
        }
      } catch (e) {
        console.error("📧 [HoverPreview] Error:", e);
        setHoverPreviewHtml(null);
      }
      setHoverPreviewLoading(false);
    },
    [
      getFullMessage,
      extractHtmlBody,
      emailBodyCache,
      resolveInlineImages,
      messages,
    ],
  );

  // Muted threads
  const [mutedThreads, setMutedThreads] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("gmail_muted_threads");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Keyboard shortcuts help dialog
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Task/Meeting dialogs
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);
  const [taskInitialData, setTaskInitialData] = useState<any>(null);
  const [meetingInitialData, setMeetingInitialData] = useState<any>(null);

  // Wrapper functions for QuickAddTask/QuickAddMeeting (they expect Promise<void>)
  const handleCreateTask = useCallback(
    async (task: Parameters<typeof createTaskOriginal>[0]): Promise<void> => {
      await createTaskOriginal(task);
    },
    [createTaskOriginal],
  );

  const handleCreateMeeting = useCallback(
    async (
      meeting: Parameters<typeof createMeetingOriginal>[0],
    ): Promise<void> => {
      await createMeetingOriginal(meeting);
    },
    [createMeetingOriginal],
  );

  // New Enhanced Features State - persisted via useEmailMetadata
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set(),
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null); // 'archive' | 'delete' | 'spam' | 'star' | null
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [customLabels, setCustomLabels] =
    useState<EmailLabel[]>(DEFAULT_LABELS);
  const [filterByLabel, setFilterByLabel] = useState<string | null>(null);
  const [filterByPriority, setFilterByPriority] = useState<Priority | null>(
    null,
  );
  const [filterByClient, setFilterByClient] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "priority" | "sender">("date");
  const [showFilters, setShowFilters] = useState(false);
  const [displayDensity, setDisplayDensity] = useState<
    "compact" | "comfortable" | "spacious"
  >(() => {
    return (
      (localStorage.getItem("gmail_display_density") as any) || "comfortable"
    );
  });
  const [showPreview, setShowPreview] = useState(() => {
    const saved = localStorage.getItem("gmail_show_preview");
    return saved !== null ? saved === "true" : true;
  });

  // Persist view preferences
  useEffect(() => {
    localStorage.setItem("gmail_display_density", displayDensity);
  }, [displayDensity]);
  useEffect(() => {
    localStorage.setItem("gmail_show_preview", String(showPreview));
  }, [showPreview]);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedEmailForAction, setSelectedEmailForAction] =
    useState<GmailMessage | null>(null);

  // Client auto-tagging state
  const [clients, setClients] = useState<Client[]>([]);
  const [clientEmailMap, setClientEmailMap] = useState<Map<string, Client>>(
    new Map(),
  );
  const [autoTagEnabled, setAutoTagEnabled] = useState(true);

  console.log("🔍 [Gmail] State declarations done, starting useMemo hooks");

  // Derived persistent data from useEmailMetadata
  const emailLabels = useMemo(
    () => emailMetadata.getAllLabels(),
    [emailMetadata.metadata],
  );
  const emailPriority = useMemo(
    () => emailMetadata.getAllPriorities() as Record<string, Priority>,
    [emailMetadata.metadata],
  );
  const emailNotes = useMemo(
    () => emailMetadata.getAllNotes(),
    [emailMetadata.metadata],
  );
  const emailReminders = useMemo(
    () => emailMetadata.getAllReminders(),
    [emailMetadata.metadata],
  );

  console.log("🔍 [Gmail] useMemo metadata hooks done, starting useEffects");

  // Load clients for auto-tagging
  useEffect(() => {
    const loadClients = async () => {
      if (!user) return;

      // Load custom labels from localStorage
      try {
        const savedLabels = localStorage.getItem("gmail_custom_labels");
        if (savedLabels) {
          const parsed = JSON.parse(savedLabels) as EmailLabel[];
          setCustomLabels((prev) => [...DEFAULT_LABELS, ...parsed]);
        }
      } catch (e) {
        console.error("Error loading custom labels:", e);
      }

      try {
        const { data, error } = await supabase
          .from("clients")
          .select("id, name, email, phone")
          .eq("user_id", user.id);

        if (error) throw error;

        if (data) {
          setClients(data);
          // Create email -> client map for quick lookup
          const emailMap = new Map<string, Client>();
          data.forEach((client) => {
            if (client.email) {
              // Handle multiple emails (comma separated or semicolon)
              const emails = client.email
                .split(/[,;]/)
                .map((e) => e.trim().toLowerCase());
              emails.forEach((email) => {
                if (email) {
                  emailMap.set(email, client);
                }
              });
            }
          });
          setClientEmailMap(emailMap);

          // Add client-based labels dynamically - merge with custom labels from localStorage
          const clientLabels: EmailLabel[] = data.map((client) => ({
            id: `client_${client.id}`,
            name: client.name,
            color: "bg-blue-500",
            icon: <Building2 className="h-3 w-3" />,
          }));

          // Merge: defaults + saved custom + client labels
          let savedCustom: EmailLabel[] = [];
          try {
            const saved = localStorage.getItem("gmail_custom_labels");
            if (saved) savedCustom = JSON.parse(saved);
          } catch {}

          setCustomLabels([...DEFAULT_LABELS, ...savedCustom, ...clientLabels]);
        }
      } catch (error) {
        console.error("Error loading clients:", error);
      }
    };

    loadClients();
  }, [user]);

  // Auto-tag emails based on client email addresses
  useEffect(() => {
    if (!autoTagEnabled || messages.length === 0 || clientEmailMap.size === 0)
      return;

    messages.forEach((message) => {
      const senderEmail = message.from?.toLowerCase().trim();
      if (!senderEmail) return;

      const matchedClient = clientEmailMap.get(senderEmail);
      if (matchedClient) {
        const labelId = `client_${matchedClient.id}`;
        const meta = emailMetadata.getMetadata(message.id);
        const currentLabels = meta?.labels || [];

        if (!currentLabels.includes(labelId)) {
          emailMetadata.addLabel(message.id, labelId);
        }
      }
    });
  }, [messages, clientEmailMap, autoTagEnabled]);

  // Get client info for a message (for display)
  const getClientForMessage = useCallback(
    (message: GmailMessage): Client | null => {
      const senderEmail = message.from?.toLowerCase().trim();
      if (!senderEmail) return null;
      return clientEmailMap.get(senderEmail) || null;
    },
    [clientEmailMap],
  );

  // Auto-load emails if already connected (with cache)
  useEffect(() => {
    if (isConnected && !hasLoaded && !isLoading) {
      // Check cache first for instant display
      const cached = gmailCache.getCachedMessages();
      if (cached && cached.length > 0) {
        // We have cached data, show it immediately and refresh in background
        setHasLoaded(true);
        fetchEmails(50).then((freshMsgs) => {
          if (freshMsgs && freshMsgs.length > 0) {
            gmailCache.cacheMessages(freshMsgs);
          }
        });
      } else {
        fetchEmails(50).then((msgs) => {
          if (msgs && msgs.length > 0) {
            gmailCache.cacheMessages(msgs);
          }
          setHasLoaded(true);
        });
      }
    }
  }, [isConnected, hasLoaded, isLoading, fetchEmails, gmailCache]);

  // Background pre-fetch email bodies after list loads
  useEffect(() => {
    if (!hasLoaded || messages.length === 0) return;

    // Fetch body for a single message (for prefetch)
    const fetchSingleBody = async (
      messageId: string,
    ): Promise<string | null> => {
      try {
        const fullMsg = await getFullMessage(messageId);
        if (fullMsg?.payload) {
          const rawHtml = extractHtmlBody(fullMsg.payload);
          const html = await resolveInlineImages(
            rawHtml,
            messageId,
            fullMsg.payload,
          );
          return html;
        }
        return null;
      } catch {
        return null;
      }
    };

    // Pre-fetch the first 20 visible email bodies
    const idsToFetch = messages.slice(0, 20).map((m) => m.id);
    console.log(
      "📧 [Prefetch] Starting background pre-fetch for",
      idsToFetch.length,
      "emails",
    );
    emailBodyCache.prefetchBodies(idsToFetch, fetchSingleBody);

    return () => {
      emailBodyCache.stopPrefetch();
    };
  }, [
    hasLoaded,
    messages,
    getFullMessage,
    extractHtmlBody,
    resolveInlineImages,
    emailBodyCache,
  ]);

  // Load folder emails when folder selected
  useEffect(() => {
    if (!selectedFolderId) {
      setFolderEmailIds(new Set());
      return;
    }
    emailFolders.getEmailsInFolder(selectedFolderId).then((items: any[]) => {
      setFolderEmailIds(new Set(items.map((item: any) => item.email_id)));
    });
  }, [selectedFolderId]);

  // Load attachments + body in a single API call when an email is selected (with body cache)
  useEffect(() => {
    if (!selectedEmail) {
      setEmailAttachments([]);
      setEmailHtmlBody("");
      return;
    }
    const loadEmailData = async () => {
      // Check body cache first
      const cachedBody = gmailCache.getCachedBody(selectedEmail.id);
      if (cachedBody) {
        setEmailHtmlBody(cachedBody);
        setLoadingBody(false);
      } else {
        setLoadingBody(true);
      }
      setLoadingAttachments(true);
      try {
        const fullMsg = await getFullMessage(selectedEmail.id);
        if (!fullMsg?.payload) {
          setLoadingAttachments(false);
          setLoadingBody(false);
          return;
        }

        // Extract attachments
        const attachments: Array<{
          name: string;
          type: string;
          attachmentId: string;
          size: number;
        }> = [];
        const extractParts = (parts: any[]) => {
          for (const part of parts) {
            if (part.filename && part.body?.attachmentId) {
              attachments.push({
                name: part.filename,
                type: part.mimeType || "application/octet-stream",
                attachmentId: part.body.attachmentId,
                size: part.body.size || 0,
              });
            }
            if (part.parts) extractParts(part.parts);
          }
        };
        if (fullMsg.payload.parts) extractParts(fullMsg.payload.parts);
        setEmailAttachments(attachments);

        // Extract HTML body, resolve inline images, and cache it
        const rawHtml = extractHtmlBody(fullMsg.payload);
        const html = await resolveInlineImages(
          rawHtml,
          selectedEmail.id,
          fullMsg.payload,
        );
        setEmailHtmlBody(html);
        if (html) {
          gmailCache.cacheBody(selectedEmail.id, html);
        }
      } catch (e) {
        console.error("Error loading email data:", e);
      }
      setLoadingAttachments(false);
      setLoadingBody(false);
    };
    loadEmailData();
  }, [
    selectedEmail?.id,
    getFullMessage,
    extractHtmlBody,
    gmailCache,
    resolveInlineImages,
  ]);

  // Scheduled send dispatcher - check every 30 seconds
  useEffect(() => {
    const checkScheduled = async () => {
      try {
        const scheduled = JSON.parse(
          localStorage.getItem("scheduled_emails") || "[]",
        );
        const now = new Date();
        const remaining: any[] = [];
        const failed: any[] = [];
        for (const item of scheduled) {
          if (new Date(item.scheduledAt) <= now) {
            try {
              await sendEmail({ ...item, scheduledAt: undefined });
              toast({
                title: "מייל מתוזמן נשלח",
                description: item.subject || "ללא נושא",
              });
            } catch (err) {
              console.error("Failed to send scheduled email:", err);
              failed.push(item);
              toast({
                title: "שגיאה בשליחת מייל מתוזמן",
                description: item.subject || "ללא נושא",
                variant: "destructive",
              });
            }
          } else {
            remaining.push(item);
          }
        }
        // Keep failed ones for retry
        const updated = [...remaining, ...failed];
        if (updated.length !== scheduled.length || failed.length > 0) {
          localStorage.setItem("scheduled_emails", JSON.stringify(updated));
        }
      } catch {}
    };
    checkScheduled();
    const interval = setInterval(checkScheduled, 30000);
    return () => clearInterval(interval);
  }, [sendEmail, toast]);

  // Snooze dispatcher - check every minute
  useEffect(() => {
    const checkSnooze = () => {
      try {
        const snoozed = JSON.parse(
          localStorage.getItem("gmail_snoozed") || "[]",
        );
        const now = new Date();
        const remaining = snoozed.filter((s: any) => new Date(s.until) > now);
        if (remaining.length !== snoozed.length) {
          localStorage.setItem("gmail_snoozed", JSON.stringify(remaining));
          // Refresh to show un-snoozed emails
          handleRefresh();
        }
      } catch {}
    };
    checkSnooze();
    const interval = setInterval(checkSnooze, 60000);
    return () => clearInterval(interval);
  }, []);

  // Save muted threads
  useEffect(() => {
    localStorage.setItem(
      "gmail_muted_threads",
      JSON.stringify([...mutedThreads]),
    );
  }, [mutedThreads]);

  console.log("🔍 [Gmail] Before filteredMessages useMemo");
  // Filter and sort messages
  const filteredMessages = useMemo(() => {
    console.log("🔍 [Gmail] filteredMessages useMemo computing...");
    // When server search is active, skip local text filtering (results already filtered by Gmail API)
    let result = serverSearchActive
      ? [...messages]
      : messages.filter(
          (msg) =>
            !searchQuery ||
            msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.fromName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.from?.toLowerCase().includes(searchQuery.toLowerCase()),
        );

    // Filter by tab
    if (activeTab === "starred") {
      result = result.filter((msg) => msg.isStarred);
    } else if (activeTab === "sent") {
      result = result.filter(
        (msg) =>
          msg.labels?.includes("SENT") ||
          msg.from?.toLowerCase() === user?.email?.toLowerCase(),
      );
    } else if (activeTab === "reminders") {
      result = result.filter((msg) => emailReminders[msg.id]);
    } else if (activeTab === "drafts") {
      result = result.filter((msg) => msg.labels?.includes("DRAFT"));
    } else if (activeTab === "spam") {
      result = result.filter((msg) => msg.labels?.includes("SPAM"));
    } else if (activeTab === "trash") {
      result = result.filter((msg) => msg.labels?.includes("TRASH"));
    } else if (activeTab === "archive") {
      result = result.filter(
        (msg) =>
          !msg.labels?.includes("INBOX") &&
          !msg.labels?.includes("TRASH") &&
          !msg.labels?.includes("SPAM") &&
          !msg.labels?.includes("DRAFT"),
      );
    }

    // Filter by folder
    if (selectedFolderId && folderEmailIds.size > 0) {
      result = result.filter((msg) => folderEmailIds.has(msg.id));
    }

    // Filter by pinned first
    const pinned = result.filter(
      (msg) => emailMetadata.getMetadata(msg.id)?.is_pinned,
    );
    const unpinned = result.filter(
      (msg) => !emailMetadata.getMetadata(msg.id)?.is_pinned,
    );

    // Filter by label
    if (filterByLabel) {
      const pinnedFiltered = pinned.filter((msg) =>
        emailLabels[msg.id]?.includes(filterByLabel),
      );
      const unpinnedFiltered = unpinned.filter((msg) =>
        emailLabels[msg.id]?.includes(filterByLabel),
      );
      result = [...pinnedFiltered, ...unpinnedFiltered];
    } else {
      result = [...pinned, ...unpinned];
    }

    // Filter by priority
    if (filterByPriority) {
      result = result.filter(
        (msg) => emailPriority[msg.id] === filterByPriority,
      );
    }

    // Filter by client
    if (filterByClient) {
      result = result.filter((msg) => {
        const client = getClientForMessage(msg);
        return client && client.id === filterByClient;
      });
    }

    // Sort
    switch (sortBy) {
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
        result.sort((a, b) => {
          const aPriority = emailPriority[a.id] || "none";
          const bPriority = emailPriority[b.id] || "none";
          return priorityOrder[aPriority] - priorityOrder[bPriority];
        });
        break;
      case "sender":
        result.sort((a, b) =>
          (a.fromName || "").localeCompare(b.fromName || "", "he"),
        );
        break;
      case "date":
      default:
        result.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    }

    // Filter out snoozed emails (unless they've expired)
    const snoozedIds = (() => {
      try {
        const snoozed = JSON.parse(
          localStorage.getItem("gmail_snoozed") || "[]",
        );
        const now = new Date();
        return new Set(
          snoozed
            .filter((s: any) => new Date(s.until) > now)
            .map((s: any) => s.emailId),
        );
      } catch {
        return new Set();
      }
    })();
    if (snoozedIds.size > 0) {
      result = result.filter((msg) => !snoozedIds.has(msg.id));
    }

    return result;
  }, [
    messages,
    searchQuery,
    serverSearchActive,
    activeTab,
    filterByLabel,
    filterByPriority,
    filterByClient,
    sortBy,
    emailLabels,
    emailPriority,
    clientEmailMap,
    selectedFolderId,
    folderEmailIds,
    emailReminders,
    emailMetadata,
    user?.email,
  ]);

  console.log(
    "🔍 [Gmail] filteredMessages ready, length:",
    filteredMessages?.length,
    "setting up keyboard shortcuts",
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable
      )
        return;

      if (e.key === "c" && !e.ctrlKey && !e.metaKey) {
        // c = compose
        e.preventDefault();
        setComposeData(undefined);
        setIsComposeOpen(true);
      }
      if (e.key === "?" && e.shiftKey) {
        // ? = shortcuts help
        e.preventDefault();
        setShowShortcutsHelp(true);
      }
      if (selectedEmail) {
        if (e.key === "Escape") {
          setSelectedEmail(null);
        }
        if (e.key === "r" && !e.ctrlKey) {
          // r = reply
          e.preventDefault();
          const replySubject = selectedEmail.subject?.startsWith("Re:")
            ? selectedEmail.subject
            : `Re: ${selectedEmail.subject || ""}`;
          setComposeData({
            to: selectedEmail.from,
            subject: replySubject,
            quotedBody: buildQuotedBody(selectedEmail, "reply"),
            mode: "reply",
          });
          setIsComposeOpen(true);
        }
        if (e.key === "a" && !e.ctrlKey) {
          // a = reply all
          e.preventDefault();
          const replySubject = selectedEmail.subject?.startsWith("Re:")
            ? selectedEmail.subject
            : `Re: ${selectedEmail.subject || ""}`;
          const allRecipients = [
            selectedEmail.from,
            ...(selectedEmail.to || []),
          ]
            .filter((em) => em !== user?.email)
            .join(", ");
          setComposeData({
            to: allRecipients,
            subject: replySubject,
            quotedBody: buildQuotedBody(selectedEmail, "replyAll"),
            mode: "replyAll",
          });
          setIsComposeOpen(true);
        }
        if (e.key === "f" && !e.ctrlKey) {
          // f = forward
          e.preventDefault();
          const fwdSubject = selectedEmail.subject?.startsWith("Fwd:")
            ? selectedEmail.subject
            : `Fwd: ${selectedEmail.subject || ""}`;
          setComposeData({
            to: "",
            subject: fwdSubject,
            quotedBody: buildQuotedBody(selectedEmail, "forward"),
            mode: "forward",
          });
          setIsComposeOpen(true);
        }
        if (e.key === "e" && !e.ctrlKey) {
          // e = archive
          e.preventDefault();
          archiveEmail(selectedEmail.id).then(() => {
            setSelectedEmail(null);
            handleRefresh();
          });
        }
        if (e.key === "#") {
          // # = delete
          e.preventDefault();
          deleteEmail(selectedEmail.id).then(() => {
            setSelectedEmail(null);
            handleRefresh();
          });
        }
        if (e.key === "s" && !e.ctrlKey) {
          // s = star
          e.preventDefault();
          toggleStar(selectedEmail.id, selectedEmail.isStarred).then(() =>
            handleRefresh(),
          );
        }
        if (e.key === "p" && !e.ctrlKey && !e.metaKey) {
          // p = print
          e.preventDefault();
          handlePrintEmail();
        }
      }
      // j/k navigation in list
      if (!selectedEmail && filteredMessages.length > 0) {
        if (e.key === "j") {
          e.preventDefault();
          setSelectedEmail(filteredMessages[0]);
        }
      }
      if (selectedEmail && filteredMessages.length > 0) {
        const currentIdx = filteredMessages.findIndex(
          (m) => m.id === selectedEmail.id,
        );
        if (e.key === "j" && currentIdx < filteredMessages.length - 1) {
          e.preventDefault();
          setSelectedEmail(filteredMessages[currentIdx + 1]);
        }
        if (e.key === "k" && currentIdx > 0) {
          e.preventDefault();
          setSelectedEmail(filteredMessages[currentIdx - 1]);
        }
        if (e.key === "o") {
          e.preventDefault();
          setSelectedThreadId(selectedEmail.threadId);
          setViewMode("chat");
          loadThreadMessages(selectedEmail.threadId);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmail, filteredMessages, user?.email]);

  // Undo send countdown
  useEffect(() => {
    if (!undoSendState) return;
    const interval = setInterval(() => {
      setUndoSendState((prev) => {
        if (!prev) return null;
        if (prev.countdown <= 1) {
          clearInterval(interval);
          return null;
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [undoSendState?.params]);

  console.log(
    "🔍 [Gmail] Keyboard effect registered, continuing to buildQuotedBody",
  );

  // Build quoted body for reply / forward
  const buildQuotedBody = useCallback(
    (email: typeof selectedEmail, mode: "reply" | "forward" | "replyAll") => {
      const body = emailHtmlBody || email?.snippet || "";
      const dateStr = email ? formatDate(email.date) : "";
      const from = email?.fromName
        ? `${email.fromName} &lt;${email.from}&gt;`
        : email?.from || "";

      if (mode === "forward") {
        return `<br/><br/><div style="color:#666;font-size:13px">---------- הודעה שהועברה ----------<br/>מאת: ${from}<br/>תאריך: ${dateStr}<br/>נושא: ${email?.subject || ""}<br/>אל: ${email?.to?.join(", ") || ""}</div><br/><div>${body}</div>`;
      }
      // reply / replyAll
      return `<br/><br/><div style="border-right:2px solid #ccc;padding-right:10px;margin-top:16px;color:#666;font-size:13px"><div>ב-${dateStr}, ${from} כתב/ה:</div><br/><div>${body}</div></div>`;
    },
    [emailHtmlBody],
  );

  // Print email
  const handlePrintEmail = useCallback(() => {
    if (!selectedEmail) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl"><head><title>${selectedEmail.subject || "מייל"}</title>
        <style>body{font-family:Arial,sans-serif;padding:20px;direction:rtl}
        .header{border-bottom:1px solid #ccc;padding-bottom:10px;margin-bottom:20px}
        .meta{color:#666;font-size:14px}</style></head><body>
        <div class="header"><h2>${selectedEmail.subject || "(ללא נושא)"}</h2>
        <p class="meta">מאת: ${selectedEmail.fromName} &lt;${selectedEmail.from}&gt;</p>
        <p class="meta">אל: ${selectedEmail.to?.join(", ") || ""}</p>
        <p class="meta">תאריך: ${formatDate(selectedEmail.date)}</p></div>
        <div>${DOMPurify.sanitize(emailHtmlBody || selectedEmail.snippet, { ALLOW_UNKNOWN_PROTOCOLS: true })}</div></body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [selectedEmail, emailHtmlBody]);

  // Snooze email
  const handleSnooze = useCallback(
    (emailId: string, until: Date) => {
      const snoozed = JSON.parse(localStorage.getItem("gmail_snoozed") || "[]");
      snoozed.push({ emailId, until: until.toISOString() });
      localStorage.setItem("gmail_snoozed", JSON.stringify(snoozed));
      toast({
        title: "המייל נדחה",
        description: `יופיע שוב ב-${until.toLocaleString("he-IL")}`,
      });
      setSnoozeDialogOpen(false);
      setSnoozeEmailId(null);
    },
    [toast],
  );

  // Mute thread
  const handleMuteThread = useCallback(
    (threadId: string) => {
      setMutedThreads((prev) => {
        const next = new Set(prev);
        if (next.has(threadId)) {
          next.delete(threadId);
          toast({ title: "השרשור הופעל מחדש" });
        } else {
          next.add(threadId);
          toast({ title: "השרשור הושתק" });
        }
        return next;
      });
    },
    [toast],
  );

  // Undo send wrapper
  const sendWithUndo = useCallback(
    async (params: any) => {
      return new Promise<boolean>((resolve) => {
        // Show undo bar for 5 seconds
        const timeoutId = setTimeout(async () => {
          setUndoSendState(null);
          const success = await sendEmail(params);
          resolve(success);
        }, 5000);
        setUndoSendState({ params, timeoutId, countdown: 5 });
      });
    },
    [sendEmail],
  );

  // Cancel undo send
  const cancelUndoSend = useCallback(() => {
    if (undoSendState) {
      clearTimeout(undoSendState.timeoutId);
      setUndoSendState(null);
      toast({ title: "השליחה בוטלה" });
    }
  }, [undoSendState, toast]);

  // Download an attachment
  const handleDownloadAttachment = useCallback(
    async (
      messageId: string,
      attachmentId: string,
      filename: string,
      mimeType: string,
    ) => {
      setDownloadingAtt(attachmentId);
      try {
        const base64Data = await getAttachment(messageId, attachmentId);
        if (!base64Data) throw new Error("Failed to get attachment data");

        // Convert base64 to Blob and download
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading attachment:", error);
      }
      setDownloadingAtt(null);
    },
    [getAttachment],
  );

  console.log(
    "🔍 [Gmail] buildQuotedBody + handlePrintEmail + snooze/mute/undoSend ready",
  );

  const handleConnect = useCallback(async () => {
    await fetchEmails(50);
    setHasLoaded(true);
  }, [fetchEmails]);

  const handleRefresh = useCallback(async () => {
    setSelectedDateFilter(null);
    const freshMsgs = await fetchEmails(50);
    if (freshMsgs && freshMsgs.length > 0) {
      gmailCache.cacheMessages(freshMsgs);
    }
  }, [fetchEmails, gmailCache]);

  // Handle date filter selection
  const handleDateFilterSelect = useCallback(
    async (date: Date) => {
      setSelectedDateFilter(date);
      await searchByDateRange(date);
    },
    [searchByDateRange],
  );

  // Clear date filter
  const handleClearDateFilter = async () => {
    setSelectedDateFilter(null);
    await fetchEmails(50);
  };

  console.log("🔍 [Gmail] handleConnect/handleRefresh/handleDateFilter ready");

  // Load thread messages for chat view (from API)
  const loadThreadMessages = async (threadId: string) => {
    setIsLoadingThread(true);
    try {
      const threadMsgs = await getThread(threadId);
      threadMsgs.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setThreadMessages(threadMsgs);
    } catch (error) {
      console.error("Error loading thread:", error);
      // fallback to local filtering
      const localMsgs = messages.filter((m) => m.threadId === threadId);
      localMsgs.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setThreadMessages(localMsgs);
    }
    setIsLoadingThread(false);
  };

  // Open chat view for a thread
  const openChatView = async (email: GmailMessage) => {
    setSelectedThreadId(email.threadId);
    setViewMode("chat");
    await loadThreadMessages(email.threadId);
  };

  // Fetch emails for a specific sender (independent of main email list state)
  const fetchEmailsForSender = useCallback(
    async (
      email: string,
      pageToken?: string,
    ): Promise<{ messages: GmailMessage[]; nextPageToken: string | null }> => {
      try {
        const token = await getAccessToken(["gmail"]);
        if (!token) return { messages: [], nextPageToken: null };

        const query = `from:${email} OR to:${email}`;
        let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=${encodeURIComponent(query)}`;
        if (pageToken) {
          url += `&pageToken=${pageToken}`;
        }

        const listResponse = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const listData = await listResponse.json();

        if (!listData.messages) {
          return { messages: [], nextPageToken: null };
        }

        // Fetch metadata for each message (batched to avoid 429)
        const allMsgIds = listData.messages;
        const BATCH_SIZE = 8;
        const messagesData: any[] = [];

        for (let i = 0; i < allMsgIds.length; i += BATCH_SIZE) {
          const batch = allMsgIds.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map(async (msg: any) => {
            const msgResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            return msgResponse.json();
          });
          const batchResults = await Promise.all(batchPromises);
          messagesData.push(...batchResults);
          if (i + BATCH_SIZE < allMsgIds.length) {
            await new Promise((r) => setTimeout(r, 100));
          }
        }

        const formattedMessages: GmailMessage[] = messagesData.map(
          (msg: any) => {
            const headers = msg.payload?.headers || [];
            const getHeader = (name: string) =>
              headers.find((h: any) => h.name === name)?.value || "";
            const fromHeader = getHeader("From");
            const fromMatch = fromHeader.match(
              /^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/,
            );

            return {
              id: msg.id,
              threadId: msg.threadId,
              subject: getHeader("Subject"),
              from: fromMatch?.[2] || fromHeader,
              fromName: fromMatch?.[1] || fromMatch?.[2] || fromHeader,
              to: getHeader("To")
                .split(",")
                .map((t: string) => t.trim()),
              date: getHeader("Date"),
              snippet: msg.snippet || "",
              isRead: !msg.labelIds?.includes("UNREAD"),
              isStarred: msg.labelIds?.includes("STARRED"),
              labels: msg.labelIds || [],
            };
          },
        );

        return {
          messages: formattedMessages,
          nextPageToken: listData.nextPageToken || null,
        };
      } catch (error) {
        console.error("Error fetching sender emails:", error);
        return { messages: [], nextPageToken: null };
      }
    },
    [getAccessToken],
  );

  // Open sender chat view
  const openSenderChat = useCallback((email: string, name: string) => {
    setSenderChatEmail(email);
    setSenderChatName(name);
    setViewMode("sender-chat");
  }, []);

  // Handle send reply in chat view
  const handleSendReply = async (
    message: string,
    attachments?: EmailAttachment[],
  ): Promise<boolean> => {
    if (!selectedThreadId || threadMessages.length === 0) return false;

    const lastMessage = threadMessages[threadMessages.length - 1];

    const subject = lastMessage.subject.startsWith("Re:")
      ? lastMessage.subject
      : `Re: ${lastMessage.subject}`;

    const replyTo =
      lastMessage.from === user?.email ? lastMessage.to[0] : lastMessage.from;

    // Get threading headers
    const msgId = (lastMessage as any).messageId || "";

    const success = await sendEmail({
      to: replyTo,
      subject,
      body: message,
      attachments,
      inReplyTo: msgId || undefined,
      references: msgId || undefined,
    });

    if (success) {
      // Refresh thread
      await handleRefresh();
      await loadThreadMessages(selectedThreadId);
    }

    return success;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();

      if (isToday(date)) {
        return format(date, "HH:mm", { locale: he });
      }
      if (isYesterday(date)) {
        return "אתמול " + format(date, "HH:mm", { locale: he });
      }
      if (isThisWeek(date)) {
        return format(date, "EEEE HH:mm", { locale: he });
      }
      return format(date, "dd/MM/yyyy", { locale: he });
    } catch {
      return dateStr;
    }
  };

  // Toggle label on email (persistent)
  const toggleEmailLabel = (emailId: string, labelId: string) => {
    const meta = emailMetadata.getMetadata(emailId);
    const current = meta?.labels || [];
    if (current.includes(labelId)) {
      emailMetadata.removeLabel(emailId, labelId);
    } else {
      emailMetadata.addLabel(emailId, labelId);
    }
  };

  // Set priority on email (persistent)
  const setEmailPriorityLevel = (emailId: string, priority: Priority) => {
    emailMetadata.setPriority(emailId, priority === "none" ? null : priority);
  };

  // Set reminder on email (persistent)
  const setEmailReminder = (emailId: string, date: Date | null) => {
    emailMetadata.setReminder(emailId, date ? date.toISOString() : null);
  };

  // Save note on email (persistent) - debounced
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveEmailNote = useCallback(
    (emailId: string, note: string) => {
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
      noteTimerRef.current = setTimeout(() => {
        emailMetadata.setNotes(emailId, note || null);
      }, 500);
    },
    [emailMetadata],
  );

  // Ref for shift+click selection
  const lastClickedIndexRef = useRef<number | null>(null);

  // Toggle message selection with shift support
  const toggleMessageSelection = (
    messageId: string,
    index?: number,
    shiftKey?: boolean,
  ) => {
    setSelectedMessages((prev) => {
      const newSet = new Set(prev);
      if (
        shiftKey &&
        lastClickedIndexRef.current !== null &&
        index !== undefined
      ) {
        // Shift+click: select range
        const start = Math.min(lastClickedIndexRef.current, index);
        const end = Math.max(lastClickedIndexRef.current, index);
        for (let i = start; i <= end; i++) {
          if (filteredMessages[i]) newSet.add(filteredMessages[i].id);
        }
      } else if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      if (index !== undefined) lastClickedIndexRef.current = index;
      return newSet;
    });
  };

  // Select all messages
  const selectAllMessages = () => {
    if (selectedMessages.size === filteredMessages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(filteredMessages.map((m) => m.id)));
    }
  };

  // Bulk actions
  const bulkAddLabel = (labelId: string) => {
    selectedMessages.forEach((msgId) => {
      const meta = emailMetadata.getMetadata(msgId);
      const current = meta?.labels || [];
      if (!current.includes(labelId)) {
        emailMetadata.addLabel(msgId, labelId);
      }
    });
    setSelectedMessages(new Set());
  };

  const bulkSetPriority = (priority: Priority) => {
    selectedMessages.forEach((msgId) => {
      setEmailPriorityLevel(msgId, priority);
    });
    setSelectedMessages(new Set());
  };

  // Bulk move to folder
  const bulkMoveToFolder = async (folderId: string) => {
    const selectedEmails = messages.filter((m) => selectedMessages.has(m.id));
    if (selectedEmails.length > 0) {
      await emailFolders.batchAddEmailsToFolder(folderId, selectedEmails);
      // Refresh folder email list if we're viewing a folder
      if (selectedFolderId) {
        const items = await emailFolders.getEmailsInFolder(selectedFolderId);
        setFolderEmailIds(new Set(items.map((item: any) => item.email_id)));
      }
      setSelectedMessages(new Set());
    }
  };

  // Create task from email
  const handleCreateTaskFromEmail = (
    email: GmailMessage,
    clientId?: string,
  ) => {
    setTaskInitialData({
      title: email.subject || "משימה ממייל",
      description: `תוכן מהמייל:\n\n${email.snippet || ""}\n\nמאת: ${email.fromName} (${email.from})`,
      clientId: clientId,
    });
    setIsAddTaskOpen(true);
  };

  // Create meeting from email
  const handleCreateMeetingFromEmail = (
    email: GmailMessage,
    clientId?: string,
  ) => {
    setMeetingInitialData({
      title: "פגישה: " + (email.subject || "נושא המייל"),
      description: `תוכן מהמייל:\n\n${email.snippet || ""}\n\nמאת: ${email.fromName} (${email.from})`,
      clientId: clientId,
    });
    setIsAddMeetingOpen(true);
  };

  // Create reminder from email
  const handleCreateReminderFromEmail = (email: GmailMessage) => {
    setSelectedEmailForAction(email);
    setIsReminderDialogOpen(true);
  };

  // Link client to email
  const handleLinkClient = async (emailId: string, clientId: string | null) => {
    await emailMetadata.linkClient(emailId, clientId, {
      from: selectedEmail?.from,
      subject: selectedEmail?.subject,
      date: selectedEmail?.date ? new Date(selectedEmail.date) : undefined,
    });
  };

  console.log("🔍 [Gmail] All functions declared, computing threadCounts");

  // Pre-compute thread counts to avoid O(n²) in render loop
  const threadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const msg of messages) {
      if (msg.threadId) {
        counts[msg.threadId] = (counts[msg.threadId] || 0) + 1;
      }
    }
    return counts;
  }, [messages]);

  // Count emails with reminders for today
  const remindersForToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Object.entries(emailReminders).filter(([, dateStr]) => {
      const reminderDate = new Date(dateStr);
      reminderDate.setHours(0, 0, 0, 0);
      return reminderDate.getTime() === today.getTime();
    }).length;
  }, [emailReminders]);

  // Virtual list ref for performance
  const virtualListRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredMessages.length,
    getScrollElement: () => virtualListRef.current,
    estimateSize: () =>
      displayDensity === "compact"
        ? 52
        : displayDensity === "comfortable"
          ? 72
          : 96,
    overscan: 8,
  });

  // Handle drag & drop email to folder
  const handleDndMoveToFolder = useCallback(
    async (message: GmailMessage, folderId: string) => {
      await emailFolders.addEmailToFolder(folderId, message);
      // Refresh folder if viewing it
      if (selectedFolderId) {
        const items = await emailFolders.getEmailsInFolder(selectedFolderId);
        setFolderEmailIds(new Set(items.map((item: any) => item.email_id)));
      }
      toast({
        title: "המייל הועבר לתיקייה",
      });
    },
    [emailFolders, selectedFolderId, toast],
  );

  console.log("🔍 [Gmail] Component render COMPLETE - about to return JSX");
  return (
    <AppLayout>
      <div
        className="container mx-auto py-4 px-2 md:py-6 md:px-4 max-w-7xl"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gmail</h1>
              <p className="text-muted-foreground text-sm">
                ניהול הדוא"ל שלך במקום אחד
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {hasLoaded ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ml-2 ${isLoading ? "animate-spin" : ""}`}
                  />
                  רענון
                </Button>
                <Button onClick={() => setIsComposeOpen(true)}>
                  <PenSquare className="h-4 w-4 ml-2" />
                  כתיבת הודעה
                </Button>

                {/* Contacts Link */}
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/contacts")}
                >
                  <Users className="h-4 w-4 ml-2" />
                  אנשי קשר
                </Button>

                {/* View Mode Toggle */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="default">
                      {viewMode === "list" && (
                        <>
                          <LayoutList className="h-4 w-4 ml-2" />
                          רגיל
                        </>
                      )}
                      {viewMode === "chat" && (
                        <>
                          <MessageSquare className="h-4 w-4 ml-2" />
                          צ'אט
                        </>
                      )}
                      {viewMode === "sender-chat" && (
                        <>
                          <Users className="h-4 w-4 ml-2" />
                          צ'אט מתמשך
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rtl w-48">
                    <DropdownMenuLabel>תצוגת מייל</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={viewMode}
                      onValueChange={(v) => {
                        if (v === "list") {
                          setViewMode("list");
                          setSelectedEmail(null);
                        } else if (v === "chat") {
                          // If we have a selected email, open its thread as chat
                          if (selectedEmail) {
                            openChatView(selectedEmail);
                          } else if (filteredMessages.length > 0) {
                            openChatView(filteredMessages[0]);
                          } else {
                            setViewMode("chat");
                          }
                        } else if (v === "sender-chat") {
                          // If we have a selected email, open sender-chat for that sender
                          if (selectedEmail) {
                            openSenderChat(
                              selectedEmail.from,
                              selectedEmail.fromName || selectedEmail.from,
                            );
                          } else if (filteredMessages.length > 0) {
                            const first = filteredMessages[0];
                            openSenderChat(
                              first.from,
                              first.fromName || first.from,
                            );
                          } else {
                            setViewMode("sender-chat");
                          }
                        }
                      }}
                    >
                      <DropdownMenuRadioItem value="list">
                        <LayoutList className="h-4 w-4 ml-2" />
                        רגיל
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="chat">
                        <MessageSquare className="h-4 w-4 ml-2" />
                        צ'אט
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="sender-chat">
                        <Users className="h-4 w-4 ml-2" />
                        צ'אט מתמשך
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowShortcutsHelp(true)}
                      >
                        <Keyboard className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>קיצורי מקשים (?)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    מתחבר...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 ml-2" />
                    התחבר ל-Gmail
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Not Connected State */}
        {!hasLoaded && !isLoading && (
          <Card className="text-center py-16">
            <CardContent>
              <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">
                התחבר לחשבון Gmail שלך
              </h2>
              <p className="text-muted-foreground mb-6">
                לחץ על "התחבר ל-Gmail" כדי לצפות ולנהל את הדוא"ל שלך
              </p>
              <Button onClick={handleConnect} size="lg">
                <Mail className="h-5 w-5 ml-2" />
                התחבר עכשיו
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && !hasLoaded && (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {hasLoaded && viewMode === "chat" && selectedThreadId && (
          <Card className="h-[calc(100vh-180px)]">
            <EmailThreadChat
              threadId={selectedThreadId}
              messages={threadMessages.map((m) => ({
                ...m,
                isSent: m.from === user?.email,
              }))}
              currentUserEmail={user?.email || ""}
              subject={threadMessages[0]?.subject || ""}
              isLoading={isLoadingThread}
              isSending={isSending}
              onBack={() => {
                setViewMode("list");
                setSelectedThreadId(null);
                setThreadMessages([]);
              }}
              onSendReply={handleSendReply}
              onArchive={async (msgId) => {
                await archiveEmail(msgId);
                await loadThreadMessages(selectedThreadId);
              }}
              onDelete={async (msgId) => {
                await deleteEmail(msgId);
                await loadThreadMessages(selectedThreadId);
              }}
              onToggleStar={async (msgId, isStarred) => {
                await toggleStar(msgId, isStarred);
                await loadThreadMessages(selectedThreadId);
              }}
              onForward={(msg) => {
                const fwdSubject = msg.snippet
                  ? `Fwd: ${subject}`
                  : `Fwd: ${subject}`;
                const fwdBody = `<br/><br/><div style="color:#666;font-size:13px">---------- הודעה שהועברה ----------<br/>מאת: ${msg.fromName || msg.from}<br/>נושא: ${subject || ""}</div><br/><div>${msg.snippet || ""}</div>`;
                setComposeData({
                  to: "",
                  subject: fwdSubject,
                  quotedBody: fwdBody,
                  mode: "forward",
                });
                setIsComposeOpen(true);
              }}
            />
          </Card>
        )}

        {/* Sender Chat View */}
        {hasLoaded && viewMode === "sender-chat" && senderChatEmail && (
          <Card className="h-[calc(100vh-180px)]">
            <EmailSenderChatView
              senderEmail={senderChatEmail}
              senderName={senderChatName}
              currentUserEmail={user?.email || ""}
              fetchEmailsForSender={fetchEmailsForSender}
              getFullMessage={getFullMessage}
              extractHtmlBody={extractHtmlBody}
              resolveInlineImages={resolveInlineImages}
              onBack={() => {
                setViewMode("list");
                setSenderChatEmail("");
                setSenderChatName("");
              }}
              onReply={(msg) => {
                const replyTo = msg.from === user?.email ? msg.to[0] : msg.from;
                setComposeData({
                  to: replyTo,
                  subject: msg.subject?.startsWith("Re:")
                    ? msg.subject
                    : `Re: ${msg.subject}`,
                  quotedBody: `<br/><br/><div style="color:#666;font-size:13px">ב-${msg.date}, ${msg.fromName || msg.from} כתב/ה:</div><blockquote style="border-right:2px solid #ccc;padding-right:10px;color:#666">${msg.snippet || ""}</blockquote>`,
                  mode: "reply",
                  originalFrom: msg.from,
                  originalDate: msg.date,
                });
                setIsComposeOpen(true);
              }}
              onForward={(msg) => {
                setComposeData({
                  to: "",
                  subject: msg.subject?.startsWith("Fwd:")
                    ? msg.subject
                    : `Fwd: ${msg.subject}`,
                  quotedBody: `<br/><br/><div style="color:#666;font-size:13px">---------- הודעה שהועברה ----------<br/>מאת: ${msg.fromName || msg.from}<br/>נושא: ${msg.subject || ""}</div><br/><div>${msg.snippet || ""}</div>`,
                  mode: "forward",
                });
                setIsComposeOpen(true);
              }}
              onCompose={(to) => {
                setComposeData({
                  to,
                  subject: "",
                });
                setIsComposeOpen(true);
              }}
            />
          </Card>
        )}

        {hasLoaded && viewMode === "list" && (
          <EmailDndProvider
            messages={messages}
            onMoveToFolder={handleDndMoveToFolder}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Sidebar */}
              <ErrorBoundary
                fallback={
                  <Card className="lg:col-span-3 p-4 text-center text-muted-foreground">
                    שגיאה בטעינת הסייד-בר
                  </Card>
                }
              >
                <GmailSidebar
                  activeTab={activeTab}
                  onSetActiveTab={setActiveTab}
                  filterByLabel={filterByLabel}
                  onSetFilterByLabel={setFilterByLabel}
                  filterByPriority={filterByPriority}
                  onSetFilterByPriority={setFilterByPriority}
                  filterByClient={filterByClient}
                  onSetFilterByClient={setFilterByClient}
                  customLabels={customLabels}
                  emailLabels={emailLabels}
                  emailPriority={emailPriority}
                  remindersForToday={remindersForToday}
                  unreadCount={messages.filter((m) => !m.isRead).length}
                  clients={clients}
                  messages={messages}
                  autoTagEnabled={autoTagEnabled}
                  onSetAutoTagEnabled={setAutoTagEnabled}
                  onShowLabelManager={() => setShowLabelManager(true)}
                  onCompose={() => setIsComposeOpen(true)}
                  onOpenClientEmails={() => setIsClientEmailsDialogOpen(true)}
                  onBatchAutoClassify={async () => {
                    const count =
                      await emailFolders.batchAutoClassify(messages);
                    toast({
                      title: `סיווג אוטומטי הושלם`,
                      description: `${count || 0} מיילים סווגו לתיקיות`,
                    });
                  }}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={(folderId) => {
                    setSelectedFolderId(
                      folderId === selectedFolderId ? null : folderId,
                    );
                    setActiveTab("inbox");
                  }}
                  selectedEmail={selectedEmail}
                  onAddEmailToFolder={async (email, folderId) => {
                    if (email && folderId) {
                      await emailFolders.addEmailToFolder(folderId, email);
                    }
                  }}
                  getClientForMessage={getClientForMessage}
                />
              </ErrorBoundary>

              {/* Email List & Content */}
              <ErrorBoundary
                fallback={
                  <Card className="lg:col-span-9 p-8 text-center text-muted-foreground">
                    שגיאה בטעינת המיילים. נסה לרענן את הדף.
                  </Card>
                }
              >
                <Card className="lg:col-span-9 overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col gap-3">
                      {/* Search and Filters Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="חיפוש במיילים... (Enter לחיפוש בשרת)"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              if (!e.target.value) {
                                setServerSearchActive(false);
                              }
                            }}
                            onKeyDown={async (e) => {
                              if (
                                e.key === "Enter" &&
                                searchQuery.trim().length >= 2
                              ) {
                                e.preventDefault();
                                setServerSearchActive(true);
                                await fetchEmails(
                                  50,
                                  undefined,
                                  searchQuery.trim(),
                                );
                              }
                            }}
                            className="pr-9 text-right"
                            dir="rtl"
                          />
                          {serverSearchActive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6"
                              onClick={() => {
                                setSearchQuery("");
                                setServerSearchActive(false);
                                handleRefresh();
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        {/* Date Navigator */}
                        <EmailDateNavigator
                          selectedDate={selectedDateFilter}
                          onDateSelect={handleDateFilterSelect}
                          onClearDateFilter={handleClearDateFilter}
                          isLoading={isLoading}
                        />

                        {/* Advanced Search */}
                        <AdvancedSearchPanel
                          onSearch={async (query) => {
                            setServerSearchActive(true);
                            await fetchEmails(50, undefined, query);
                          }}
                          onClear={() => {
                            setServerSearchActive(false);
                            handleRefresh();
                          }}
                          isSearching={isLoading}
                        />

                        {/* Notifications Toggle */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={
                                  gmailNotifications.notificationsEnabled
                                    ? "default"
                                    : "outline"
                                }
                                size="icon"
                                className="h-9 w-9"
                                onClick={gmailNotifications.toggleNotifications}
                              >
                                {gmailNotifications.notificationsEnabled ? (
                                  <BellRing className="h-4 w-4" />
                                ) : (
                                  <BellOff className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {gmailNotifications.notificationsEnabled
                                ? "התראות דסקטופ פעילות"
                                : "הפעל התראות דסקטופ"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Sort Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Filter className="h-4 w-4" />
                              מיון
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rtl">
                            <DropdownMenuCheckboxItem
                              checked={sortBy === "date"}
                              onCheckedChange={() => setSortBy("date")}
                            >
                              לפי תאריך
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={sortBy === "priority"}
                              onCheckedChange={() => setSortBy("priority")}
                            >
                              לפי עדיפות
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={sortBy === "sender"}
                              onCheckedChange={() => setSortBy("sender")}
                            >
                              לפי שולח
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* View Mode Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <LayoutList className="h-4 w-4" />
                              תצוגה
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rtl">
                            <div className="px-2 py-1.5 text-sm font-medium border-b mb-1">
                              סגנון תצוגה
                            </div>
                            <DropdownMenuCheckboxItem
                              checked={displayDensity === "compact"}
                              onCheckedChange={() =>
                                setDisplayDensity("compact")
                              }
                              className="gap-2"
                            >
                              <Rows3 className="h-4 w-4" />
                              צפוף - יותר הודעות
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={displayDensity === "comfortable"}
                              onCheckedChange={() =>
                                setDisplayDensity("comfortable")
                              }
                              className="gap-2"
                            >
                              <LayoutList className="h-4 w-4" />
                              נוח - מאוזן
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={displayDensity === "spacious"}
                              onCheckedChange={() =>
                                setDisplayDensity("spacious")
                              }
                              className="gap-2"
                            >
                              <Maximize2 className="h-4 w-4" />
                              מרווח - קריאות מקסימלית
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator />
                            <div className="px-2 py-1.5 text-sm font-medium">
                              אפשרויות נוספות
                            </div>
                            <DropdownMenuCheckboxItem
                              checked={showPreview}
                              onCheckedChange={(checked) =>
                                setShowPreview(checked)
                              }
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              הצג תצוגה מקדימה
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Email count */}
                      <div className="text-xs text-muted-foreground px-2 py-1">
                        {serverSearchActive
                          ? `${filteredMessages.length} תוצאות חיפוש`
                          : `מציג ${filteredMessages.length} מתוך ${messages.length} הודעות`}
                      </div>

                      {/* Bulk Actions (when messages are selected) */}
                      {selectedMessages.size > 0 && (
                        <BulkActionsBar
                          selectedCount={selectedMessages.size}
                          totalCount={filteredMessages.length}
                          onSelectAll={selectAllMessages}
                          onClearSelection={() =>
                            setSelectedMessages(new Set())
                          }
                          customLabels={customLabels}
                          onBulkAddLabel={bulkAddLabel}
                          onBulkSetPriority={bulkSetPriority}
                          folders={emailFolders.folders}
                          onBulkMoveToFolder={bulkMoveToFolder}
                          onBulkArchive={async () => {
                            const ids = [...selectedMessages];
                            const success = await batchModify(
                              ids,
                              [],
                              ["INBOX"],
                            );
                            if (success) {
                              setSelectedMessages(new Set());
                              handleRefresh();
                              toast({
                                title: `${ids.length} מיילים הועברו לארכיון`,
                              });
                            }
                          }}
                          onBulkMarkRead={async () => {
                            const ids = [...selectedMessages];
                            const success = await batchModify(
                              ids,
                              [],
                              ["UNREAD"],
                            );
                            if (success) {
                              setSelectedMessages(new Set());
                              handleRefresh();
                              toast({
                                title: `${ids.length} מיילים סומנו כנקראו`,
                              });
                            }
                          }}
                          onBulkSpam={async () => {
                            const ids = [...selectedMessages];
                            const success = await batchModify(
                              ids,
                              ["SPAM"],
                              ["INBOX"],
                            );
                            if (success) {
                              setSelectedMessages(new Set());
                              handleRefresh();
                              toast({
                                title: `${ids.length} מיילים דווחו כספאם`,
                              });
                            }
                          }}
                        />
                      )}

                      {/* Active Filters Display */}
                      {(filterByLabel || filterByPriority) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-muted-foreground">
                            מסננים פעילים:
                          </span>
                          {filterByLabel && (
                            <Badge
                              variant="secondary"
                              className="gap-1 cursor-pointer"
                              onClick={() => setFilterByLabel(null)}
                            >
                              <div
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  customLabels.find(
                                    (l) => l.id === filterByLabel,
                                  )?.color,
                                )}
                              />
                              {
                                customLabels.find((l) => l.id === filterByLabel)
                                  ?.name
                              }
                              <X className="h-3 w-3 mr-1" />
                            </Badge>
                          )}
                          {filterByPriority && (
                            <Badge
                              variant="secondary"
                              className="gap-1 cursor-pointer"
                              onClick={() => setFilterByPriority(null)}
                            >
                              {PRIORITY_CONFIG[filterByPriority].icon}
                              {PRIORITY_CONFIG[filterByPriority].label}
                              <X className="h-3 w-3 mr-1" />
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 relative overflow-hidden">
                    {selectedEmail ? (
                      /* Email Detail View - full overlay so no list bleeds through */
                      <div className="bg-background min-h-[600px] max-h-[calc(100vh-250px)] overflow-y-auto">
                        <EmailDetailView
                          selectedEmail={selectedEmail}
                          emailHtmlBody={emailHtmlBody}
                          loadingBody={loadingBody}
                          emailAttachments={emailAttachments}
                          loadingAttachments={loadingAttachments}
                          downloadingAtt={downloadingAtt}
                          emailPriority={emailPriority}
                          emailLabels={emailLabels}
                          emailReminders={emailReminders}
                          emailNotes={emailNotes}
                          customLabels={customLabels}
                          mutedThreads={mutedThreads}
                          clients={clients}
                          user={user}
                          getMetadata={(id) => emailMetadata.getMetadata(id)}
                          setPin={(id, val) => emailMetadata.setPin(id, val)}
                          getLinkedClientId={(id) =>
                            emailMetadata.getMetadata(id)?.linked_client_id ||
                            null
                          }
                          actionLoading={actionLoading}
                          onBack={() => setSelectedEmail(null)}
                          onOpenChatView={openChatView}
                          onCompose={(data) => {
                            setComposeData(data);
                            setIsComposeOpen(true);
                          }}
                          onMarkAsRead={markAsRead}
                          onArchive={archiveEmail}
                          onDelete={deleteEmail}
                          onReportSpam={reportSpam}
                          onRefresh={handleRefresh}
                          onSnooze={handleSnooze}
                          onMuteThread={handleMuteThread}
                          onPrint={handlePrintEmail}
                          onDownloadAttachment={handleDownloadAttachment}
                          setActionLoading={setActionLoading}
                          setSelectedEmailForAction={setSelectedEmailForAction}
                          setIsReminderDialogOpen={setIsReminderDialogOpen}
                          setIsNoteDialogOpen={setIsNoteDialogOpen}
                          toggleEmailLabel={toggleEmailLabel}
                          setEmailPriorityLevel={setEmailPriorityLevel}
                          buildQuotedBody={buildQuotedBody}
                          formatDate={formatDate}
                          getClientForMessage={getClientForMessage}
                          onCreateTask={handleCreateTaskFromEmail}
                          onCreateMeeting={handleCreateMeetingFromEmail}
                          onCreateReminder={handleCreateReminderFromEmail}
                          onLinkClient={handleLinkClient}
                        />
                      </div>
                    ) : (
                      /* Email List View */
                      <div className="relative">
                        {/* Floating Date Indicator */}
                        <FloatingDateIndicator
                          currentDate={scrollCurrentDate}
                          isVisible={isScrolling}
                        />

                        <div
                          className="h-[600px] overflow-auto"
                          ref={(el) => {
                            virtualListRef.current = el;
                            (scrollContainerRef as any).current = el;
                          }}
                        >
                          {filteredMessages.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>לא נמצאו הודעות</p>
                              {selectedDateFilter && (
                                <Button
                                  variant="link"
                                  onClick={handleClearDateFilter}
                                  className="mt-2"
                                >
                                  נקה סינון תאריך
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div
                              className="divide-y relative"
                              dir="rtl"
                              style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                              }}
                            >
                              {rowVirtualizer
                                .getVirtualItems()
                                .map((virtualRow) => {
                                  const index = virtualRow.index;
                                  const message = filteredMessages[index];
                                  const prevMessage =
                                    index > 0
                                      ? filteredMessages[index - 1]
                                      : null;
                                  const showDateSeparator =
                                    !prevMessage ||
                                    !isSameDay(
                                      new Date(message.date),
                                      new Date(prevMessage.date),
                                    );

                                  return (
                                    <div
                                      key={virtualRow.key}
                                      data-index={virtualRow.index}
                                      style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        transform: `translateY(${virtualRow.start}px)`,
                                      }}
                                      ref={rowVirtualizer.measureElement}
                                    >
                                      {showDateSeparator && (
                                        <DateSeparator date={message.date} />
                                      )}
                                      <EmailListItem
                                        message={message}
                                        index={index}
                                        isSelected={selectedMessages.has(
                                          message.id,
                                        )}
                                        displayDensity={displayDensity}
                                        showPreview={showPreview}
                                        threadCount={
                                          threadCounts[message.threadId] || 0
                                        }
                                        emailPriority={
                                          emailPriority[message.id]
                                        }
                                        emailLabels={emailLabels[message.id]}
                                        hasReminder={
                                          !!emailReminders[message.id]
                                        }
                                        hasNote={!!emailNotes[message.id]}
                                        isPinned={
                                          emailMetadata.getMetadata(message.id)
                                            ?.is_pinned || false
                                        }
                                        client={getClientForMessage(message)}
                                        customLabels={customLabels}
                                        mutedThreads={mutedThreads}
                                        folders={emailFolders.folders}
                                        activeFolderId={selectedFolderId}
                                        activeFolderName={
                                          emailFolders.folders.find(
                                            (f: any) =>
                                              f.id === selectedFolderId,
                                          )?.name
                                        }
                                        onRemoveFromFolder={async (
                                          folderId,
                                          emailId,
                                        ) => {
                                          await emailFolders.removeEmailFromFolder(
                                            folderId,
                                            emailId,
                                          );
                                          // Refresh folder view
                                          const items =
                                            await emailFolders.getEmailsInFolder(
                                              folderId,
                                            );
                                          setFolderEmailIds(
                                            new Set(
                                              items.map(
                                                (item: any) => item.email_id,
                                              ),
                                            ),
                                          );
                                          toast({
                                            title: "המייל הוסר מהתיקייה",
                                          });
                                        }}
                                        onSelect={() => {
                                          setSelectedEmail(message);
                                          if (!message.isRead) {
                                            markAsRead(message.id, true).then(
                                              () => handleRefresh(),
                                            );
                                          }
                                        }}
                                        onToggleSelection={
                                          toggleMessageSelection
                                        }
                                        onToggleStar={toggleStar}
                                        onOpenChat={openChatView}
                                        onOpenSenderChat={openSenderChat}
                                        onSetReminder={(msg) => {
                                          setSelectedEmailForAction(msg);
                                          setIsReminderDialogOpen(true);
                                        }}
                                        onSetNote={(msg) => {
                                          setSelectedEmailForAction(msg);
                                          setIsNoteDialogOpen(true);
                                        }}
                                        onMarkAsRead={markAsRead}
                                        onTogglePin={(messageId, isPinned) => {
                                          emailMetadata.setPin(
                                            messageId,
                                            !isPinned,
                                          );
                                        }}
                                        onReply={(msg) => {
                                          const replySubject =
                                            msg.subject?.startsWith("Re:")
                                              ? msg.subject
                                              : `Re: ${msg.subject || ""}`;
                                          setComposeData({
                                            to: msg.from,
                                            subject: replySubject,
                                          });
                                          setIsComposeOpen(true);
                                        }}
                                        onForward={(msg) => {
                                          const fwdSubject =
                                            msg.subject?.startsWith("Fwd:")
                                              ? msg.subject
                                              : `Fwd: ${msg.subject || ""}`;
                                          setComposeData({
                                            to: "",
                                            subject: fwdSubject,
                                          });
                                          setIsComposeOpen(true);
                                        }}
                                        onMoveToFolder={async (
                                          folderId,
                                          msg,
                                        ) => {
                                          await emailFolders.addEmailToFolder(
                                            folderId,
                                            msg,
                                          );
                                          if (selectedFolderId) {
                                            const items =
                                              await emailFolders.getEmailsInFolder(
                                                selectedFolderId,
                                              );
                                            setFolderEmailIds(
                                              new Set(
                                                items.map(
                                                  (item: any) => item.email_id,
                                                ),
                                              ),
                                            );
                                          }
                                          const folderName =
                                            emailFolders.folders.find(
                                              (f: any) => f.id === folderId,
                                            )?.name || "תיקייה";
                                          toast({
                                            title: `תויג בתיקייה "${folderName}"`,
                                          });
                                        }}
                                        onArchive={archiveEmail}
                                        onDelete={deleteEmail}
                                        onReportSpam={reportSpam}
                                        onMuteThread={handleMuteThread}
                                        onSnooze={handleSnooze}
                                        onRefresh={handleRefresh}
                                        formatDate={formatDate}
                                        onHoverPreview={handleHoverPreview}
                                      />
                                    </div>
                                  );
                                })}

                              {/* Load More Trigger */}
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  width: "100%",
                                }}
                              >
                                <LoadMoreTrigger
                                  onLoadMore={loadMoreEmails}
                                  isLoading={isLoadingMore}
                                  hasMore={hasMore && !selectedDateFilter}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ErrorBoundary>
            </div>
          </EmailDndProvider>
        )}

        {/* Compose Dialog */}
        <ComposeEmailDialog
          open={isComposeOpen}
          onOpenChange={(open) => {
            setIsComposeOpen(open);
            if (!open) setComposeData(undefined);
          }}
          replyTo={composeData}
          onSendSuccess={() => {
            setIsComposeOpen(false);
            setComposeData(undefined);
            handleRefresh();
          }}
        />

        {/* Client Emails Dialog */}
        <ClientEmailsDialog
          open={isClientEmailsDialogOpen}
          onOpenChange={setIsClientEmailsDialogOpen}
          emails={messages}
          onEmailClick={(email) => {
            setSelectedEmail(email);
            setIsClientEmailsDialogOpen(false);
          }}
        />

        {/* Reminder Dialog */}
        <EmailReminderDialog
          open={isReminderDialogOpen}
          onOpenChange={setIsReminderDialogOpen}
          selectedEmail={selectedEmailForAction}
          emailReminders={emailReminders}
          onSetReminder={setEmailReminder}
        />

        {/* Note Dialog */}
        <EmailNoteDialog
          open={isNoteDialogOpen}
          onOpenChange={setIsNoteDialogOpen}
          selectedEmail={selectedEmailForAction}
          emailNotes={emailNotes}
          onSaveNote={saveEmailNote}
        />

        {/* Quick Add Task Dialog */}
        <QuickAddTask
          open={isAddTaskOpen}
          onOpenChange={setIsAddTaskOpen}
          onSubmit={handleCreateTask}
          clients={clients}
          initialData={taskInitialData}
        />

        {/* Quick Add Meeting Dialog */}
        <QuickAddMeeting
          open={isAddMeetingOpen}
          onOpenChange={setIsAddMeetingOpen}
          onSubmit={handleCreateMeeting}
          clients={clients}
          initialData={meetingInitialData}
        />

        {/* Label Manager Dialog */}
        <LabelManagerDialog
          open={showLabelManager}
          onOpenChange={setShowLabelManager}
          customLabels={customLabels}
          onSetCustomLabels={setCustomLabels}
          emailLabels={emailLabels}
        />

        {/* Undo Send Bar */}
        {undoSendState && (
          <UndoSendBar
            countdown={undoSendState.countdown}
            onCancel={cancelUndoSend}
          />
        )}

        {/* Hover Preview Panel - draggable, resizable, closes on mouse leave */}
        {showPreviewDialog && previewMessage && (
          <div
            className="fixed z-[401] rounded-lg bg-background shadow-2xl"
            style={{
              display: "flex",
              flexDirection: "column",
              top: Math.max(
                56,
                Math.min(previewRect.y, window.innerHeight - previewRect.h - 4),
              ),
              left: Math.max(
                4,
                Math.min(previewRect.x, window.innerWidth - previewRect.w - 4),
              ),
              width: Math.min(previewRect.w, window.innerWidth - 8),
              height: Math.min(previewRect.h, window.innerHeight - 56),
              border: "3px solid #d4a843",
              boxShadow: "0 0 0 1px #b8962e, 0 25px 50px -12px rgba(0,0,0,0.4)",
              overflow: "hidden",
            }}
            dir="rtl"
            onMouseEnter={() => {
              if (previewLeaveTimerRef.current) {
                clearTimeout(previewLeaveTimerRef.current);
                previewLeaveTimerRef.current = null;
              }
            }}
            onMouseLeave={() => {
              if (previewLeaveTimerRef.current)
                clearTimeout(previewLeaveTimerRef.current);
              previewLeaveTimerRef.current = setTimeout(() => {
                setShowPreviewDialog(false);
                previewLeaveTimerRef.current = null;
              }, 400);
            }}
          >
            {/* Draggable Header */}
            <div
              style={{
                flexShrink: 0,
                borderBottom: "2px solid #d4a843",
                padding: "12px",
                cursor: "move",
                userSelect: "none",
              }}
              onMouseDown={onDragStart}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-50" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate text-right">
                      {previewMessage.subject || "(ללא נושא)"}
                    </h3>
                    <p className="text-sm text-muted-foreground text-right truncate">
                      {previewMessage.fromName} &lt;{previewMessage.from}&gt;
                    </p>
                    <p className="text-xs text-muted-foreground text-right">
                      {formatDate(previewMessage.date)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreviewDialog(false)}
                  className="rounded-sm opacity-70 hover:opacity-100 transition-opacity p-1 mr-2"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body - scrollable content area using ScrollArea */}
            <ScrollArea
              data-preview-body
              dir="rtl"
              className="flex-1 min-h-0"
              style={{ direction: "rtl" }}
            >
              <div className="p-4">
                {hoverPreviewLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : hoverPreviewHtml ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    style={{ overflowX: "hidden", wordBreak: "break-word" }}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(hoverPreviewHtml, {
                        ALLOW_UNKNOWN_PROTOCOLS: true,
                      }),
                    }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {previewMessage.snippet}
                  </p>
                )}
              </div>
            </ScrollArea>

            {/* Footer actions */}
            <div
              className="flex items-center gap-2 p-2"
              dir="rtl"
              style={{ flexShrink: 0, borderTop: "2px solid #d4a843" }}
            >
              <span className="text-[9px] text-muted-foreground opacity-40 ml-auto">
                v7
              </span>
              <Button
                size="sm"
                variant="outline"
                className="border-[#d4a843] hover:bg-[#f8f3e6] text-xs"
                onClick={() => {
                  setShowPreviewDialog(false);
                  setSelectedEmail(previewMessage);
                  if (!previewMessage.isRead) {
                    markAsRead(previewMessage.id, true).then(() =>
                      handleRefresh(),
                    );
                  }
                }}
              >
                פתח מייל מלא
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-[#d4a843] hover:bg-[#f8f3e6] text-xs"
                onClick={() => {
                  setShowPreviewDialog(false);
                  const replySubject = previewMessage.subject?.startsWith("Re:")
                    ? previewMessage.subject
                    : `Re: ${previewMessage.subject}`;
                  setDraftData({
                    to: previewMessage.from,
                    subject: replySubject,
                  });
                  setIsComposeOpen(true);
                }}
              >
                <Reply className="h-3 w-3 ml-1" />
                השב
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-[#d4a843] hover:bg-[#f8f3e6] text-xs"
                onClick={() => {
                  setShowPreviewDialog(false);
                  const fwdSubject = previewMessage.subject?.startsWith("Fwd:")
                    ? previewMessage.subject
                    : `Fwd: ${previewMessage.subject}`;
                  setDraftData({ to: "", subject: fwdSubject });
                  setIsComposeOpen(true);
                }}
              >
                <Forward className="h-3 w-3 ml-1" />
                העבר
              </Button>
            </div>

            {/* Resize handles - all edges and corners */}
            {/* Edges */}
            <div
              className="absolute top-0 left-3 right-3 h-[5px] cursor-n-resize"
              onMouseDown={(e) => onEdgeResizeStart(e, "t")}
            />
            <div
              className="absolute bottom-0 left-3 right-3 h-[5px] cursor-s-resize"
              onMouseDown={(e) => onEdgeResizeStart(e, "b")}
            />
            <div
              className="absolute left-0 top-3 bottom-3 w-[5px] cursor-w-resize"
              onMouseDown={(e) => onEdgeResizeStart(e, "l")}
            />
            <div
              className="absolute right-0 top-3 bottom-3 w-[5px] cursor-e-resize"
              onMouseDown={(e) => onEdgeResizeStart(e, "r")}
            />
            {/* Corners */}
            <div
              className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
              onMouseDown={(e) => onEdgeResizeStart(e, "tl")}
              style={{
                borderLeft: "3px solid #d4a843",
                borderTop: "3px solid #d4a843",
                borderTopLeftRadius: "6px",
              }}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
              onMouseDown={(e) => onEdgeResizeStart(e, "tr")}
              style={{
                borderRight: "3px solid #d4a843",
                borderTop: "3px solid #d4a843",
                borderTopRightRadius: "6px",
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
              onMouseDown={(e) => onEdgeResizeStart(e, "bl")}
              style={{
                borderLeft: "3px solid #d4a843",
                borderBottom: "3px solid #d4a843",
                borderBottomLeftRadius: "6px",
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
              onMouseDown={(e) => onEdgeResizeStart(e, "br")}
              style={{
                borderRight: "3px solid #d4a843",
                borderBottom: "3px solid #d4a843",
                borderBottomRightRadius: "6px",
              }}
            />
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsDialog
          open={showShortcutsHelp}
          onOpenChange={setShowShortcutsHelp}
        />
      </div>
    </AppLayout>
  );
}
