/**
 * ChatMessenger - מרכז שיחות ווידוא מלא
 * Real-time | All file formats | Google Drive | Gmail | Client linking
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat, ChatConversation, ChatMessage } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ChatFilePicker, PickedFile } from "./ChatFilePicker";
import { VoiceRecorder } from "./VoiceRecorder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Send,
  Plus,
  Search,
  MessageCircle,
  Users,
  Building2,
  MoreVertical,
  Trash2,
  Reply,
  Smile,
  Paperclip,
  Circle,
  X,
  Phone,
  Video,
  Pin,
  Archive,
  Edit3,
  Loader2,
  FileText,
  FileAudio,
  Download,
  ExternalLink,
  Tag,
  Link2,
  ChevronLeft,
  Mic,
  Share2,
  Clock,
  BarChart2,
  FileDown,
  Sparkles,
  CheckSquare,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Image,
  Folder,
  ListTodo,
  Star,
  Bookmark,
  Smartphone,
  MessageSquare,
  Globe,
  AlertTriangle,
  Info,
  CalendarClock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  notifyNewMessage,
  requestNotificationPermission,
  getSoundEnabled,
  toggleSound,
  getNotificationsEnabled,
  toggleNotifications,
} from "@/services/chatNotifications";
import { useChatExtras } from "@/hooks/useChatExtras";
import { TypingIndicator } from "./TypingIndicator";
import { ReadReceipts } from "./ReadReceipts";
import { MessageTemplates } from "./MessageTemplates";
import { GifPicker } from "./GifPicker";
import { ChatAnalyticsDashboard } from "./ChatAnalyticsDashboard";
import { ConvInfoPanel } from "./ConvInfoPanel";
import { PollMessage } from "./PollMessage";
import { ScheduledMessagesList } from "./ScheduledMessagesList";
import { MentionAutocomplete } from "./MentionAutocomplete";

// -----------------------------------------------------------
// Emoji Picker
// -----------------------------------------------------------
const QUICK_EMOJIS = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🎉",
  "🔥",
  "✅",
  "🙏",
  "💯",
];

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (e: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-10 left-0 bg-background border rounded-xl shadow-xl p-2 z-50 flex flex-wrap gap-1 w-44">
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
          className="text-xl hover:scale-125 transition-transform p-1 rounded hover:bg-muted"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// -----------------------------------------------------------
// Message media renderer
// -----------------------------------------------------------
function MessageMedia({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  const textColor = isOwn ? "text-primary-foreground" : "text-foreground";
  const subColor = isOwn
    ? "text-primary-foreground/70"
    : "text-muted-foreground";
  const bgOverlay = isOwn ? "bg-primary-foreground/10" : "bg-muted";

  // Image
  if (msg.message_type === "image" && msg.file_url) {
    return (
      <div className="mb-1.5 rounded-lg overflow-hidden max-w-[240px]">
        <img
          src={msg.file_url}
          alt={msg.file_name || "תמונה"}
          className="w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(msg.file_url!, "_blank")}
          loading="lazy"
        />
      </div>
    );
  }

  // Video
  if (msg.message_type === "video" && msg.file_url) {
    return (
      <div className="mb-1.5 rounded-lg overflow-hidden max-w-[280px]">
        <video
          src={msg.file_url}
          controls
          className="w-full rounded-lg"
          preload="metadata"
          style={{ maxHeight: "200px" }}
        >
          <source src={msg.file_url} />
        </video>
        {msg.file_name && (
          <p className={cn("text-[11px] mt-0.5 truncate", subColor)}>
            {msg.file_name}
          </p>
        )}
      </div>
    );
  }

  // Audio
  if (msg.message_type === "audio" && msg.file_url) {
    return (
      <div className={cn("mb-1.5 rounded-xl p-2", bgOverlay)}>
        <div className={cn("flex items-center gap-2 mb-1", textColor)}>
          <FileAudio className="h-4 w-4 shrink-0" />
          <span className="text-xs truncate">{msg.file_name || "הקלטה"}</span>
        </div>
        <audio controls className="w-full h-8" preload="metadata">
          <source src={msg.file_url} />
        </audio>
      </div>
    );
  }

  // Google Drive
  if ((msg.metadata as any)?.source === "google_drive" && msg.file_url) {
    return (
      <a
        href={msg.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "mb-1.5 flex items-center gap-2 rounded-xl px-3 py-2 hover:opacity-80 transition-opacity",
          bgOverlay,
        )}
      >
        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <span className="text-blue-600 font-bold text-xs">G</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-medium truncate", textColor)}>
            {msg.file_name}
          </p>
          <p className={cn("text-[10px]", subColor)}>Google Drive</p>
        </div>
        <ExternalLink className={cn("h-3.5 w-3.5 shrink-0", subColor)} />
      </a>
    );
  }

  // Gmail
  if ((msg.metadata as any)?.source === "gmail" && msg.file_url) {
    return (
      <a
        href={msg.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "mb-1.5 flex items-center gap-2 rounded-xl px-3 py-2 hover:opacity-80 transition-opacity",
          bgOverlay,
        )}
      >
        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <span className="text-red-600 font-bold text-xs">M</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-medium truncate", textColor)}>
            {msg.file_name}
          </p>
          <p className={cn("text-[10px]", subColor)}>Gmail</p>
        </div>
        <ExternalLink className={cn("h-3.5 w-3.5 shrink-0", subColor)} />
      </a>
    );
  }

  // Generic file
  if (msg.message_type === "file" && msg.file_url) {
    const isDoc =
      msg.file_type?.includes("pdf") ||
      msg.file_type?.includes("word") ||
      msg.file_type?.includes("document");
    return (
      <a
        href={msg.file_url}
        target="_blank"
        rel="noopener noreferrer"
        download={msg.file_name}
        className={cn(
          "mb-1.5 flex items-center gap-2 rounded-xl px-3 py-2 hover:opacity-80 transition-opacity",
          bgOverlay,
        )}
      >
        <div
          className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
            isDoc ? "bg-blue-100" : "bg-muted-foreground/10",
          )}
        >
          {isDoc ? (
            <FileText className="h-5 w-5 text-blue-600" />
          ) : (
            <Paperclip
              className={cn(
                "h-5 w-5",
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-medium truncate", textColor)}>
            {msg.file_name || "קובץ"}
          </p>
          {msg.file_size && (
            <p className={cn("text-[10px]", subColor)}>
              {msg.file_size < 1024 * 1024
                ? `${(msg.file_size / 1024).toFixed(1)} KB`
                : `${(msg.file_size / (1024 * 1024)).toFixed(1)} MB`}
            </p>
          )}
        </div>
        <Download className={cn("h-3.5 w-3.5 shrink-0", subColor)} />
      </a>
    );
  }

  return null;
}

// -----------------------------------------------------------
// Message Bubble
// -----------------------------------------------------------
function MessageBubble({
  msg,
  isOwn,
  onReply,
  onReact,
  onDelete,
  showName,
  onEdit,
  onForward,
  onPin,
  onTask,
  onSave,
  isSaved,
  readBy,
  onTranslate,
  isUrgent,
  conversationId,
}: {
  msg: ChatMessage;
  isOwn: boolean;
  onReply: (m: ChatMessage) => void;
  onReact: (id: string, emoji: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (m: ChatMessage) => void;
  onForward?: (m: ChatMessage) => void;
  onPin?: (id: string) => void;
  onTask?: (m: ChatMessage) => void;
  onSave?: (id: string) => void;
  isSaved?: boolean;
  readBy?: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    last_read_at: string;
  }[];
  onTranslate?: (id: string, text: string) => void;
  isUrgent?: boolean;
  conversationId?: string;
  showName: boolean;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return `אתמול ${format(d, "HH:mm")}`;
    return format(d, "dd/MM HH:mm");
  };

  const totalReactions = Object.entries(msg.reactions || {}).map(
    ([emoji, users]) => ({
      emoji,
      count: (users as string[]).length,
    }),
  );

  const isPoll = !!msg.content?.startsWith("📊 סקר:");
  const hasText = msg.content && msg.content !== msg.file_name && !isPoll;

  return (
    <div
      className={cn(
        "flex gap-2 group mb-0.5",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowEmoji(false);
      }}
    >
      {!isOwn && (
        <Avatar className="h-7 w-7 mt-1 shrink-0">
          {msg.sender_avatar && <AvatarImage src={msg.sender_avatar} />}
          <AvatarFallback className="text-xs bg-primary/10">
            {(msg.sender_name || "U").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col max-w-[72%]", isOwn && "items-end")}>
        {showName && !isOwn && (
          <span className="text-xs text-muted-foreground mb-0.5 mr-1 font-medium">
            {msg.sender_name}
          </span>
        )}

        {msg.reply_to_id && (
          <div
            className={cn(
              "text-xs bg-muted/70 rounded-lg px-2 py-1 mb-1 border-r-2 border-primary text-muted-foreground max-w-full",
              isOwn &&
                "border-primary-foreground/50 bg-primary/20 text-primary-foreground/70",
            )}
          >
            ↩ {(msg as any).reply_content?.slice(0, 50) || "..."}
          </div>
        )}

        <div className="relative">
          <div
            className={cn(
              "rounded-2xl text-sm leading-relaxed break-words",
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted rounded-bl-sm",
              "px-3 py-2",
              isUrgent && !isOwn && "border-r-2 border-red-500",
            )}
          >
            {isUrgent && (
              <div className="flex items-center gap-1 text-[10px] text-red-500 mb-1">
                <AlertTriangle className="h-3 w-3" />
                דחוף
              </div>
            )}
            <MessageMedia msg={msg} isOwn={isOwn} />
            {isPoll && conversationId ? (
              <PollMessage
                conversationId={conversationId}
                question={msg.content}
                isOwn={isOwn}
              />
            ) : hasText ? (
              <span>
                {translated || msg.content}
                {translated && (
                  <span className="text-[10px] opacity-60 mr-1"> (תרגום)</span>
                )}
                {msg.is_edited && !translated && (
                  <span className="text-[10px] opacity-60 mr-1">(נערך)</span>
                )}
              </span>
            ) : null}
          </div>

          {hovered && (
            <div
              className={cn(
                "absolute top-0 flex gap-0.5 bg-background border rounded-lg shadow-md p-0.5 z-10",
                isOwn ? "right-full mr-1" : "left-full ml-1",
              )}
            >
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onReply(msg)}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                    >
                      <Reply className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">השב</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <button
                        onClick={() => setShowEmoji((s) => !s)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                      >
                        <Smile className="h-3 w-3" />
                      </button>
                      {showEmoji && (
                        <EmojiPicker
                          onSelect={(e) => onReact(msg.id, e)}
                          onClose={() => setShowEmoji(false)}
                        />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">תגובה</TooltipContent>
                </Tooltip>
                {onForward && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onForward(msg)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                      >
                        <Share2 className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">העבר</TooltipContent>
                  </Tooltip>
                )}
                {onPin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onPin(msg.id)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-amber-500"
                      >
                        <Pin className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">הצמד</TooltipContent>
                  </Tooltip>
                )}
                {onTask && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onTask(msg)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-green-600"
                      >
                        <CheckSquare className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">צור משימה</TooltipContent>
                  </Tooltip>
                )}
                {isOwn && onEdit && msg.message_type === "text" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onEdit(msg)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-blue-500"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">ערוך</TooltipContent>
                  </Tooltip>
                )}
                {onTranslate && msg.message_type === "text" && !isPoll && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          if (translated) {
                            setTranslated(null);
                          } else {
                            onTranslate(msg.id, msg.content);
                          }
                        }}
                        className={cn(
                          "p-1 hover:bg-muted rounded",
                          translated
                            ? "text-blue-500"
                            : "text-muted-foreground hover:text-blue-500",
                        )}
                      >
                        <Globe className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {translated ? "בטל תרגום" : "תרגם"}
                    </TooltipContent>
                  </Tooltip>
                )}
                {onSave && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onSave(msg.id)}
                        className={cn(
                          "p-1 hover:bg-muted rounded",
                          isSaved
                            ? "text-amber-500"
                            : "text-muted-foreground hover:text-amber-500",
                        )}
                      >
                        <Bookmark className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {isSaved ? "הסר מהשמורים" : "שמור הודעה"}
                    </TooltipContent>
                  </Tooltip>
                )}
                {isOwn && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onDelete(msg.id)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">מחק</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          )}
        </div>

        {totalReactions.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {totalReactions.map(({ emoji, count }) => (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                className="text-xs bg-muted border rounded-full px-1.5 py-0.5 hover:bg-muted/80 flex items-center gap-0.5"
              >
                {emoji}{" "}
                <span className="text-[10px] text-muted-foreground">
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 mt-0.5 mx-1">
          <span className="text-[10px] text-muted-foreground">
            {formatTime(msg.created_at)}
          </span>
          {readBy && (
            <ReadReceipts
              readBy={readBy}
              messageCreatedAt={msg.created_at}
              isOwnMessage={isOwn}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// Date Divider
// -----------------------------------------------------------
function DateDivider({ date }: { date: string }) {
  const d = new Date(date);
  let label = format(d, "EEEE, dd MMMM yyyy", { locale: he });
  if (isToday(d)) label = "היום";
  else if (isYesterday(d)) label = "אתמול";
  return (
    <div className="flex items-center gap-2 my-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] text-muted-foreground bg-muted px-3 py-0.5 rounded-full border">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// -----------------------------------------------------------
// New Conversation Dialog
// -----------------------------------------------------------
function NewConversationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (conv: ChatConversation) => void;
}) {
  const { createConversation } = useChat();
  const [type, setType] = useState<"internal" | "client" | "group">("internal");
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<
    { id: string; full_name: string; email: string }[]
  >([]);
  const [creating, setCreating] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    Promise.all([
      supabase.from("clients").select("id, name").order("name").limit(200),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name")
        .limit(100),
    ]).then(([cRes, eRes]) => {
      setClients(cRes.data || []);
      setEmployees(eRes.data || []);
    });
  }, [open]);

  const filteredClients = clients.filter(
    (c) =>
      !clientSearch ||
      c.name.toLowerCase().includes(clientSearch.toLowerCase()),
  );

  const handleCreate = async () => {
    setCreating(true);
    try {
      const conv = await createConversation(type, {
        title: title || undefined,
        participantIds: selectedUsers,
        clientId: type === "client" ? clientId : undefined,
      });
      if (conv) {
        toast({ title: "✅ שיחה נוצרה בהצלחה!" });
        onCreated(conv as ChatConversation);
        onOpenChange(false);
        setTitle("");
        setClientId("");
        setSelectedUsers([]);
        setClientSearch("");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
            שיחה חדשה
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">סוג שיחה</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  {
                    key: "internal",
                    icon: Users,
                    label: "פנימי",
                    desc: "בין עובדים",
                    color: "text-green-600 bg-green-50",
                  },
                  {
                    key: "client",
                    icon: Building2,
                    label: "לקוח",
                    desc: "עם לקוח",
                    color: "text-blue-600 bg-blue-50",
                  },
                  {
                    key: "group",
                    icon: MessageCircle,
                    label: "קבוצה",
                    desc: "רב משתתפים",
                    color: "text-purple-600 bg-purple-50",
                  },
                ] as const
              ).map(({ key, icon: Icon, label, desc, color }) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                    type === key
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/30 hover:bg-muted/50",
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center",
                      color,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold">{label}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">
              שם השיחה {type !== "client" && "(אופציונלי)"}
            </Label>
            <Input
              placeholder={
                type === "client" ? "שם השיחה עם הלקוח..." : "שם הקבוצה..."
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {type === "client" && (
            <div className="space-y-1.5">
              <Label className="text-sm">בחר לקוח *</Label>
              <div className="relative mb-1">
                <Search className="absolute right-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חפש לקוח..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pr-8 h-8"
                />
              </div>
              <ScrollArea className="h-32 border rounded-lg">
                <div className="p-1 space-y-0.5">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setClientId(c.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                        clientId === c.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted",
                      )}
                    >
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Building2 className="h-3 w-3 text-blue-600" />
                      </div>
                      {c.name}
                      {clientId === c.id && <span className="mr-auto">✓</span>}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              {clientId && (
                <div className="flex items-center gap-1.5 text-xs text-primary">
                  <Tag className="h-3 w-3" />
                  לקוח נבחר:{" "}
                  <strong>
                    {clients.find((c) => c.id === clientId)?.name}
                  </strong>
                </div>
              )}
            </div>
          )}

          {(type === "internal" || type === "group") && (
            <div className="space-y-1.5">
              <Label className="text-sm">
                הוסף משתתפים {type === "internal" && "*"}
              </Label>
              <ScrollArea className="h-36 border rounded-lg">
                <div className="p-1 space-y-0.5">
                  {employees.map((e) => (
                    <label
                      key={e.id}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedUsers.includes(e.id)}
                        onCheckedChange={(v) =>
                          setSelectedUsers((prev) =>
                            v
                              ? [...prev, e.id]
                              : prev.filter((x) => x !== e.id),
                          )
                        }
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-primary/10">
                          {e.full_name?.slice(0, 2) || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {e.full_name}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {e.email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
              {selectedUsers.length > 0 && (
                <p className="text-xs text-primary font-medium">
                  {selectedUsers.length} משתתפים נבחרו
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              creating ||
              (type === "internal" && selectedUsers.length === 0) ||
              (type === "client" && !clientId)
            }
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin ml-1" />
            ) : (
              <Plus className="h-4 w-4 ml-1" />
            )}
            צור שיחה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -----------------------------------------------------------
// Assign Client Dialog
// -----------------------------------------------------------
function AssignClientDialog({
  open,
  onOpenChange,
  conversationId,
  currentClientId,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conversationId: string;
  currentClientId?: string | null;
  onAssigned: (clientId: string | null, clientName: string | null) => void;
}) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    supabase
      .from("clients")
      .select("id, name")
      .order("name")
      .limit(200)
      .then(({ data }) => setClients(data || []));
  }, [open]);

  const filtered = clients.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const assign = async (clientId: string | null) => {
    setSaving(true);
    await supabase
      .from("chat_conversations")
      .update({ client_id: clientId, type: clientId ? "client" : "internal" })
      .eq("id", conversationId);
    const name = clientId
      ? clients.find((c) => c.id === clientId)?.name || null
      : null;
    onAssigned(clientId, name);
    toast({ title: clientId ? `שויך ללקוח: ${name}` : "שיוך הוסר" });
    onOpenChange(false);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            שייך לקוח לשיחה
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute right-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חפש לקוח..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-8 h-8"
              autoFocus
            />
          </div>
          <ScrollArea className="h-52 border rounded-lg">
            <div className="p-1 space-y-0.5">
              {currentClientId && (
                <button
                  onClick={() => assign(null)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm hover:bg-destructive/10 text-destructive"
                >
                  <X className="h-4 w-4" />
                  הסר שיוך לקוח
                </button>
              )}
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => assign(c.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors",
                    currentClientId === c.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted",
                  )}
                >
                  <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-700 font-bold text-xs">
                    {c.name.slice(0, 2)}
                  </div>
                  {c.name}
                  {currentClientId === c.id && (
                    <span className="mr-auto text-xs">✓ נוכחי</span>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// -----------------------------------------------------------
// Main ChatMessenger
// -----------------------------------------------------------
export function ChatMessenger() {
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    sendingMessage,
    onlineUsers,
    totalUnread,
    selectConversation,
    sendMessage,
    createConversation,
    addReaction,
    deleteMessage,
    sendTyping,
    fetchConversations,
    editMessage,
    pinMessage,
    forwardMessage,
    searchMessages,
    createPoll,
    convertToTask,
    scheduleMessage,
    getMediaGallery,
    summarizeConversation,
  } = useChat();

  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Core state
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [filterType, setFilterType] = useState<
    "all" | "internal" | "client" | "group"
  >("all");
  const [localConvs, setLocalConvs] = useState<ChatConversation[]>([]);

  // Dialog state
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [assignClientOpen, setAssignClientOpen] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const [taskMsg, setTaskMsg] = useState<ChatMessage | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [pollOpen, setPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleText, setScheduleText] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [mediaGalleryOpen, setMediaGalleryOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<ChatMessage[]>([]);
  const [galleryTab, setGalleryTab] = useState<"images" | "files" | "all">(
    "all",
  );
  const [aiSummary, setAiSummary] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [msgSearch, setMsgSearch] = useState("");
  const [msgSearchOpen, setMsgSearchOpen] = useState(false);
  const [msgSearchResults, setMsgSearchResults] = useState<ChatMessage[]>([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [pinnedMsg, setPinnedMsg] = useState<ChatMessage | null>(null);
  const [soundOn, setSoundOn] = useState(getSoundEnabled());
  const [notifsOn, setNotifsOn] = useState(getNotificationsEnabled());
  const prevMsgCount = useRef(0);

  // Extra feature state
  const [gifOpen, setGifOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [savedMsgsOpen, setSavedMsgsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [scheduledOpen, setScheduledOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [translatedMsgs, setTranslatedMsgs] = useState<Record<string, string>>(
    {},
  );

  // useChatExtras
  const {
    isMuted,
    isFavorite,
    toggleMute,
    toggleFavorite,
    allLabels,
    convLabels,
    addLabel,
    removeLabel,
    savedMessages,
    saveMessage,
    isMessageSaved,
    templates,
    useTemplate,
    translateMessage,
    sendWhatsApp,
    sendSMS,
    slaInfo,
    readBy,
    setTheme,
    themeColor,
  } = useChatExtras(activeConversation?.id);

  const handleTranslate = async (msgId: string, text: string) => {
    const result = await translateMessage(text, "he");
    setTranslatedMsgs((prev) => ({ ...prev, [msgId]: result }));
  };

  const handleArchive = async () => {
    if (!activeConversation) return;
    await supabase
      .from("chat_conversations")
      .update({ is_archived: true })
      .eq("id", activeConversation.id);
    setLocalConvs((prev) => prev.filter((c) => c.id !== activeConversation.id));
    toast({ title: "🗂️ שיחה הועברה לארכיון" });
    setInfoOpen(false);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync local conversations
  useEffect(() => {
    setLocalConvs(conversations);
  }, [conversations]);

  // Mobile detection
  useEffect(() => {
    const check = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      if (!m) setShowSidebar(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Desktop notification on new message
  useEffect(() => {
    if (messages.length > prevMsgCount.current && prevMsgCount.current > 0) {
      const newest = messages[messages.length - 1];
      if (newest && newest.sender_id !== user?.id) {
        const convTitle =
          localConvs.find((c) => c.id === newest.conversation_id)?.title ||
          undefined;
        notifyNewMessage(
          newest.sender_name || "הודעה חדשה",
          newest.content || "📎 קובץ",
          convTitle,
        );
      }
    }
    prevMsgCount.current = messages.length;
  }, [messages]);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Load pinned message when conversation changes
  useEffect(() => {
    setPinnedMsg(null);
    const conv = localConvs.find((c) => c.id === activeConversation?.id) as any;
    if (conv?.pinned_message_id) {
      const pinned = messages.find((m) => m.id === conv.pinned_message_id);
      if (pinned) setPinnedMsg(pinned);
    }
  }, [activeConversation?.id, localConvs]);

  const groupedMessages = messages.reduce<
    { date: string; msgs: ChatMessage[] }[]
  >((acc, msg) => {
    const date = format(new Date(msg.created_at), "yyyy-MM-dd");
    const last = acc[acc.length - 1];
    if (!last || last.date !== date) acc.push({ date, msgs: [msg] });
    else last.msgs.push(msg);
    return acc;
  }, []);

  const filteredConversations = localConvs.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      c.title?.toLowerCase().includes(q) ||
      (c.client_name || "").toLowerCase().includes(q) ||
      (c.last_message || "").toLowerCase().includes(q);
    const matchType = filterType === "all" || c.type === filterType;
    return matchSearch && matchType;
  });

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    setReplyTo(null);
    await sendMessage(text, replyTo ? { replyToId: replyTo.id } : undefined);
  };

  const handleEditSave = async () => {
    if (!editingMsg || !editContent.trim()) return;
    await editMessage(editingMsg.id, editContent);
    setEditingMsg(null);
    setEditContent("");
    toast({ title: "✅ הודעה נערכה" });
  };

  const handleFilePicked = async (picked: PickedFile) => {
    if (!activeConversation || !user) return;
    const isImage = picked.file_type?.startsWith("image/");
    const msgType: any = isImage ? "image" : "file";
    await sendMessage(picked.file_name, {
      messageType: msgType,
      fileUrl: picked.file_url,
      fileName: picked.file_name,
      fileSize: picked.file_size,
      fileType: picked.file_type,
    });
    await supabase.from("chat_files").insert({
      conversation_id: activeConversation.id,
      client_id: activeConversation.client_id || null,
      uploaded_by: user.id,
      file_name: picked.file_name,
      file_url: picked.file_url,
      file_type: picked.file_type || null,
      file_size: picked.file_size || null,
      source: picked.source,
      drive_file_id: picked.drive_file_id || null,
      gmail_message_id: picked.gmail_message_id || null,
      thumbnail_url: picked.thumbnail_url || null,
      duration_seconds: picked.duration_seconds || null,
    });
  };

  const handleVoiceRecorded = async (
    audioUrl: string,
    durationSeconds: number,
  ) => {
    setVoiceMode(false);
    if (!activeConversation) return;
    await sendMessage("🎙️ הודעה קולית", {
      messageType: "file" as any,
      fileUrl: audioUrl,
      fileName: "voice-message.webm",
      fileType: "audio/webm",
    });
    await supabase.from("chat_files").insert({
      conversation_id: activeConversation.id,
      client_id: activeConversation.client_id || null,
      uploaded_by: user!.id,
      file_name: "voice-message.webm",
      file_url: audioUrl,
      file_type: "audio/webm",
      source: "upload",
      duration_seconds: durationSeconds,
    });
  };

  const handlePin = async (msgId: string) => {
    if (!activeConversation) return;
    const already =
      (localConvs.find((c) => c.id === activeConversation.id) as any)
        ?.pinned_message_id === msgId;
    await pinMessage(activeConversation.id, already ? null : msgId);
    if (!already) {
      const msg = messages.find((m) => m.id === msgId);
      setPinnedMsg(msg || null);
      toast({ title: "📌 הודעה הוצמדה" });
    } else {
      setPinnedMsg(null);
      toast({ title: "📌 הצמדה הוסרה" });
    }
  };

  const handleForward = async (targetConvId: string) => {
    if (!forwardMsg) return;
    await forwardMessage(forwardMsg.id, targetConvId);
    setForwardMsg(null);
    toast({ title: "✅ הועבר לשיחה" });
  };

  const handleCreateTask = async () => {
    if (!taskMsg || !taskTitle.trim()) return;
    await convertToTask(taskMsg.id, taskTitle);
    setTaskMsg(null);
    setTaskTitle("");
    toast({ title: "✅ משימה נוצרה מההודעה" });
  };

  const handleCreatePoll = async () => {
    const opts = pollOptions.filter((o) => o.trim());
    if (!pollQuestion.trim() || opts.length < 2) {
      toast({ title: "נדרשות לפחות 2 אפשרויות", variant: "destructive" });
      return;
    }
    await createPoll(pollQuestion, opts);
    setPollOpen(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    toast({ title: "📊 סקר נוצר" });
  };

  const handleSchedule = async () => {
    if (!scheduleText.trim() || !scheduleDate || !scheduleTime) return;
    const dt = new Date(`${scheduleDate}T${scheduleTime}`);
    await scheduleMessage(scheduleText, dt);
    setScheduleOpen(false);
    setScheduleText("");
    setScheduleDate("");
    setScheduleTime("");
    toast({ title: `⏰ הודעה תישלח ב-${format(dt, "dd/MM HH:mm")}` });
  };

  const handleMsgSearch = async (q: string) => {
    setMsgSearch(q);
    if (q.length < 2) {
      setMsgSearchResults([]);
      return;
    }
    const res = await searchMessages(q);
    setMsgSearchResults(res);
  };

  const openGallery = async (type: "images" | "files" | "all") => {
    setGalleryTab(type);
    const items = await getMediaGallery(type);
    setGalleryItems(items);
    setMediaGalleryOpen(true);
  };

  const handleAiSummary = async () => {
    setSummaryOpen(true);
    setSummaryLoading(true);
    const s = await summarizeConversation();
    setAiSummary(s);
    setSummaryLoading(false);
  };

  const handleExport = async () => {
    if (!activeConversation) return;
    const lines = messages
      .filter((m) => !m.is_deleted)
      .map(
        (m) =>
          `[${format(new Date(m.created_at), "dd/MM/yyyy HH:mm")}] ${m.sender_name}: ${m.content || (m.file_name ? `📎 ${m.file_name}` : "")}`,
      );
    const title =
      activeConversation.title || activeConversation.client_name || "שיחה";
    const blob = new Blob(
      [
        `שיחה: ${title}\nתאריך: ${format(new Date(), "dd/MM/yyyy")}\n\n${lines.join("\n")}`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title}-transcript.txt`;
    a.click();
    toast({ title: "📥 הטרנסקריפט הורד" });
  };

  const handleClientAssigned = (
    clientId: string | null,
    clientName: string | null,
  ) => {
    setLocalConvs((prev) =>
      prev.map((c) =>
        c.id === activeConversation?.id
          ? {
              ...c,
              client_id: clientId,
              client_name: clientName || undefined,
              type: clientId ? ("client" as const) : ("internal" as const),
            }
          : c,
      ),
    );
  };

  const ConvItem = ({ conv }: { conv: ChatConversation }) => {
    const isActive = activeConversation?.id === conv.id;
    const TypeIcon =
      conv.type === "client"
        ? Building2
        : conv.type === "group"
          ? Users
          : MessageCircle;
    const title = conv.title || conv.client_name || "שיחה פנימית";
    const lastTime = conv.last_message_at
      ? formatDistanceToNow(new Date(conv.last_message_at), {
          locale: he,
          addSuffix: true,
        })
      : "";
    const typeColor =
      conv.type === "client"
        ? "bg-blue-100 text-blue-600"
        : conv.type === "group"
          ? "bg-purple-100 text-purple-600"
          : "bg-green-100 text-green-600";
    const isFav = (conv as any).is_favorite;
    const isOnline = conv.participants?.some(
      (p) => p.user_id && onlineUsers.includes(p.user_id),
    );
    return (
      <button
        onClick={() => {
          selectConversation(conv);
          if (isMobile) setShowSidebar(false);
        }}
        className={cn(
          "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-right transition-all hover:bg-muted/60",
          isActive && "bg-primary/10 border border-primary/15 shadow-sm",
        )}
      >
        <div className="relative shrink-0">
          <div
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center",
              typeColor,
            )}
          >
            <TypeIcon className="h-4 w-4" />
          </div>
          {isOnline && (
            <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 absolute -bottom-0.5 -right-0.5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span
              className={cn(
                "font-medium text-sm truncate",
                isActive && "text-primary",
              )}
            >
              {isFav && (
                <Star className="inline h-2.5 w-2.5 text-amber-400 mb-0.5 ml-0.5" />
              )}
              {title}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {lastTime}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs text-muted-foreground truncate flex-1">
              {conv.last_message || "אין הודעות"}
            </p>
            {(conv.unread_count || 0) > 0 && (
              <Badge className="bg-primary text-primary-foreground text-[10px] h-4 min-w-[1rem] shrink-0 rounded-full px-1">
                {conv.unread_count}
              </Badge>
            )}
          </div>
          {conv.client_name && (
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 className="h-2.5 w-2.5 text-blue-500" />
              <span className="text-[10px] text-blue-600 truncate">
                {conv.client_name}
              </span>
            </div>
          )}
        </div>
      </button>
    );
  };

  const activeConvLocal =
    localConvs.find((c) => c.id === activeConversation?.id) ||
    activeConversation;

  return (
    <div
      className="flex h-[calc(100vh-220px)] min-h-[520px] bg-background border rounded-2xl overflow-hidden shadow-sm"
      dir="rtl"
    >
      {/* INFO PANEL (right side) */}
      {infoOpen && activeConvLocal && (
        <ConvInfoPanel
          conversation={activeConvLocal}
          onClose={() => setInfoOpen(false)}
          isMuted={isMuted}
          isFavorite={isFavorite}
          onToggleMute={toggleMute}
          onToggleFavorite={toggleFavorite}
          themeColor={themeColor}
          allLabels={allLabels}
          convLabels={convLabels}
          onAddLabel={addLabel}
          onRemoveLabel={removeLabel}
          onSetTheme={(color) => setTheme(color)}
          onArchive={handleArchive}
        />
      )}

      {/* SIDEBAR */}
      {(showSidebar || !isMobile) && (
        <div className="w-full md:w-72 lg:w-80 flex flex-col border-l bg-gradient-to-b from-muted/30 to-muted/10 shrink-0">
          <div className="p-3 border-b bg-background/80 backdrop-blur-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                שיחות
                {totalUnread > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground text-[10px] rounded-full">
                    {totalUnread}
                  </Badge>
                )}
              </h2>
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          const s = toggleSound();
                          setSoundOn(s);
                        }}
                      >
                        {soundOn ? (
                          <Volume2 className="h-3.5 w-3.5" />
                        ) : (
                          <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {soundOn ? "כבה צליל" : "הפעל צליל"}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          const n = toggleNotifications();
                          setNotifsOn(n);
                        }}
                      >
                        {notifsOn ? (
                          <Bell className="h-3.5 w-3.5" />
                        ) : (
                          <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {notifsOn ? "כבה התראות" : "הפעל התראות"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  size="sm"
                  onClick={() => setNewConvOpen(true)}
                  className="h-7 gap-1 rounded-lg text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  חדש
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="חפש שיחה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8 h-7 text-xs bg-background rounded-lg"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {(
                [
                  { key: "all", label: "הכל" },
                  { key: "internal", label: "פנימי" },
                  { key: "client", label: "לקוחות" },
                  { key: "group", label: "קבוצות" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap transition-all",
                    filterType === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1 p-1.5">
            {loading && localConvs.length === 0 ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-center p-4">
                <MessageCircle className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">אין שיחות</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewConvOpen(true)}
                  className="text-xs h-7 rounded-lg"
                >
                  <Plus className="h-3.5 w-3.5 ml-1" />
                  התחל שיחה
                </Button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredConversations.map((conv) => (
                  <ConvItem key={conv.id} conv={conv} />
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="px-2 py-1.5 border-t border-b">
            <button
              onClick={() => setSavedMsgsOpen(true)}
              className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <Bookmark className="h-3.5 w-3.5 text-amber-500" />
              <span>
                הודעות שמורות{" "}
                {savedMessages.length > 0 && `(${savedMessages.length})`}
              </span>
            </button>
          </div>

          <div className="p-2.5 bg-background/50 flex items-center gap-2">
            <div className="relative">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px] bg-primary/20 font-bold">
                  {profile?.full_name?.slice(0, 2) || "אנ"}
                </AvatarFallback>
              </Avatar>
              <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 absolute -bottom-0.5 -right-0.5" />
            </div>
            <div className="text-xs flex-1 min-w-0">
              <div className="font-medium truncate">
                {profile?.full_name || "משתמש"}
              </div>
              <div className="text-muted-foreground text-[10px]">
                מחובר • זמין
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHAT AREA */}
      {(!isMobile || !showSidebar) && (
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center p-8">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <MessageCircle className="h-10 w-10 text-primary/60" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1.5">מרכז השיחות</h3>
                <p className="text-muted-foreground text-sm">
                  שיחות פנימיות, עם לקוחות וקבוצות.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2 justify-center text-xs text-muted-foreground">
                  {[
                    "📎 קבצים",
                    "🎬 וידאו",
                    "🎙️ קול",
                    "📊 סקרים",
                    "⏰ תזמון",
                    "🤖 AI סיכום",
                    "📌 הצמדה",
                    "↩️ Reply",
                    "📥 ייצוא",
                  ].map((f) => (
                    <span
                      key={f}
                      className="bg-muted px-2 py-0.5 rounded-full border"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  onClick={() => setNewConvOpen(true)}
                  className="gap-2 rounded-xl"
                >
                  <Users className="h-4 w-4" />
                  שיחה פנימית
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setNewConvOpen(true)}
                  className="gap-2 rounded-xl"
                >
                  <Building2 className="h-4 w-4" />
                  שיחה עם לקוח
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b bg-background/90 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowSidebar(true)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <div
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                      activeConvLocal?.type === "client"
                        ? "bg-blue-100 text-blue-600"
                        : activeConvLocal?.type === "group"
                          ? "bg-purple-100 text-purple-600"
                          : "bg-green-100 text-green-600",
                    )}
                  >
                    {activeConvLocal?.type === "client" ? (
                      <Building2 className="h-4 w-4" />
                    ) : activeConvLocal?.type === "group" ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-tight">
                      {isFavorite && (
                        <Star className="inline h-3 w-3 text-amber-400 mb-0.5 ml-0.5" />
                      )}
                      {activeConvLocal?.title ||
                        activeConvLocal?.client_name ||
                        "שיחה פנימית"}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {activeConvLocal?.client_name && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4 px-1.5 rounded-full"
                        >
                          <Building2 className="h-2.5 w-2.5 ml-0.5" />
                          {activeConvLocal.client_name}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {activeConvLocal?.type === "client"
                          ? "שיחת לקוח"
                          : activeConvLocal?.type === "group"
                            ? "קבוצה"
                            : "פנימי"}
                      </span>
                      {slaInfo && (
                        <Badge
                          variant={
                            slaInfo.isBreached ? "destructive" : "outline"
                          }
                          className="text-[10px] h-4 px-1.5 rounded-full"
                        >
                          <Clock className="h-2.5 w-2.5 ml-0.5" />
                          {slaInfo.isBreached
                            ? "SLA חרג"
                            : `${slaInfo.first_response_minutes - slaInfo.minutesElapsed} דק׳`}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setMsgSearchOpen((s) => !s)}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>חפש בשיחה</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openGallery("all")}
                        >
                          <Folder className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>גלריית מדיה</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={toggleFavorite}
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              isFavorite
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground",
                            )}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isFavorite ? "הסר מהמועדפים" : "הוסף למועדפים"}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={toggleMute}
                        >
                          {isMuted ? (
                            <BellOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Bell className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isMuted ? "בטל השתקה" : "השתק שיחה"}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>שיחת טלפון</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Video className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>שיחת וידאו</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" dir="rtl">
                      <DropdownMenuItem onClick={handleAiSummary}>
                        <Sparkles className="h-4 w-4 ml-2 text-purple-500" />
                        סיכום AI
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAnalyticsOpen(true)}>
                        <BarChart2 className="h-4 w-4 ml-2 text-blue-500" />
                        אנליטיקס
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExport}>
                        <FileDown className="h-4 w-4 ml-2" />
                        ייצא טרנסקריפט
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openGallery("images")}>
                        <Image className="h-4 w-4 ml-2" />
                        גלריית תמונות
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openGallery("files")}>
                        <Folder className="h-4 w-4 ml-2" />
                        כל הקבצים
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSavedMsgsOpen(true)}>
                        <Bookmark className="h-4 w-4 ml-2 text-amber-500" />
                        הודעות שמורות
                      </DropdownMenuItem>
                      {activeConvLocal?.type === "client" &&
                        activeConvLocal?.client_id && (
                          <DropdownMenuItem
                            onClick={() => {
                              const phone = prompt("מספר טלפון לוואטסאפ:");
                              if (phone && input.trim())
                                sendWhatsApp(
                                  phone,
                                  input,
                                  activeConvLocal.client_id!,
                                );
                              else if (phone)
                                sendWhatsApp(
                                  phone,
                                  "שלום, אשמח לדבר איתך",
                                  activeConvLocal.client_id!,
                                );
                            }}
                          >
                            <Smartphone className="h-4 w-4 ml-2 text-green-600" />
                            שלח WhatsApp
                          </DropdownMenuItem>
                        )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setAssignClientOpen(true)}
                      >
                        <Link2 className="h-4 w-4 ml-2" />
                        {activeConvLocal?.client_id
                          ? "שנה לקוח משויך"
                          : "שייך ללקוח"}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pin className="h-4 w-4 ml-2" />
                        הצמד שיחה
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 ml-2" />
                        העבר לארכיון
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* In-conversation search */}
              {msgSearchOpen && (
                <div className="px-4 py-2 border-b bg-muted/20">
                  <div className="relative">
                    <Search className="absolute right-2.5 top-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="חפש בהודעות..."
                      value={msgSearch}
                      onChange={(e) => handleMsgSearch(e.target.value)}
                      className="pr-8 h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  {msgSearchResults.length > 0 && (
                    <ScrollArea className="mt-1.5 max-h-36">
                      <div className="space-y-0.5">
                        {msgSearchResults.map((m) => (
                          <button
                            key={m.id}
                            className="w-full text-right px-2 py-1.5 hover:bg-muted rounded-lg text-xs"
                          >
                            <span className="font-medium text-primary">
                              {m.sender_name}:{" "}
                            </span>
                            <span className="text-muted-foreground">
                              {m.content.slice(0, 80)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}

              {/* Pinned message bar */}
              {pinnedMsg && (
                <div className="px-4 py-1.5 border-b bg-amber-50 border-amber-200 flex items-center gap-2">
                  <Pin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-amber-800">
                      הצמדה:{" "}
                    </span>
                    <span className="text-xs text-amber-700 truncate">
                      {pinnedMsg.content || pinnedMsg.file_name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={() => {
                      setPinnedMsg(null);
                      pinMessage(activeConversation.id, null);
                    }}
                  >
                    <X className="h-3 w-3 text-amber-600" />
                  </Button>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 px-3 py-2">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">
                      שלח הודעה ראשונה!
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      טקסט • קבצים • וידאו • שמע • 📊 סקרים • ⏰ תזמון
                    </p>
                  </div>
                ) : (
                  <>
                    {groupedMessages.map(({ date, msgs }) => (
                      <div key={date}>
                        <DateDivider date={msgs[0].created_at} />
                        {msgs.map((msg, i) => (
                          <MessageBubble
                            key={msg.id}
                            msg={msg}
                            isOwn={msg.sender_id === user?.id}
                            onReply={setReplyTo}
                            onReact={addReaction}
                            onDelete={deleteMessage}
                            onEdit={(m) => {
                              setEditingMsg(m);
                              setEditContent(m.content);
                            }}
                            onForward={(m) => setForwardMsg(m)}
                            onPin={handlePin}
                            onTask={(m) => {
                              setTaskMsg(m);
                              setTaskTitle(m.content.slice(0, 60));
                            }}
                            onSave={saveMessage}
                            isSaved={isMessageSaved(msg.id)}
                            readBy={readBy}
                            onTranslate={handleTranslate}
                            isUrgent={(msg as any).is_urgent}
                            conversationId={activeConversation?.id}
                            showName={
                              i === 0 ||
                              msgs[i - 1]?.sender_id !== msg.sender_id
                            }
                          />
                        ))}
                      </div>
                    ))}
                  </>
                )}
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Typing indicator */}
              {activeConversation && (
                <TypingIndicator conversationId={activeConversation.id} />
              )}

              {/* Edit bar */}
              {editingMsg && (
                <div className="px-4 py-2 border-t bg-blue-50 flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-blue-600 shrink-0" />
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={1}
                    className="flex-1 text-sm resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 py-0"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleEditSave();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-7 rounded-lg"
                    onClick={handleEditSave}
                  >
                    שמור
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingMsg(null);
                      setEditContent("");
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* Reply bar */}
              {replyTo && !editingMsg && (
                <div className="px-4 py-1.5 border-t bg-primary/5 flex items-center gap-2">
                  <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-primary">
                      {replyTo.sender_name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {replyTo.content}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => setReplyTo(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Quick replies */}
              {!editingMsg && (
                <div className="px-3 pt-1.5 flex gap-1 overflow-x-auto">
                  {["תודה!", "בסדר גמור", "קיבלתי", "אחזור אליך", "ברגע"].map(
                    (qr) => (
                      <button
                        key={qr}
                        onClick={() => setInput(qr)}
                        className="text-[11px] px-2.5 py-1 bg-muted border rounded-full whitespace-nowrap hover:bg-primary/10 hover:border-primary/30 transition-colors shrink-0"
                      >
                        {qr}
                      </button>
                    ),
                  )}
                </div>
              )}

              {/* Input */}
              <div className="p-3 pt-2 border-t bg-muted/10">
                {voiceMode ? (
                  <VoiceRecorder
                    onRecorded={handleVoiceRecorded}
                    onCancel={() => setVoiceMode(false)}
                  />
                ) : (
                  <div className="flex items-end gap-2 bg-background rounded-2xl border shadow-sm px-3 py-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-xl text-muted-foreground hover:text-primary"
                            onClick={() => setFilePickerOpen(true)}
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">צרף קובץ</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-xl text-muted-foreground hover:text-red-500"
                            onClick={() => setVoiceMode(true)}
                          >
                            <Mic className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">הקלטה קולית</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-xl text-muted-foreground hover:text-purple-500"
                            onClick={() => setPollOpen(true)}
                          >
                            <BarChart2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">צור סקר</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-xl text-muted-foreground hover:text-orange-500"
                            onClick={() => {
                              setScheduleText(input);
                              setScheduleOpen(true);
                            }}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">תזמן הודעה</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-xl text-muted-foreground hover:text-cyan-500"
                            onClick={() => setScheduledOpen(true)}
                          >
                            <CalendarClock className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          הודעות מתוזמנות
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-xl text-muted-foreground hover:text-pink-500"
                            onClick={() => setGifOpen(true)}
                          >
                            <Image className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">GIF</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-xl text-muted-foreground hover:text-yellow-500"
                            onClick={() => setTemplatesOpen(true)}
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">תבניות הודעה</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className="relative flex-1">
                      {mentionQuery !== null && activeConversation && (
                        <MentionAutocomplete
                          conversationId={activeConversation.id}
                          query={mentionQuery}
                          onSelect={(name) => {
                            const atIdx = input.lastIndexOf("@");
                            setInput(input.slice(0, atIdx) + `@${name} `);
                            setMentionQuery(null);
                          }}
                          onClose={() => setMentionQuery(null)}
                        />
                      )}
                      <Textarea
                        ref={inputRef}
                        placeholder="כתוב הודעה... (הקלד @ לתיוג)"
                        value={input}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInput(val);
                          sendTyping();
                          // @mention detection
                          const atIdx = val.lastIndexOf("@");
                          if (
                            atIdx !== -1 &&
                            (atIdx === 0 || val[atIdx - 1] === " ")
                          ) {
                            setMentionQuery(val.slice(atIdx + 1).split(" ")[0]);
                          } else {
                            setMentionQuery(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (
                            mentionQuery !== null &&
                            ["ArrowUp", "ArrowDown", "Enter", "Tab"].includes(
                              e.key,
                            )
                          )
                            return;
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        rows={1}
                        className="w-full resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 min-h-[34px] max-h-[120px] py-1 text-sm"
                        style={{ fieldSizing: "content" } as any}
                      />
                    </div>

                    <Button
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-xl"
                      onClick={handleSend}
                      disabled={!input.trim() || sendingMessage}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  📎 • 🎙️ • 📊 • ⏰ • 🎬 GIF • ⚡ תבניות • ↩️ • 📌 • ✏️ • 🤖 AI
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== DIALOGS ===== */}
      <NewConversationDialog
        open={newConvOpen}
        onOpenChange={setNewConvOpen}
        onCreated={(conv) => selectConversation(conv)}
      />

      <ChatFilePicker
        open={filePickerOpen}
        onOpenChange={setFilePickerOpen}
        onFilePicked={handleFilePicked}
        conversationId={activeConversation?.id}
        clientId={activeConvLocal?.client_id || undefined}
      />

      {activeConversation && (
        <AssignClientDialog
          open={assignClientOpen}
          onOpenChange={setAssignClientOpen}
          conversationId={activeConversation.id}
          currentClientId={activeConvLocal?.client_id}
          onAssigned={handleClientAssigned}
        />
      )}

      {/* Forward message dialog */}
      <Dialog open={!!forwardMsg} onOpenChange={() => setForwardMsg(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              העבר הודעה
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground mb-2">
              {forwardMsg?.content?.slice(0, 60)}
            </p>
            <ScrollArea className="h-52 border rounded-lg">
              <div className="p-1 space-y-0.5">
                {localConvs
                  .filter((c) => c.id !== activeConversation?.id)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleForward(c.id)}
                      className="w-full flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-md text-sm text-right"
                    >
                      <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                      {c.title || c.client_name || "שיחה פנימית"}
                    </button>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to task dialog */}
      <Dialog open={!!taskMsg} onOpenChange={() => setTaskMsg(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              צור משימה מהודעה
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted rounded-lg p-2.5 text-sm text-muted-foreground">
              {taskMsg?.content?.slice(0, 100)}
            </div>
            <div className="space-y-1">
              <Label>כותרת המשימה</Label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="מה צריך לעשות?"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTaskMsg(null)}>
              ביטול
            </Button>
            <Button onClick={handleCreateTask} disabled={!taskTitle.trim()}>
              <ListTodo className="h-4 w-4 ml-1" />
              צור משימה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Poll creation dialog */}
      <Dialog open={pollOpen} onOpenChange={setPollOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-purple-600" />
              צור סקר
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>שאלה</Label>
              <Input
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="מה השאלה?"
              />
            </div>
            <div className="space-y-1.5">
              <Label>אפשרויות</Label>
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-1.5">
                  <Input
                    value={opt}
                    onChange={(e) =>
                      setPollOptions((prev) =>
                        prev.map((o, j) => (j === i ? e.target.value : o)),
                      )
                    }
                    placeholder={`אפשרות ${i + 1}`}
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() =>
                        setPollOptions((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setPollOptions((p) => [...p, ""])}
                >
                  <Plus className="h-4 w-4 ml-1" />
                  הוסף אפשרות
                </Button>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPollOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreatePoll}>
              <BarChart2 className="h-4 w-4 ml-1" />
              שלח סקר
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule message dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              תזמן הודעה
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>תוכן ההודעה</Label>
              <Textarea
                value={scheduleText}
                onChange={(e) => setScheduleText(e.target.value)}
                placeholder="מה לשלוח?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>תאריך</Label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>שעה</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={!scheduleText.trim() || !scheduleDate || !scheduleTime}
            >
              <Clock className="h-4 w-4 ml-1" />
              תזמן
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media gallery dialog */}
      <Dialog open={mediaGalleryOpen} onOpenChange={setMediaGalleryOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              מדיה וקבצים
            </DialogTitle>
          </DialogHeader>
          <Tabs
            value={galleryTab}
            onValueChange={(v) => {
              setGalleryTab(v as any);
              openGallery(v as any);
            }}
          >
            <TabsList className="mb-3">
              <TabsTrigger value="all">הכל</TabsTrigger>
              <TabsTrigger value="images">תמונות</TabsTrigger>
              <TabsTrigger value="files">קבצים</TabsTrigger>
            </TabsList>
            <TabsContent value={galleryTab}>
              {galleryItems.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  אין קבצים בשיחה זו
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                  {galleryItems.map((item) => (
                    <a
                      key={item.id}
                      href={item.file_url || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border rounded-lg overflow-hidden hover:border-primary transition-colors group"
                    >
                      {item.message_type === "image" && item.file_url ? (
                        <img
                          src={item.file_url}
                          alt={item.file_name || ""}
                          className="w-full h-20 object-cover group-hover:opacity-80 transition-opacity"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-20 flex flex-col items-center justify-center gap-1 bg-muted">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground text-center px-1 truncate w-full">
                            {item.file_name}
                          </span>
                        </div>
                      )}
                      <div className="px-1.5 py-0.5 text-[10px] text-muted-foreground truncate">
                        {format(new Date(item.created_at), "dd/MM/yy")}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* AI Summary dialog */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              סיכום AI של השיחה
            </DialogTitle>
          </DialogHeader>
          {summaryLoading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
              <span className="text-sm text-muted-foreground">מסכם...</span>
            </div>
          ) : (
            <div className="bg-muted/40 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {aiSummary}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* GIF Picker */}
      <GifPicker
        open={gifOpen}
        onClose={() => setGifOpen(false)}
        onSelect={(url, title) =>
          sendMessage(url, {
            messageType: "image" as any,
            fileUrl: url,
            fileName: title || "GIF",
          })
        }
      />

      {/* Message Templates */}
      <MessageTemplates
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        templates={templates}
        onSelect={(content) => setInput(content)}
      />

      {/* Analytics Dashboard */}
      <ChatAnalyticsDashboard
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
      />

      {/* Scheduled Messages */}
      <ScheduledMessagesList
        open={scheduledOpen}
        onClose={() => setScheduledOpen(false)}
        conversationId={activeConversation?.id}
      />

      {/* Saved Messages Panel */}
      <Dialog open={savedMsgsOpen} onOpenChange={setSavedMsgsOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-amber-500" />
              הודעות שמורות
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            {savedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <Bookmark className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">
                  שמור הודעות חשובות כדי למצוא אותן מהר
                </p>
              </div>
            ) : (
              <div className="space-y-2 pr-1">
                {savedMessages.map((s) => (
                  <div key={s.id} className="bg-muted/40 rounded-xl p-3 border">
                    <p className="text-sm leading-relaxed line-clamp-4">
                      {s.message?.content || "📎 קובץ"}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {s.saved_at
                          ? format(new Date(s.saved_at), "dd/MM HH:mm")
                          : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-destructive hover:text-destructive"
                        onClick={() => saveMessage(s.message_id)}
                      >
                        הסר
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
