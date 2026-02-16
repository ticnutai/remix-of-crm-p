// Email Thread Chat View - Display email conversations like a chat
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send,
  ArrowRight,
  User,
  Clock,
  Paperclip,
  Loader2,
  ChevronDown,
  ChevronUp,
  Star,
  MoreVertical,
  Reply,
  Forward,
  Trash2,
  Archive,
  MessageSquare,
  Search,
  X,
  Quote,
  Mic,
  MicOff,
  Square,
  Volume2,
  File,
  Image,
  Film,
} from "lucide-react";
import { GmailMessage, EmailAttachment } from "@/hooks/useGmailIntegration";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { EmojiPicker } from "./EmojiPicker";
import { format, isToday, isYesterday } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Decode HTML entities and clean up messy email snippets
function cleanSnippet(raw: string): string {
  if (!raw) return "";
  let text = raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  text = text.replace(/<[^@\s>]+@[^>\s]+>/g, "");
  text = text.replace(
    /\b(From|Sent|To|Date|Cc|Subject|מאת|אל|נשלח|תאריך|נושא|עותק)\s*:\s*[^\n]*/gi,
    "",
  );
  text = text.replace(
    /-{3,}\s*(Forwarded message|הודעה שהועברה|Original Message|הודעה מקורית)\s*-{3,}/gi,
    "",
  );
  text = text.replace(/\s{2,}/g, " ").trim();
  return text;
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThreadMessage {
  id: string;
  from: string;
  fromName: string;
  to: string[];
  date: string;
  snippet: string;
  body?: string;
  isRead: boolean;
  isStarred: boolean;
  isSent: boolean; // true if sent by current user
}

interface EmailThreadChatProps {
  threadId: string;
  messages: ThreadMessage[];
  currentUserEmail: string;
  subject: string;
  isLoading?: boolean;
  isSending?: boolean;
  onBack: () => void;
  onSendReply: (
    message: string,
    attachments?: EmailAttachment[],
  ) => Promise<boolean>;
  onArchive?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onToggleStar?: (messageId: string, isStarred: boolean) => void;
  onForward?: (message: ThreadMessage) => void;
}

// Helper to detect and separate quoted text
const splitQuotedText = (
  text: string,
): { main: string; quoted: string | null } => {
  // Common quote patterns in emails
  const quotePatterns = [
    /\n-{3,}\s*Original Message\s*-{3,}/i,
    /\n-{3,}\s*הודעה מקורית\s*-{3,}/i,
    /\nOn .+ wrote:/i,
    /\n>+ .+/,
    /\n_{3,}/,
    /\nFrom: .+\nSent: .+/i,
    /\nמאת: .+\nנשלח: .+/,
    /\n-{2,}\s*Forwarded message\s*-{2,}/i,
  ];

  for (const pattern of quotePatterns) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      return {
        main: text.substring(0, match.index).trim(),
        quoted: text.substring(match.index).trim(),
      };
    }
  }

  return { main: text, quoted: null };
};

