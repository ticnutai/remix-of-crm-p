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
  Keyboard,
} from "lucide-react";
import {
  useGmailIntegration,
  GmailMessage,
  EmailAttachment,
} from "@/hooks/useGmailIntegration";
import { useGoogleServices } from "@/hooks/useGoogleServices";
import { useEmailActions } from "@/hooks/useEmailActions";
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
} from "@/components/gmail";
import { useEmailFolders } from "@/hooks/useEmailFolders";

// Client interface for auto-tagging
interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

// Email Labels/Tags Configuration
interface EmailLabel {
  id: string;
  name: string;
  color: string;
  icon?: React.ReactNode;
}

const DEFAULT_LABELS: EmailLabel[] = [
  { id: "client", name: "לקוח", color: "bg-blue-500" },
  { id: "project", name: "פרויקט", color: "bg-green-500" },
  { id: "urgent", name: "דחוף", color: "bg-red-500" },
  { id: "followup", name: "מעקב", color: "bg-orange-500" },
  { id: "invoice", name: "חשבונית", color: "bg-purple-500" },
  { id: "meeting", name: "פגישה", color: "bg-pink-500" },
  { id: "task", name: "משימה", color: "bg-yellow-500" },
  { id: "info", name: "מידע", color: "bg-gray-500" },
];

// Priority levels
type Priority = "high" | "medium" | "low" | "none";

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; icon: React.ReactNode }
> = {
  high: {
    label: "גבוהה",
    color: "text-red-600",
    icon: <Flag className="h-4 w-4 text-red-500 fill-red-500" />,
  },
  medium: {
    label: "בינונית",
    color: "text-orange-600",
    icon: <Flag className="h-4 w-4 text-orange-500 fill-orange-500" />,
  },
  low: {
    label: "נמוכה",
    color: "text-blue-600",
    icon: <Flag className="h-4 w-4 text-blue-500" />,
  },
  none: {
    label: "ללא",
    color: "text-gray-400",
    icon: <Flag className="h-4 w-4 text-gray-300" />,
  },
};

export default function Gmail() {
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
  const { isConnected } = useGoogleServices();
  const { user } = useAuth();
  const { createTask: createTaskOriginal } = useTasks();
  const { createMeeting: createMeetingOriginal } = useMeetings();
  const emailMetadata = useEmailMetadata();
  const emailFolders = useEmailFolders();
  const { toast } = useToast();
  const { archiveEmail, deleteEmail, toggleStar, markAsRead } =
    useEmailActions();
  const [hasLoaded, setHasLoaded] = useState(false);
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
  const [viewMode, setViewMode] = useState<"list" | "chat">("list");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<GmailMessage[]>([]);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

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
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("bg-gray-500");
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

  // Auto-load emails if already connected
  useEffect(() => {
    if (isConnected && !hasLoaded && !isLoading) {
      fetchEmails(50).then(() => setHasLoaded(true));
    }
  }, [isConnected, hasLoaded, isLoading, fetchEmails]);

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

  // Load attachments + body in a single API call when an email is selected
  useEffect(() => {
    if (!selectedEmail) {
      setEmailAttachments([]);
      setEmailHtmlBody("");
      return;
    }
    const loadEmailData = async () => {
      setLoadingAttachments(true);
      setLoadingBody(true);
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

        // Extract HTML body
        const html = extractHtmlBody(fullMsg.payload);
        setEmailHtmlBody(html);
      } catch (e) {
        console.error("Error loading email data:", e);
      }
      setLoadingAttachments(false);
      setLoadingBody(false);
    };
    loadEmailData();
  }, [selectedEmail?.id, getFullMessage, extractHtmlBody]);

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

  // Filter and sort messages
  const filteredMessages = useMemo(() => {
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

  const handleConnect = useCallback(async () => {
    await fetchEmails(50);
    setHasLoaded(true);
  }, [fetchEmails]);

  const handleRefresh = useCallback(async () => {
    setSelectedDateFilter(null);
    await fetchEmails(50);
  }, [fetchEmails]);

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

        {hasLoaded && viewMode === "list" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Sidebar */}
            <Card className="lg:col-span-3 h-fit max-h-[calc(100vh-180px)] overflow-hidden">
              <ScrollArea className="h-full">
                <CardContent className="p-4 text-right">
                  <Button
                    onClick={() => setIsComposeOpen(true)}
                    className="w-full mb-4"
                    size="lg"
                  >
                    <PenSquare className="h-4 w-4 ml-2" />
                    כתיבת הודעה
                  </Button>

                  <nav className="space-y-1">
                    <Button
                      variant={activeTab === "inbox" ? "secondary" : "ghost"}
                      className="w-full justify-start text-right"
                      onClick={() => {
                        setActiveTab("inbox");
                        setFilterByLabel(null);
                      }}
                    >
                      <Inbox className="h-4 w-4 ml-2" />
                      דואר נכנס
                      {messages.filter((m) => !m.isRead).length > 0 && (
                        <Badge variant="secondary" className="mr-auto">
                          {messages.filter((m) => !m.isRead).length}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant={activeTab === "starred" ? "secondary" : "ghost"}
                      className="w-full justify-start text-right"
                      onClick={() => {
                        setActiveTab("starred");
                        setFilterByLabel(null);
                      }}
                    >
                      <Star className="h-4 w-4 ml-2" />
                      מסומנים בכוכב
                    </Button>
                    <Button
                      variant={activeTab === "sent" ? "secondary" : "ghost"}
                      className="w-full justify-start text-right"
                      onClick={() => {
                        setActiveTab("sent");
                        setFilterByLabel(null);
                      }}
                    >
                      <Send className="h-4 w-4 ml-2" />
                      נשלחו
                    </Button>

                    {/* Reminders */}
                    <Button
                      variant={
                        activeTab === "reminders" ? "secondary" : "ghost"
                      }
                      className="w-full justify-start text-right"
                      onClick={() => setActiveTab("reminders")}
                    >
                      <Bell className="h-4 w-4 ml-2 text-orange-500" />
                      תזכורות
                      {remindersForToday > 0 && (
                        <Badge variant="destructive" className="mr-auto">
                          {remindersForToday}
                        </Badge>
                      )}
                    </Button>

                    <Separator className="my-2" />

                    <Button
                      variant={activeTab === "drafts" ? "secondary" : "ghost"}
                      className="w-full justify-start text-right"
                      onClick={() => {
                        setActiveTab("drafts");
                        setFilterByLabel(null);
                      }}
                    >
                      <FileText className="h-4 w-4 ml-2 text-muted-foreground" />
                      טיוטות
                    </Button>
                    <Button
                      variant={activeTab === "spam" ? "secondary" : "ghost"}
                      className="w-full justify-start text-right"
                      onClick={() => {
                        setActiveTab("spam");
                        setFilterByLabel(null);
                      }}
                    >
                      <ShieldAlert className="h-4 w-4 ml-2 text-yellow-600" />
                      ספאם
                    </Button>
                    <Button
                      variant={activeTab === "trash" ? "secondary" : "ghost"}
                      className="w-full justify-start text-right"
                      onClick={() => {
                        setActiveTab("trash");
                        setFilterByLabel(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4 ml-2 text-red-500" />
                      אשפה
                    </Button>
                  </nav>

                  <Separator className="my-4" />

                  {/* Labels Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        תוויות
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowLabelManager(true)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                    {customLabels.map((label) => {
                      const count = Object.values(emailLabels).filter(
                        (labels) => labels.includes(label.id),
                      ).length;
                      return (
                        <Button
                          key={label.id}
                          variant={
                            filterByLabel === label.id ? "secondary" : "ghost"
                          }
                          className="w-full justify-start text-right h-8"
                          onClick={() =>
                            setFilterByLabel(
                              filterByLabel === label.id ? null : label.id,
                            )
                          }
                        >
                          <div
                            className={cn(
                              "h-3 w-3 rounded-full ml-2",
                              label.color,
                            )}
                          />
                          {label.name}
                          {count > 0 && (
                            <span className="mr-auto text-xs text-muted-foreground">
                              {count}
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>

                  <Separator className="my-4" />

                  {/* Priority Filter */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      סינון לפי עדיפות
                    </h3>
                    {Object.entries(PRIORITY_CONFIG)
                      .filter(([key]) => key !== "none")
                      .map(([key, config]) => {
                        const count = Object.values(emailPriority).filter(
                          (p) => p === key,
                        ).length;
                        return (
                          <Button
                            key={key}
                            variant={
                              filterByPriority === key ? "secondary" : "ghost"
                            }
                            className="w-full justify-start text-right h-8"
                            onClick={() =>
                              setFilterByPriority(
                                filterByPriority === key
                                  ? null
                                  : (key as Priority),
                              )
                            }
                          >
                            {config.icon}
                            <span className="mr-2">{config.label}</span>
                            {count > 0 && (
                              <span className="mr-auto text-xs text-muted-foreground">
                                {count}
                              </span>
                            )}
                          </Button>
                        );
                      })}
                  </div>

                  {/* Clients Filter */}
                  {clients.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            סינון לפי לקוח
                          </h3>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    setAutoTagEnabled(!autoTagEnabled)
                                  }
                                >
                                  {autoTagEnabled ? (
                                    <Tag className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <Tag className="h-3.5 w-3.5 text-gray-400" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                {autoTagEnabled
                                  ? "תיוג אוטומטי פעיל"
                                  : "תיוג אוטומטי כבוי"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <ScrollArea className="h-32">
                          {clients.slice(0, 10).map((client) => {
                            const count = messages.filter((msg) => {
                              const c = getClientForMessage(msg);
                              return c && c.id === client.id;
                            }).length;
                            return (
                              <Button
                                key={client.id}
                                variant={
                                  filterByClient === client.id
                                    ? "secondary"
                                    : "ghost"
                                }
                                className="w-full justify-start text-right h-8"
                                onClick={() =>
                                  setFilterByClient(
                                    filterByClient === client.id
                                      ? null
                                      : client.id,
                                  )
                                }
                              >
                                <Building2 className="h-4 w-4 text-blue-500" />
                                <span className="mr-2 truncate">
                                  {client.name}
                                </span>
                                {count > 0 && (
                                  <span className="mr-auto text-xs text-muted-foreground">
                                    {count}
                                  </span>
                                )}
                              </Button>
                            );
                          })}
                        </ScrollArea>

                        {/* Button to open client emails dialog */}
                        <Button
                          variant="outline"
                          className="w-full mt-2 text-sm"
                          onClick={() => setIsClientEmailsDialogOpen(true)}
                        >
                          <Users className="h-4 w-4 ml-2" />
                          זיהוי מיילים לפי לקוחות
                        </Button>

                        {/* Auto-classify button */}
                        <Button
                          variant="outline"
                          className="w-full mt-1 text-sm"
                          onClick={async () => {
                            const count =
                              await emailFolders.batchAutoClassify(messages);
                            toast({
                              title: `סיווג אוטומטי הושלם`,
                              description: `${count || 0} מיילים סווגו לתיקיות`,
                            });
                          }}
                        >
                          <Sparkles className="h-4 w-4 ml-2" />
                          סיווג אוטומטי לתיקיות
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Email Folders Panel */}
                  <Separator className="my-4" />
                  <EmailFoldersPanel
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={(folderId) => {
                      setSelectedFolderId(
                        folderId === selectedFolderId ? null : folderId,
                      );
                      setActiveTab("inbox");
                    }}
                    currentEmail={selectedEmail}
                    onAddEmailToFolder={async (email, folderId) => {
                      if (email && folderId) {
                        await emailFolders.addEmailToFolder(folderId, email);
                      }
                    }}
                  />
                </CardContent>
              </ScrollArea>
            </Card>

            {/* Email List & Content */}
            <Card className="lg:col-span-9">
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

                    {/* Sort Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
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
                        <Button variant="outline" size="sm" className="gap-2">
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
                          onCheckedChange={() => setDisplayDensity("compact")}
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
                          onCheckedChange={() => setDisplayDensity("spacious")}
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
                          onCheckedChange={(checked) => setShowPreview(checked)}
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
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <Checkbox
                        checked={
                          selectedMessages.size === filteredMessages.length
                        }
                        onCheckedChange={selectAllMessages}
                      />
                      <span className="text-sm font-medium mr-2">
                        {selectedMessages.size} נבחרו
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Tag className="h-4 w-4 ml-2" />
                            הוסף תווית
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="rtl">
                          {customLabels.map((label) => (
                            <DropdownMenuItem
                              key={label.id}
                              onClick={() => bulkAddLabel(label.id)}
                            >
                              <div
                                className={cn(
                                  "h-3 w-3 rounded-full ml-2",
                                  label.color,
                                )}
                              />
                              {label.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Flag className="h-4 w-4 ml-2" />
                            קבע עדיפות
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="rtl">
                          {Object.entries(PRIORITY_CONFIG).map(
                            ([key, config]) => (
                              <DropdownMenuItem
                                key={key}
                                onClick={() => bulkSetPriority(key as Priority)}
                              >
                                {config.icon}
                                <span className="mr-2">{config.label}</span>
                              </DropdownMenuItem>
                            ),
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMessages(new Set())}
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      <Separator orientation="vertical" className="h-5" />

                      {/* Batch API actions */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const ids = [...selectedMessages];
                          const success = await batchModify(ids, [], ["INBOX"]);
                          if (success) {
                            setSelectedMessages(new Set());
                            handleRefresh();
                            toast({
                              title: `${ids.length} מיילים הועברו לארכיון`,
                            });
                          }
                        }}
                      >
                        <Archive className="h-4 w-4 ml-1" />
                        ארכיון
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
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
                      >
                        <MailOpen className="h-4 w-4 ml-1" />
                        סמן נקרא
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500"
                        onClick={async () => {
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
                      >
                        <ShieldAlert className="h-4 w-4 ml-1" />
                        ספאם
                      </Button>
                    </div>
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
                              customLabels.find((l) => l.id === filterByLabel)
                                ?.color,
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

              <CardContent className="p-0">
                {selectedEmail ? (
                  /* Email Detail View */
                  <div className="p-4" dir="rtl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedEmail(null)}
                        >
                          <ChevronLeft className="h-4 w-4 ml-2" />
                          חזרה לרשימה
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openChatView(selectedEmail)}
                          className="gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          תצוגת שיחה
                        </Button>
                      </div>

                      {/* Email Actions */}
                      <div className="flex items-center gap-1">
                        {/* Labels */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Tag className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rtl">
                            <div className="px-2 py-1.5 text-sm font-medium">
                              תוויות
                            </div>
                            {customLabels.map((label) => (
                              <DropdownMenuCheckboxItem
                                key={label.id}
                                checked={emailLabels[
                                  selectedEmail.id
                                ]?.includes(label.id)}
                                onCheckedChange={() =>
                                  toggleEmailLabel(selectedEmail.id, label.id)
                                }
                              >
                                <div
                                  className={cn(
                                    "h-3 w-3 rounded-full ml-2",
                                    label.color,
                                  )}
                                />
                                {label.name}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Priority */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              {
                                PRIORITY_CONFIG[
                                  emailPriority[selectedEmail.id] || "none"
                                ].icon
                              }
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rtl">
                            <div className="px-2 py-1.5 text-sm font-medium">
                              עדיפות
                            </div>
                            {Object.entries(PRIORITY_CONFIG).map(
                              ([key, config]) => (
                                <DropdownMenuCheckboxItem
                                  key={key}
                                  checked={
                                    emailPriority[selectedEmail.id] === key
                                  }
                                  onCheckedChange={() =>
                                    setEmailPriorityLevel(
                                      selectedEmail.id,
                                      key as Priority,
                                    )
                                  }
                                >
                                  {config.icon}
                                  <span className="mr-2">{config.label}</span>
                                </DropdownMenuCheckboxItem>
                              ),
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Reminder */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={
                                  emailReminders[selectedEmail.id]
                                    ? "text-orange-500"
                                    : ""
                                }
                                onClick={() => {
                                  setSelectedEmailForAction(selectedEmail);
                                  setIsReminderDialogOpen(true);
                                }}
                              >
                                <Bell className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {emailReminders[selectedEmail.id]
                                ? `תזכורת: ${format(new Date(emailReminders[selectedEmail.id]), "dd/MM/yyyy HH:mm")}`
                                : "הוסף תזכורת"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Note */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={
                                  emailNotes[selectedEmail.id]
                                    ? "text-blue-500"
                                    : ""
                                }
                                onClick={() => {
                                  setSelectedEmailForAction(selectedEmail);
                                  setIsNoteDialogOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {emailNotes[selectedEmail.id]
                                ? "ערוך הערה"
                                : "הוסף הערה"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const replySubject =
                                    selectedEmail.subject?.startsWith("Re:")
                                      ? selectedEmail.subject
                                      : `Re: ${selectedEmail.subject || ""}`;
                                  setComposeData({
                                    to: selectedEmail.from,
                                    subject: replySubject,
                                    quotedBody: buildQuotedBody(
                                      selectedEmail,
                                      "reply",
                                    ),
                                    mode: "reply",
                                    originalFrom: selectedEmail.from,
                                    originalDate: formatDate(
                                      selectedEmail.date,
                                    ),
                                  });
                                  setIsComposeOpen(true);
                                }}
                              >
                                <Reply className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>השב</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const fwdSubject =
                                    selectedEmail.subject?.startsWith("Fwd:")
                                      ? selectedEmail.subject
                                      : `Fwd: ${selectedEmail.subject || ""}`;
                                  setComposeData({
                                    to: "",
                                    subject: fwdSubject,
                                    quotedBody: buildQuotedBody(
                                      selectedEmail,
                                      "forward",
                                    ),
                                    mode: "forward",
                                    originalFrom: selectedEmail.from,
                                    originalDate: formatDate(
                                      selectedEmail.date,
                                    ),
                                  });
                                  setIsComposeOpen(true);
                                }}
                              >
                                <Forward className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>העבר</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Reply All */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const replySubject =
                                    selectedEmail.subject?.startsWith("Re:")
                                      ? selectedEmail.subject
                                      : `Re: ${selectedEmail.subject || ""}`;
                                  const allRecipients = [
                                    selectedEmail.from,
                                    ...(selectedEmail.to || []),
                                  ]
                                    .filter((e) => e !== user?.email)
                                    .join(", ");
                                  setComposeData({
                                    to: allRecipients,
                                    subject: replySubject,
                                    quotedBody: buildQuotedBody(
                                      selectedEmail,
                                      "replyAll",
                                    ),
                                    mode: "replyAll",
                                    originalFrom: selectedEmail.from,
                                    originalDate: formatDate(
                                      selectedEmail.date,
                                    ),
                                  });
                                  setIsComposeOpen(true);
                                }}
                              >
                                <ReplyAll className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>השב לכולם</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Mark Unread */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                  await markAsRead(selectedEmail.id, false);
                                  await handleRefresh();
                                }}
                              >
                                <MailPlus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>סמן כלא נקרא</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Pin */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={
                                  emailMetadata.getMetadata(selectedEmail.id)
                                    ?.is_pinned
                                    ? "text-green-500"
                                    : ""
                                }
                                onClick={() => {
                                  const isPinned =
                                    emailMetadata.getMetadata(selectedEmail.id)
                                      ?.is_pinned || false;
                                  emailMetadata.setPin(
                                    selectedEmail.id,
                                    !isPinned,
                                  );
                                }}
                              >
                                <Bookmark
                                  className={cn(
                                    "h-4 w-4",
                                    emailMetadata.getMetadata(selectedEmail.id)
                                      ?.is_pinned && "fill-green-500",
                                  )}
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {emailMetadata.getMetadata(selectedEmail.id)
                                ?.is_pinned
                                ? "הסר הצמדה"
                                : "הצמד"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Archive */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={!!actionLoading}
                                onClick={async () => {
                                  setActionLoading("archive");
                                  await archiveEmail(selectedEmail.id);
                                  setActionLoading(null);
                                  setSelectedEmail(null);
                                  handleRefresh();
                                }}
                              >
                                {actionLoading === "archive" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Archive className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>ארכיון</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Delete */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500"
                                disabled={!!actionLoading}
                                onClick={async () => {
                                  setActionLoading("delete");
                                  await deleteEmail(selectedEmail.id);
                                  setActionLoading(null);
                                  setSelectedEmail(null);
                                  handleRefresh();
                                }}
                              >
                                {actionLoading === "delete" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>מחק</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <Separator orientation="vertical" className="h-5" />

                        {/* Spam */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                  await reportSpam(selectedEmail.id);
                                  setSelectedEmail(null);
                                  handleRefresh();
                                }}
                              >
                                <ShieldAlert className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>דווח כספאם</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Snooze */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Timer className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" dir="rtl">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const d = new Date();
                                      d.setHours(d.getHours() + 1);
                                      handleSnooze(selectedEmail.id, d);
                                    }}
                                  >
                                    בעוד שעה
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const d = new Date();
                                      d.setHours(d.getHours() + 3);
                                      handleSnooze(selectedEmail.id, d);
                                    }}
                                  >
                                    בעוד 3 שעות
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const d = new Date();
                                      d.setDate(d.getDate() + 1);
                                      d.setHours(9, 0, 0, 0);
                                      handleSnooze(selectedEmail.id, d);
                                    }}
                                  >
                                    מחר בבוקר
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const d = new Date();
                                      d.setDate(d.getDate() + 7);
                                      d.setHours(9, 0, 0, 0);
                                      handleSnooze(selectedEmail.id, d);
                                    }}
                                  >
                                    בעוד שבוע
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TooltipTrigger>
                            <TooltipContent>נדניק (Snooze)</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Mute */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleMuteThread(selectedEmail.threadId)
                                }
                              >
                                {mutedThreads.has(selectedEmail.threadId) ? (
                                  <Volume2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <VolumeX className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {mutedThreads.has(selectedEmail.threadId)
                                ? "הפעל שרשור"
                                : "השתק שרשור"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Print */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePrintEmail}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>הדפס</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Labels Display */}
                    {emailLabels[selectedEmail.id]?.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {emailLabels[selectedEmail.id].map((labelId) => {
                          const label = customLabels.find(
                            (l) => l.id === labelId,
                          );
                          return (
                            label && (
                              <Badge
                                key={labelId}
                                variant="secondary"
                                className="gap-1"
                              >
                                <div
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    label.color,
                                  )}
                                />
                                {label.name}
                              </Badge>
                            )
                          );
                        })}
                      </div>
                    )}

                    {/* Note Display */}
                    {emailNotes[selectedEmail.id] && (
                      <Card className="mb-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                        <CardContent className="py-2 px-3 text-sm">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                            <p className="text-blue-800 dark:text-blue-200">
                              {emailNotes[selectedEmail.id]}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-4 text-right">
                      <div>
                        <h2 className="text-xl font-semibold">
                          {selectedEmail.subject || "(ללא נושא)"}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">
                            {selectedEmail.fromName}
                          </span>
                          <span className="text-xs" dir="ltr">
                            &lt;{selectedEmail.from}&gt;
                          </span>

                          {/* Client Badge in detail view */}
                          {(() => {
                            const client = getClientForMessage(selectedEmail);
                            if (client) {
                              return (
                                <Badge
                                  variant="secondary"
                                  className="h-6 gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                >
                                  <Building2 className="h-3 w-3" />
                                  לקוח: {client.name}
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(selectedEmail.date)}</span>
                        </div>
                      </div>

                      {/* Email Quick Actions */}
                      <EmailQuickActions
                        email={selectedEmail}
                        clients={clients}
                        linkedClientId={
                          emailMetadata.getMetadata(selectedEmail.id)
                            ?.linked_client_id || null
                        }
                        autoDetectedClient={getClientForMessage(selectedEmail)}
                        onCreateTask={handleCreateTaskFromEmail}
                        onCreateMeeting={handleCreateMeetingFromEmail}
                        onCreateReminder={handleCreateReminderFromEmail}
                        onLinkClient={handleLinkClient}
                      />

                      {/* Smart Suggestions */}
                      <EmailSmartSuggestions
                        email={selectedEmail}
                        clients={clients}
                        onCreateTask={handleCreateTaskFromEmail}
                        onCreateMeeting={handleCreateMeetingFromEmail}
                        onLinkClient={handleLinkClient}
                      />

                      <Separator />

                      <div className="prose dark:prose-invert max-w-none text-sm">
                        {/* Recipients info */}
                        {selectedEmail.to && selectedEmail.to.length > 0 && (
                          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                            <span className="font-medium">אל:</span>
                            <span dir="ltr">{selectedEmail.to.join(", ")}</span>
                          </div>
                        )}

                        {/* Email body with full HTML rendering */}
                        {loadingBody ? (
                          <div className="border rounded-lg p-4 bg-card">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>טוען תוכן ההודעה...</span>
                            </div>
                          </div>
                        ) : emailHtmlBody ? (
                          <div
                            className="border rounded-lg p-4 bg-card overflow-auto max-h-[500px] text-sm"
                            dir="auto"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(emailHtmlBody, {
                                ALLOW_UNKNOWN_PROTOCOLS: true,
                              }),
                            }}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap break-words leading-relaxed border rounded-lg p-4 bg-card">
                            {selectedEmail.snippet}
                          </div>
                        )}

                        {/* Attachments - real download */}
                        {loadingAttachments ? (
                          <div className="mt-3 p-3 border rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>טוען קבצים מצורפים...</span>
                            </div>
                          </div>
                        ) : emailAttachments.length > 0 ? (
                          <div className="mt-3 p-3 border rounded-lg bg-muted/50 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Paperclip className="h-4 w-4" />
                              <span>
                                קבצים מצורפים ({emailAttachments.length})
                              </span>
                            </div>
                            <div className="space-y-1">
                              {emailAttachments.map((att, i) => {
                                const icon = att.type.startsWith("image/") ? (
                                  <ImageIcon className="h-4 w-4 text-green-500" />
                                ) : att.type.startsWith("video/") ? (
                                  <Film className="h-4 w-4 text-purple-500" />
                                ) : att.type.startsWith("audio/") ? (
                                  <Volume2 className="h-4 w-4 text-blue-500" />
                                ) : att.type.includes("pdf") ? (
                                  <FileText className="h-4 w-4 text-red-500" />
                                ) : att.type.includes("sheet") ||
                                  att.type.includes("excel") ? (
                                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                ) : (
                                  <File className="h-4 w-4 text-gray-500" />
                                );
                                return (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 bg-background rounded px-3 py-2"
                                  >
                                    {icon}
                                    <span className="text-sm flex-1 truncate">
                                      {att.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {att.size < 1024
                                        ? `${att.size} B`
                                        : att.size < 1024 * 1024
                                          ? `${(att.size / 1024).toFixed(1)} KB`
                                          : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7"
                                      onClick={() =>
                                        handleDownloadAttachment(
                                          selectedEmail!.id,
                                          att.attachmentId,
                                          att.name,
                                          att.type,
                                        )
                                      }
                                      disabled={
                                        downloadingAtt === att.attachmentId
                                      }
                                    >
                                      {downloadingAtt === att.attachmentId ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <>
                                          <Download className="h-3.5 w-3.5 ml-1" />
                                          הורד
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Email List View */
                  <div className="relative">
                    {/* Floating Date Indicator */}
                    <FloatingDateIndicator
                      currentDate={scrollCurrentDate}
                      isVisible={isScrolling}
                    />

                    <ScrollArea
                      className="h-[600px]"
                      ref={scrollContainerRef as any}
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
                        <div className="divide-y" dir="rtl">
                          {filteredMessages.map((message, index) => {
                            // Show date separator when date changes
                            const prevMessage =
                              index > 0 ? filteredMessages[index - 1] : null;
                            const showDateSeparator =
                              !prevMessage ||
                              !isSameDay(
                                new Date(message.date),
                                new Date(prevMessage.date),
                              );

                            return (
                              <React.Fragment key={message.id}>
                                {showDateSeparator && (
                                  <DateSeparator date={message.date} />
                                )}
                                <div
                                  data-message-id={message.id}
                                  className={cn(
                                    "flex items-start gap-3 hover:bg-muted/50 transition-colors cursor-pointer group",
                                    !message.isRead && "bg-primary/5",
                                    selectedMessages.has(message.id) &&
                                      "bg-primary/10",
                                    displayDensity === "compact" && "p-2",
                                    displayDensity === "comfortable" && "p-3",
                                    displayDensity === "spacious" && "p-4",
                                  )}
                                >
                                  {/* Checkbox */}
                                  <Checkbox
                                    checked={selectedMessages.has(message.id)}
                                    onCheckedChange={() =>
                                      toggleMessageSelection(
                                        message.id,
                                        filteredMessages.indexOf(message),
                                      )
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if ((e as any).shiftKey) {
                                        toggleMessageSelection(
                                          message.id,
                                          filteredMessages.indexOf(message),
                                          true,
                                        );
                                      }
                                    }}
                                    className="mt-1"
                                  />

                                  {/* Star */}
                                  <div
                                    className="flex-shrink-0 mt-1 cursor-pointer"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await toggleStar(
                                        message.id,
                                        message.isStarred,
                                      );
                                      await handleRefresh();
                                    }}
                                  >
                                    {message.isStarred ? (
                                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    ) : (
                                      <StarOff className="h-4 w-4 text-muted-foreground/30 hover:text-yellow-500 transition-colors" />
                                    )}
                                  </div>

                                  {/* Priority Icon */}
                                  {emailPriority[message.id] &&
                                    emailPriority[message.id] !== "none" && (
                                      <div className="flex-shrink-0 mt-1">
                                        {
                                          PRIORITY_CONFIG[
                                            emailPriority[message.id]
                                          ].icon
                                        }
                                      </div>
                                    )}

                                  {/* Main Content */}
                                  <div
                                    className="flex-1 min-w-0"
                                    onClick={async () => {
                                      setSelectedEmail(message);
                                      if (!message.isRead) {
                                        await markAsRead(message.id, true);
                                        await handleRefresh();
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span
                                        className={cn(
                                          "font-medium truncate",
                                          !message.isRead && "font-bold",
                                        )}
                                      >
                                        {message.fromName}
                                      </span>

                                      {/* Thread count badge */}
                                      {(() => {
                                        const threadCount =
                                          threadCounts[message.threadId] || 0;
                                        if (threadCount > 1) {
                                          return (
                                            <Badge
                                              variant="outline"
                                              className="h-5 gap-1 text-xs cursor-pointer hover:bg-primary/10"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openChatView(message);
                                              }}
                                            >
                                              <MessageSquare className="h-3 w-3" />
                                              {threadCount}
                                            </Badge>
                                          );
                                        }
                                        return null;
                                      })()}

                                      {/* Client Badge - Auto detected */}
                                      {(() => {
                                        const client =
                                          getClientForMessage(message);
                                        if (client) {
                                          return (
                                            <Badge
                                              variant="secondary"
                                              className="h-5 gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                            >
                                              <Building2 className="h-3 w-3" />
                                              {client.name}
                                            </Badge>
                                          );
                                        }
                                        return null;
                                      })()}

                                      {/* Labels */}
                                      {emailLabels[message.id]
                                        ?.filter(
                                          (l) => !l.startsWith("client_"),
                                        )
                                        .slice(0, 2)
                                        .map((labelId) => {
                                          const label = customLabels.find(
                                            (l) => l.id === labelId,
                                          );
                                          return (
                                            label && (
                                              <div
                                                key={labelId}
                                                className={cn(
                                                  "h-2 w-2 rounded-full",
                                                  label.color,
                                                )}
                                                title={label.name}
                                              />
                                            )
                                          );
                                        })}
                                      {emailLabels[message.id]?.filter(
                                        (l) => !l.startsWith("client_"),
                                      ).length > 2 && (
                                        <span className="text-xs text-muted-foreground">
                                          +
                                          {emailLabels[message.id].filter(
                                            (l) => !l.startsWith("client_"),
                                          ).length - 2}
                                        </span>
                                      )}

                                      {/* Reminder indicator */}
                                      {emailReminders[message.id] && (
                                        <Bell className="h-3 w-3 text-orange-500" />
                                      )}

                                      {/* Note indicator */}
                                      {emailNotes[message.id] && (
                                        <FileText className="h-3 w-3 text-blue-500" />
                                      )}

                                      {/* Pin indicator */}
                                      {emailMetadata.getMetadata(message.id)
                                        ?.is_pinned && (
                                        <Bookmark className="h-3 w-3 text-green-500 fill-green-500" />
                                      )}

                                      {/* Attachment indicator */}
                                      {(message.labels?.some(
                                        (l) => l === "ATTACHMENT",
                                      ) ||
                                        message.snippet?.includes(
                                          "attachment",
                                        ) ||
                                        message.snippet?.includes("מצורף") ||
                                        message.snippet?.includes("attached") ||
                                        message.snippet?.includes("file")) && (
                                        <Paperclip className="h-3 w-3 text-muted-foreground" />
                                      )}

                                      <span className="text-xs text-muted-foreground mr-auto flex-shrink-0">
                                        {formatDate(message.date)}
                                      </span>
                                    </div>
                                    <p
                                      className={cn(
                                        "text-sm",
                                        !message.isRead && "font-semibold",
                                        displayDensity === "compact" &&
                                          "text-xs truncate",
                                        displayDensity === "comfortable" &&
                                          "line-clamp-1",
                                        displayDensity === "spacious" &&
                                          "line-clamp-2",
                                      )}
                                    >
                                      {message.subject || "(ללא נושא)"}
                                    </p>
                                    {showPreview &&
                                      displayDensity !== "compact" && (
                                        <p
                                          className={cn(
                                            "text-muted-foreground mt-1",
                                            displayDensity === "spacious"
                                              ? "text-sm line-clamp-2"
                                              : "text-xs line-clamp-1",
                                          )}
                                        >
                                          {message.snippet}
                                        </p>
                                      )}
                                  </div>

                                  {/* Quick Actions */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="rtl"
                                    >
                                      <DropdownMenuItem
                                        onClick={() => openChatView(message)}
                                      >
                                        <MessageSquare className="h-4 w-4 ml-2" />
                                        פתח כשיחה
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedEmailForAction(message);
                                          setIsReminderDialogOpen(true);
                                        }}
                                      >
                                        <Bell className="h-4 w-4 ml-2" />
                                        הוסף תזכורת
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedEmailForAction(message);
                                          setIsNoteDialogOpen(true);
                                        }}
                                      >
                                        <FileText className="h-4 w-4 ml-2" />
                                        הוסף הערה
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          await markAsRead(
                                            message.id,
                                            !message.isRead,
                                          );
                                          await handleRefresh();
                                        }}
                                      >
                                        <MailOpen className="h-4 w-4 ml-2" />
                                        {message.isRead
                                          ? "סמן כלא נקרא"
                                          : "סמן כנקרא"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          const isPinned =
                                            emailMetadata.getMetadata(
                                              message.id,
                                            )?.is_pinned || false;
                                          emailMetadata.setPin(
                                            message.id,
                                            !isPinned,
                                          );
                                        }}
                                      >
                                        <Bookmark className="h-4 w-4 ml-2" />
                                        {emailMetadata.getMetadata(message.id)
                                          ?.is_pinned
                                          ? "הסר הצמדה"
                                          : "הצמד"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          const replySubject =
                                            message.subject?.startsWith("Re:")
                                              ? message.subject
                                              : `Re: ${message.subject || ""}`;
                                          setComposeData({
                                            to: message.from,
                                            subject: replySubject,
                                          });
                                          setIsComposeOpen(true);
                                        }}
                                      >
                                        <Reply className="h-4 w-4 ml-2" />
                                        השב
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          const fwdSubject =
                                            message.subject?.startsWith("Fwd:")
                                              ? message.subject
                                              : `Fwd: ${message.subject || ""}`;
                                          setComposeData({
                                            to: "",
                                            subject: fwdSubject,
                                          });
                                          setIsComposeOpen(true);
                                        }}
                                      >
                                        <Forward className="h-4 w-4 ml-2" />
                                        העבר
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          const success = await archiveEmail(
                                            message.id,
                                          );
                                          if (success) handleRefresh();
                                        }}
                                      >
                                        <Archive className="h-4 w-4 ml-2" />
                                        העבר לארכיון
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={async () => {
                                          const success = await deleteEmail(
                                            message.id,
                                          );
                                          if (success) handleRefresh();
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 ml-2" />
                                        מחק
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          await reportSpam(message.id);
                                          handleRefresh();
                                        }}
                                      >
                                        <ShieldAlert className="h-4 w-4 ml-2" />
                                        דווח כספאם
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleMuteThread(message.threadId)
                                        }
                                      >
                                        <VolumeX className="h-4 w-4 ml-2" />
                                        {mutedThreads.has(message.threadId)
                                          ? "הפעל שרשור"
                                          : "השתק שרשור"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          const d = new Date();
                                          d.setDate(d.getDate() + 1);
                                          d.setHours(9, 0, 0, 0);
                                          handleSnooze(message.id, d);
                                        }}
                                      >
                                        <Timer className="h-4 w-4 ml-2" />
                                        נדניק למחר
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </React.Fragment>
                            );
                          })}

                          {/* Load More Trigger */}
                          <LoadMoreTrigger
                            onLoadMore={loadMoreEmails}
                            isLoading={isLoadingMore}
                            hasMore={hasMore && !selectedDateFilter}
                          />
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
        <Dialog
          open={isReminderDialogOpen}
          onOpenChange={setIsReminderDialogOpen}
        >
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>הגדרת תזכורת</DialogTitle>
              <DialogDescription>
                {selectedEmailForAction?.subject || "ללא נושא"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const date = new Date();
                    date.setHours(date.getHours() + 1);
                    if (selectedEmailForAction) {
                      setEmailReminder(selectedEmailForAction.id, date);
                    }
                    setIsReminderDialogOpen(false);
                  }}
                >
                  <Clock4 className="h-4 w-4 ml-2" />
                  בעוד שעה
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const date = new Date();
                    date.setHours(date.getHours() + 3);
                    if (selectedEmailForAction) {
                      setEmailReminder(selectedEmailForAction.id, date);
                    }
                    setIsReminderDialogOpen(false);
                  }}
                >
                  <Clock4 className="h-4 w-4 ml-2" />
                  בעוד 3 שעות
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const date = new Date();
                    date.setDate(date.getDate() + 1);
                    date.setHours(9, 0, 0, 0);
                    if (selectedEmailForAction) {
                      setEmailReminder(selectedEmailForAction.id, date);
                    }
                    setIsReminderDialogOpen(false);
                  }}
                >
                  <Calendar className="h-4 w-4 ml-2" />
                  מחר בבוקר
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const date = new Date();
                    date.setDate(date.getDate() + 7);
                    date.setHours(9, 0, 0, 0);
                    if (selectedEmailForAction) {
                      setEmailReminder(selectedEmailForAction.id, date);
                    }
                    setIsReminderDialogOpen(false);
                  }}
                >
                  <Calendar className="h-4 w-4 ml-2" />
                  בעוד שבוע
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>תאריך ושעה מותאמים אישית</Label>
                <Input
                  type="datetime-local"
                  dir="ltr"
                  onChange={(e) => {
                    if (selectedEmailForAction && e.target.value) {
                      setEmailReminder(
                        selectedEmailForAction.id,
                        new Date(e.target.value),
                      );
                      setIsReminderDialogOpen(false);
                    }
                  }}
                />
              </div>
              {selectedEmailForAction &&
                emailReminders[selectedEmailForAction.id] && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      if (selectedEmailForAction) {
                        setEmailReminder(selectedEmailForAction.id, null);
                      }
                      setIsReminderDialogOpen(false);
                    }}
                  >
                    <BellOff className="h-4 w-4 ml-2" />
                    הסר תזכורת
                  </Button>
                )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Note Dialog */}
        <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>הוספת הערה</DialogTitle>
              <DialogDescription>
                {selectedEmailForAction?.subject || "ללא נושא"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="כתוב הערה..."
                rows={5}
                defaultValue={
                  selectedEmailForAction
                    ? emailNotes[selectedEmailForAction.id] || ""
                    : ""
                }
                onChange={(e) => {
                  if (selectedEmailForAction) {
                    saveEmailNote(selectedEmailForAction.id, e.target.value);
                  }
                }}
              />
              <div className="flex gap-2">
                <Button onClick={() => setIsNoteDialogOpen(false)}>שמור</Button>
                <Button
                  variant="outline"
                  onClick={() => setIsNoteDialogOpen(false)}
                >
                  סגור
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
        <Dialog open={showLabelManager} onOpenChange={setShowLabelManager}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>ניהול תוויות</DialogTitle>
              <DialogDescription>
                צור ונהל תוויות לסיווג המיילים שלך
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {customLabels.map((label) => (
                    <div
                      key={label.id}
                      className="flex items-center gap-3 p-2 border rounded-lg"
                    >
                      <div
                        className={cn("h-4 w-4 rounded-full", label.color)}
                      />
                      <span className="flex-1">{label.name}</span>
                      <Badge variant="secondary">
                        {
                          Object.values(emailLabels).filter((labels) =>
                            labels.includes(label.id),
                          ).length
                        }
                      </Badge>
                      {!DEFAULT_LABELS.find((dl) => dl.id === label.id) &&
                        !label.id.startsWith("client_") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500"
                            onClick={() => {
                              setCustomLabels((prev) =>
                                prev.filter((l) => l.id !== label.id),
                              );
                              // Save custom labels to localStorage
                              const userCustom = customLabels.filter(
                                (l) =>
                                  !DEFAULT_LABELS.find(
                                    (dl) => dl.id === l.id,
                                  ) &&
                                  !l.id.startsWith("client_") &&
                                  l.id !== label.id,
                              );
                              localStorage.setItem(
                                "gmail_custom_labels",
                                JSON.stringify(userCustom),
                              );
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator />
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="שם תווית חדשה..."
                    className="flex-1"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newLabelName.trim()) {
                        const newLabel: EmailLabel = {
                          id: `custom_${Date.now()}`,
                          name: newLabelName.trim(),
                          color: newLabelColor,
                        };
                        setCustomLabels((prev) => [...prev, newLabel]);
                        const allCustom = [
                          ...customLabels.filter(
                            (l) =>
                              !DEFAULT_LABELS.find((dl) => dl.id === l.id) &&
                              !l.id.startsWith("client_"),
                          ),
                          newLabel,
                        ];
                        localStorage.setItem(
                          "gmail_custom_labels",
                          JSON.stringify(allCustom),
                        );
                        setNewLabelName("");
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    disabled={!newLabelName.trim()}
                    onClick={() => {
                      if (!newLabelName.trim()) return;
                      const newLabel: EmailLabel = {
                        id: `custom_${Date.now()}`,
                        name: newLabelName.trim(),
                        color: newLabelColor,
                      };
                      setCustomLabels((prev) => [...prev, newLabel]);
                      const allCustom = [
                        ...customLabels.filter(
                          (l) =>
                            !DEFAULT_LABELS.find((dl) => dl.id === l.id) &&
                            !l.id.startsWith("client_"),
                        ),
                        newLabel,
                      ];
                      localStorage.setItem(
                        "gmail_custom_labels",
                        JSON.stringify(allCustom),
                      );
                      setNewLabelName("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {[
                    "bg-red-500",
                    "bg-orange-500",
                    "bg-yellow-500",
                    "bg-green-500",
                    "bg-blue-500",
                    "bg-purple-500",
                    "bg-pink-500",
                    "bg-gray-500",
                  ].map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 transition-all",
                        color,
                        newLabelColor === color
                          ? "border-foreground scale-110"
                          : "border-transparent",
                      )}
                      onClick={() => setNewLabelColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Undo Send Bar */}
        {undoSendState && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background rounded-lg px-6 py-3 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom">
            <span className="text-sm font-medium">
              ההודעה תישלח בעוד {undoSendState.countdown} שניות...
            </span>
            <Button variant="secondary" size="sm" onClick={cancelUndoSend}>
              <Undo2 className="h-4 w-4 ml-1" />
              ביטול שליחה
            </Button>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <Dialog open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                קיצורי מקשים
              </DialogTitle>
              <DialogDescription>קיצורים זמינים בתצוגת Gmail</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-1">
                {[
                  ["c", "כתיבת הודעה חדשה"],
                  ["r", "השב"],
                  ["a", "השב לכולם"],
                  ["f", "העבר"],
                  ["e", "ארכיון"],
                  ["#", "מחק"],
                  ["s", "כוכב"],
                  ["p", "הדפס"],
                  ["j", "מייל הבא"],
                  ["k", "מייל הקודם"],
                  ["o", "פתח שיחה"],
                  ["Esc", "חזור לרשימה"],
                  ["?", "קיצורי מקשים"],
                  ["Shift+Click", "בחירת טווח"],
                  ["Enter", "חיפוש בשרת"],
                ].map(([key, desc]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted"
                  >
                    <kbd className="px-2 py-0.5 bg-muted rounded border text-xs font-mono min-w-[28px] text-center">
                      {key}
                    </kbd>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