export const EmailThreadChat = ({
  threadId,
  messages,
  currentUserEmail,
  subject,
  isLoading = false,
  isSending = false,
  onBack,
  onSendReply,
  onArchive,
  onDelete,
  onToggleStar,
  onForward,
}: EmailThreadChatProps) => {
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
  const [chatAttachments, setChatAttachments] = useState<EmailAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorder = useVoiceRecorder();

  // File handling for chat
  const readFileAsBase64 = (
    file: globalThis.File,
  ): Promise<EmailAttachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] || "";
        resolve({
          name: file.name,
          type: file.type || "application/octet-stream",
          data: base64,
          size: file.size,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const addChatFiles = useCallback(
    async (files: FileList | globalThis.File[]) => {
      const fileArray = Array.from(files);
      try {
        const newAttachments = await Promise.all(
          fileArray.map(readFileAsBase64),
        );
        setChatAttachments((prev) => [...prev, ...newAttachments]);
      } catch (error) {
        console.error("Error reading files:", error);
      }
    },
    [],
  );

  const handleChatDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      await addChatFiles(e.dataTransfer.files);
    }
  };

  const attachVoiceToChat = async () => {
    const base64 = await voiceRecorder.getBase64();
    if (base64 && voiceRecorder.audioBlob) {
      setChatAttachments((prev) => [
        ...prev,
        {
          name: `voice_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.webm`,
          type: voiceRecorder.audioBlob!.type || "audio/webm",
          data: base64,
          size: voiceRecorder.audioBlob!.size,
        },
      ]);
      voiceRecorder.cancelRecording();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/"))
      return <Image className="h-3 w-3 text-green-500" />;
    if (type.startsWith("video/"))
      return <Film className="h-3 w-3 text-purple-500" />;
    if (type.startsWith("audio/"))
      return <Volume2 className="h-3 w-3 text-blue-500" />;
    return <File className="h-3 w-3 text-gray-500" />;
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Format date for chat display
  const formatChatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isToday(date)) {
        return format(date, "HH:mm", { locale: he });
      }
      if (isYesterday(date)) {
        return "אתמול " + format(date, "HH:mm", { locale: he });
      }
      return format(date, "dd/MM HH:mm", { locale: he });
    } catch {
      return dateStr;
    }
  };

  // Check if message is from current user
  const isOwnMessage = (msg: ThreadMessage) => {
    return (
      msg.from.toLowerCase() === currentUserEmail.toLowerCase() || msg.isSent
    );
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Handle send reply
  const handleSendReply = async () => {
    if ((!replyText.trim() && chatAttachments.length === 0) || isSending)
      return;

    const success = await onSendReply(
      replyText,
      chatAttachments.length > 0 ? chatAttachments : undefined,
    );
    if (success) {
      setReplyText("");
      setChatAttachments([]);
      textareaRef.current?.focus();
    }
  };

  // Handle key press (Ctrl+Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Filter messages by search
  const displayMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (msg) =>
        (msg.body || msg.snippet || "").toLowerCase().includes(q) ||
        msg.fromName.toLowerCase().includes(q) ||
        msg.from.toLowerCase().includes(q),
    );
  }, [messages, searchQuery]);

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: ThreadMessage[] }[] = [];
    let currentDate = "";

    displayMessages.forEach((msg) => {
      const msgDate = format(new Date(msg.date), "yyyy-MM-dd");
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  }, [displayMessages]);

  // Format date header
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "היום";
    if (isYesterday(date)) return "אתמול";
    return format(date, "EEEE, dd בMMMM", { locale: he });
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex flex-col border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4 pb-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">
              {subject || "(ללא נושא)"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {messages.length} הודעות בשרשור
              {searchQuery && ` • ${displayMessages.length} תוצאות`}
            </p>
          </div>
          <Button
            variant={showSearch ? "secondary" : "ghost"}
            size="icon"
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) setSearchQuery("");
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Badge variant="secondary" className="gap-1">
            <MessageSquare className="h-3 w-3" />
            תצוגת צ'אט
          </Badge>
        </div>
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש בשרשור..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 text-right"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {groupedMessages.map((group, groupIdx) => (
              <div key={group.date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 my-4">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {formatDateHeader(group.date)}
                  </span>
                  <Separator className="flex-1" />
                </div>

                {/* Messages */}
                <div className="space-y-4">
                  {group.messages.map((msg, msgIdx) => {
                    const isOwn = isOwnMessage(msg);

                    return (
                      <div
                        key={msg.id}
                        dir="ltr"
                        className={cn(
                          "flex gap-3 max-w-[85%]",
                          isOwn ? "ml-auto" : "mr-auto",
                        )}
                      >
                        {/* Avatar */}
                        {!isOwn && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(msg.fromName)}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        {/* Message Bubble */}
                        <div className="flex-1 min-w-0 text-right" dir="rtl">
                          {/* Sender Name (only for received messages) */}
                          {!isOwn && (
                            <p className="text-xs text-muted-foreground mb-1 mr-1 text-right">
                              {msg.fromName}
                            </p>
                          )}

                          <div
                            className={cn(
                              "rounded-2xl px-4 py-3 relative group",
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-tl-sm"
                                : "bg-muted rounded-tr-sm",
                            )}
                          >
                            {/* Message Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "absolute top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                                    isOwn ? "left-1" : "right-1",
                                  )}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align={isOwn ? "start" : "end"}
                              >
                                {onToggleStar && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onToggleStar(msg.id, msg.isStarred)
                                    }
                                  >
                                    <Star
                                      className={cn(
                                        "h-4 w-4 ml-2",
                                        msg.isStarred &&
                                          "fill-yellow-500 text-yellow-500",
                                      )}
                                    />
                                    {msg.isStarred ? "הסר כוכב" : "הוסף כוכב"}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => onForward?.(msg)}
                                >
                                  <Forward className="h-4 w-4 ml-2" />
                                  העבר
                                </DropdownMenuItem>
                                {onArchive && (
                                  <DropdownMenuItem
                                    onClick={() => onArchive(msg.id)}
                                  >
                                    <Archive className="h-4 w-4 ml-2" />
                                    ארכיון
                                  </DropdownMenuItem>
                                )}
                                {onDelete && (
                                  <DropdownMenuItem
                                    onClick={() => onDelete(msg.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    מחק
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Star indicator */}
                            {msg.isStarred && (
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 absolute top-2 left-2" />
                            )}

                            {/* Message Content */}
                            {(() => {
                              const content = cleanSnippet(
                                msg.body || msg.snippet || "",
                              );
                              const { main, quoted } = splitQuotedText(content);
                              const isQuoteExpanded = expandedQuotes.has(
                                msg.id,
                              );

                              return (
                                <>
                                  <p
                                    className={cn(
                                      "text-sm whitespace-pre-wrap break-words text-right",
                                      isOwn
                                        ? "text-primary-foreground"
                                        : "text-foreground",
                                    )}
                                  >
                                    {main}
                                  </p>
                                  {quoted && (
                                    <div className="mt-2">
                                      <button
                                        className={cn(
                                          "flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full transition-colors",
                                          isOwn
                                            ? "text-primary-foreground/70 hover:text-primary-foreground bg-primary-foreground/10"
                                            : "text-muted-foreground hover:text-foreground bg-muted-foreground/10",
                                        )}
                                        onClick={() => {
                                          setExpandedQuotes((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(msg.id))
                                              next.delete(msg.id);
                                            else next.add(msg.id);
                                            return next;
                                          });
                                        }}
                                      >
                                        <Quote className="h-3 w-3" />
                                        {isQuoteExpanded
                                          ? "הסתר ציטוט"
                                          : "הצג ציטוט"}
                                        {isQuoteExpanded ? (
                                          <ChevronUp className="h-3 w-3" />
                                        ) : (
                                          <ChevronDown className="h-3 w-3" />
                                        )}
                                      </button>
                                      {isQuoteExpanded && (
                                        <p
                                          className={cn(
                                            "text-xs whitespace-pre-wrap break-words text-right mt-1 pt-1 border-t opacity-70",
                                            isOwn
                                              ? "text-primary-foreground border-primary-foreground/20"
                                              : "text-foreground border-muted-foreground/20",
                                          )}
                                        >
                                          {quoted}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </>
                              );
                            })()}

                            {/* Time */}
                            <p
                              className={cn(
                                "text-[10px] mt-2 text-right",
                                isOwn
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground",
                              )}
                            >
                              {formatChatDate(msg.date)}
                            </p>
                          </div>
                        </div>

                        {/* Own Avatar */}
                        {isOwn && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              אני
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Hidden file input */}
      <input
        ref={chatFileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="*/*"
        onChange={(e) => {
          if (e.target.files) addChatFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Reply Input */}
      <div
        className={cn(
          "p-4 border-t bg-background/95 backdrop-blur",
          isDragOver && "ring-2 ring-primary",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={handleChatDrop}
      >
        {/* Voice recorder bar */}
        {(voiceRecorder.isRecording || voiceRecorder.audioUrl) && (
          <div className="mb-2 bg-accent/50 rounded-lg p-2">
            {voiceRecorder.isRecording ? (
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium">מקליט...</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {Math.floor(voiceRecorder.duration / 60)}:
                  {(voiceRecorder.duration % 60).toString().padStart(2, "0")}
                </span>
                <div className="mr-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => voiceRecorder.cancelRecording()}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => voiceRecorder.stopRecording()}
                  >
                    <Square className="h-3 w-3 ml-1" />
                    עצור
                  </Button>
                </div>
              </div>
            ) : (
              voiceRecorder.audioUrl && (
                <div className="flex items-center gap-2">
                  <audio
                    src={voiceRecorder.audioUrl}
                    controls
                    className="flex-1 h-7"
                  />
                  <Button
                    variant="default"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={attachVoiceToChat}
                  >
                    <Paperclip className="h-3 w-3 ml-1" />
                    צרף
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => voiceRecorder.cancelRecording()}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )
            )}
          </div>
        )}

        {/* Attached files preview */}
        {chatAttachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {chatAttachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-1 bg-accent/40 rounded px-2 py-1 text-xs"
              >
                {getFileIcon(att.type)}
                <span className="max-w-[100px] truncate">{att.name}</span>
                <span className="text-muted-foreground">
                  {formatFileSize(att.size)}
                </span>
                <button
                  onClick={() =>
                    setChatAttachments((prev) =>
                      prev.filter((_, idx) => idx !== i),
                    )
                  }
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* Action buttons */}
          <div className="flex flex-col gap-1 pb-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => chatFileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>צרף קובץ</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={
                      voiceRecorder.isRecording ? "destructive" : "ghost"
                    }
                    size="icon"
                    className="h-7 w-7"
                    onClick={async () => {
                      if (voiceRecorder.isRecording) {
                        voiceRecorder.stopRecording();
                      } else {
                        await voiceRecorder.startRecording();
                      }
                    }}
                  >
                    {voiceRecorder.isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {voiceRecorder.isRecording
                    ? "עצור הקלטה"
                    : "הקלט הודעה קולית"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <EmojiPicker
              onSelect={(emoji) => setReplyText((prev) => prev + emoji)}
              triggerSize="icon"
            />
          </div>

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder={isDragOver ? "שחרר כאן קבצים..." : "כתוב תשובה..."}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[60px] max-h-[200px] resize-none pr-4 pb-8"
              disabled={isSending}
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
              Ctrl+Enter לשליחה
            </span>
          </div>
          <Button
            onClick={async () => {
              const success = await onSendReply(
                replyText,
                chatAttachments.length > 0 ? chatAttachments : undefined,
              );
              if (success) {
                setReplyText("");
                setChatAttachments([]);
              }
            }}
            disabled={
              (!replyText.trim() && chatAttachments.length === 0) || isSending
            }
            className="h-[60px] px-6"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-5 w-5 ml-2" />
                שלח
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
