// EmailListItem - Single email row in the email list
import React, { useRef, useEffect, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Star,
  StarOff,
  MoreVertical,
  Bell,
  FileText,
  MailOpen,
  MailPlus,
  Bookmark,
  Reply,
  Forward,
  Paperclip,
  Archive,
  Trash2,
  ShieldAlert,
  VolumeX,
  Timer,
  Folder,
  FolderOpen,
  FolderX,
  FolderInput,
  Tag,
  MessageSquare,
  Building2,
  X,
  Contact,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Decode HTML entities and clean snippets
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
  text = text.replace(/\s{2,}/g, " ").trim();
  return text;
}
import { GmailMessage } from "@/hooks/useGmailIntegration";
import { Client, EmailLabel, Priority, PRIORITY_CONFIG } from "./gmail-types";

interface EmailFolder {
  id: string;
  name: string;
  color: string;
}

interface EmailListItemProps {
  message: GmailMessage;
  index: number;
  isSelected: boolean;
  displayDensity: "compact" | "comfortable" | "spacious";
  showPreview: boolean;
  threadCount: number;
  // Metadata
  emailPriority: Priority | undefined;
  emailLabels: string[] | undefined;
  hasReminder: boolean;
  hasNote: boolean;
  isPinned: boolean;
  // Client
  client: Client | null;
  customLabels: EmailLabel[];
  // State
  mutedThreads: Set<string>;
  folders: EmailFolder[];
  // Active folder context (when viewing a specific folder)
  activeFolderId?: string | null;
  activeFolderName?: string;
  onRemoveFromFolder?: (folderId: string, emailId: string) => Promise<void>;
  // Callbacks
  onSelect: () => void;
  onToggleSelection: (
    messageId: string,
    index: number,
    shiftKey?: boolean,
  ) => void;
  onToggleStar: (messageId: string, isStarred: boolean) => Promise<void>;
  onOpenChat: (message: GmailMessage) => void;
  onOpenSenderChat?: (email: string, name: string) => void;
  onSetReminder: (message: GmailMessage) => void;
  onSetNote: (message: GmailMessage) => void;
  onMarkAsRead: (messageId: string, isRead: boolean) => Promise<void>;
  onTogglePin: (messageId: string, isPinned: boolean) => void;
  onReply: (message: GmailMessage) => void;
  onForward: (message: GmailMessage) => void;
  onMoveToFolder: (folderId: string, message: GmailMessage) => Promise<void>;
  onArchive: (messageId: string) => Promise<boolean>;
  onDelete: (messageId: string) => Promise<boolean>;
  onReportSpam: (messageId: string) => Promise<void>;
  onMuteThread: (threadId: string) => void;
  onSnooze: (messageId: string, until: Date) => void;
  onRefresh: () => void;
  formatDate: (dateStr: string) => string;
  // Hover preview
  onHoverPreview?: (messageId: string, y: number) => void;
}

export const EmailListItem = React.memo(function EmailListItemInner({
  message,
  index,
  isSelected,
  displayDensity,
  showPreview,
  threadCount,
  emailPriority,
  emailLabels: msgLabels,
  hasReminder,
  hasNote,
  isPinned,
  client,
  customLabels,
  mutedThreads,
  folders,
  activeFolderId,
  activeFolderName,
  onRemoveFromFolder,
  onSelect,
  onToggleSelection,
  onToggleStar,
  onOpenChat,
  onOpenSenderChat,
  onSetReminder,
  onSetNote,
  onMarkAsRead,
  onTogglePin,
  onReply,
  onForward,
  onMoveToFolder,
  onArchive,
  onDelete,
  onReportSpam,
  onMuteThread,
  onSnooze,
  onRefresh,
  formatDate,
  onHoverPreview,
}: EmailListItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: message.id,
    data: { message },
  });

  // Hover preview timer - triggers on subject hover only
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverYRef = useRef<number>(0);

  const handleSubjectMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      // Store the Y position of the subject element
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      hoverYRef.current = rect.top;
      hoverTimerRef.current = setTimeout(() => {
        onHoverPreview?.(message.id, hoverYRef.current);
      }, 300);
    },
    [message.id, onHoverPreview],
  );

  const handleSubjectMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        data-message-id={message.id}
        className={cn(
          "relative hover:bg-muted/50 transition-colors cursor-pointer group border-b",
          !message.isRead && "bg-primary/5",
          isSelected && "bg-primary/10",
          isDragging && "opacity-50",
          displayDensity === "compact" && "px-3 py-2",
          displayDensity === "comfortable" && "px-3 py-3",
          displayDensity === "spacious" && "px-4 py-4",
        )}
      >
        {/* Hover Quick Action Icons - floating above content */}
        <div className="absolute top-1 left-2 z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 backdrop-blur-sm rounded-md shadow-sm border px-1 py-0.5">
          <TooltipProvider delayDuration={200}>
            {/* Remove from folder (only when viewing a folder) */}
            {activeFolderId && onRemoveFromFolder && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-orange-500"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await onRemoveFromFolder(activeFolderId, message.id);
                      onRefresh();
                    }}
                  >
                    <FolderX className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">הסר מתיקייה</TooltipContent>
              </Tooltip>
            )}

            {/* Reply */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReply(message);
                  }}
                >
                  <Reply className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">השב</TooltipContent>
            </Tooltip>

            {/* Forward */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onForward(message);
                  }}
                >
                  <Forward className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">העבר</TooltipContent>
            </Tooltip>

            {/* Archive */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const success = await onArchive(message.id);
                    if (success) onRefresh();
                  }}
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">ארכיון</TooltipContent>
            </Tooltip>

            {/* Delete */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const success = await onDelete(message.id);
                    if (success) onRefresh();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">מחק</TooltipContent>
            </Tooltip>

            {/* Reminder */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", hasReminder && "text-orange-500")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetReminder(message);
                  }}
                >
                  <Bell className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">תזכורת</TooltipContent>
            </Tooltip>

            {/* Mark read/unread */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onMarkAsRead(message.id, !message.isRead);
                    onRefresh();
                  }}
                >
                  {message.isRead ? (
                    <MailPlus className="h-3.5 w-3.5" />
                  ) : (
                    <MailOpen className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {message.isRead ? "סמן כלא נקרא" : "סמן כנקרא"}
              </TooltipContent>
            </Tooltip>

            {/* Pin */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", isPinned && "text-green-500")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(message.id, isPinned);
                  }}
                >
                  <Bookmark
                    className={cn("h-3.5 w-3.5", isPinned && "fill-green-500")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isPinned ? "הסר הצמדה" : "הצמד"}
              </TooltipContent>
            </Tooltip>

            {/* More actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rtl">
                <DropdownMenuItem onClick={() => onOpenChat(message)}>
                  <MessageSquare className="h-4 w-4 ml-2" />
                  פתח כשיחה (שרשור)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onOpenSenderChat?.(message.from, message.fromName)
                  }
                >
                  <Contact className="h-4 w-4 ml-2" />
                  צ'אט לפי שולח
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSetNote(message)}>
                  <FileText className="h-4 w-4 ml-2" />
                  הוסף הערה
                </DropdownMenuItem>
                {/* Remove from current folder */}
                {activeFolderId && onRemoveFromFolder && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        await onRemoveFromFolder(activeFolderId, message.id);
                        onRefresh();
                      }}
                      className="text-orange-600"
                    >
                      <FolderX className="h-4 w-4 ml-2" />
                      הסר מתיקייה "{activeFolderName}"
                    </DropdownMenuItem>
                  </>
                )}
                {/* Tag / Move to folder sub-menu */}
                {folders.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      <Tag className="h-3 w-3 inline ml-1" />
                      תייג / סווג לתיקייה
                    </div>
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={() => onMoveToFolder(folder.id, message)}
                      >
                        <Tag
                          className="h-4 w-4 ml-2"
                          style={{ color: folder.color }}
                        />
                        {folder.name}
                        <span className="text-[10px] text-muted-foreground mr-auto">
                          תיוג
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await onReportSpam(message.id);
                    onRefresh();
                  }}
                >
                  <ShieldAlert className="h-4 w-4 ml-2" />
                  דווח כספאם
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMuteThread(message.threadId)}
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
                    onSnooze(message.id, d);
                  }}
                >
                  <Timer className="h-4 w-4 ml-2" />
                  נדניק למחר
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        </div>

        {/* Row 1: Checkbox, Star, Priority, Sender, Badges, Date */}
        <div className="flex items-center gap-2 overflow-hidden flex-nowrap">
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(message.id, index)}
            onClick={(e) => {
              e.stopPropagation();
              if ((e as any).shiftKey) {
                onToggleSelection(message.id, index, true);
              }
            }}
            className="flex-shrink-0"
          />

          {/* Star */}
          <div
            className="flex-shrink-0 cursor-pointer"
            onClick={async (e) => {
              e.stopPropagation();
              await onToggleStar(message.id, message.isStarred);
              onRefresh();
            }}
          >
            {message.isStarred ? (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4 text-muted-foreground/30 hover:text-yellow-500 transition-colors" />
            )}
          </div>

          {/* Priority Icon */}
          {emailPriority && emailPriority !== "none" && (
            <div className="flex-shrink-0">
              {PRIORITY_CONFIG[emailPriority].icon}
            </div>
          )}

          <span
            className={cn(
              "font-medium truncate flex-shrink min-w-0 cursor-pointer hover:text-primary hover:underline transition-colors",
              !message.isRead && "font-bold",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onOpenSenderChat?.(message.from, message.fromName);
            }}
            title={`צ'אט עם ${message.fromName}`}
          >
            {message.fromName}
          </span>

          {/* Thread count badge */}
          {threadCount > 1 && (
            <Badge
              variant="outline"
              className="h-5 gap-1 text-xs cursor-pointer hover:bg-primary/10 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChat(message);
              }}
            >
              <MessageSquare className="h-3 w-3" />
              {threadCount}
            </Badge>
          )}

          {/* Client Badge */}
          {client && (
            <Badge
              variant="secondary"
              className="h-5 gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 flex-shrink-0"
            >
              <Building2 className="h-3 w-3" />
              {client.name}
            </Badge>
          )}

          {/* Account Badge (multi-account) */}
          {message.accountEmail && (
            <Badge
              variant="outline"
              className="h-5 text-[10px] text-muted-foreground flex-shrink-0 max-w-[100px] truncate"
              title={message.accountEmail}
            >
              {message.accountEmail.split('@')[0]}
            </Badge>
          )}

          {/* Labels */}
          {msgLabels
            ?.filter((l) => !l.startsWith("client_"))
            .slice(0, 2)
            .map((labelId) => {
              const label = customLabels.find((l) => l.id === labelId);
              return (
                label && (
                  <div
                    key={labelId}
                    className={cn(
                      "h-2 w-2 rounded-full flex-shrink-0",
                      label.color,
                    )}
                    title={label.name}
                  />
                )
              );
            })}
          {(msgLabels?.filter((l) => !l.startsWith("client_")).length || 0) >
            2 && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              +
              {(msgLabels?.filter((l) => !l.startsWith("client_")).length ||
                0) - 2}
            </span>
          )}

          {/* Reminder indicator */}
          {hasReminder && (
            <Bell className="h-3 w-3 text-orange-500 flex-shrink-0" />
          )}

          {/* Note indicator */}
          {hasNote && (
            <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
          )}

          {/* Pin indicator */}
          {isPinned && (
            <Bookmark className="h-3 w-3 text-green-500 fill-green-500 flex-shrink-0" />
          )}

          {/* Attachment indicator */}
          {(message.labels?.some((l) => l === "ATTACHMENT") ||
            message.snippet?.includes("attachment") ||
            message.snippet?.includes("מצורף") ||
            message.snippet?.includes("attached") ||
            message.snippet?.includes("file")) && (
            <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          )}

          <span className="text-xs text-muted-foreground ms-auto flex-shrink-0">
            {formatDate(message.date)}
          </span>
        </div>

        {/* Row 2: Subject - full width, hover triggers preview */}
        <div
          className="mt-1"
          onClick={async () => {
            onSelect();
            if (!message.isRead) {
              await onMarkAsRead(message.id, true);
              onRefresh();
            }
          }}
        >
          <p
            onMouseEnter={handleSubjectMouseEnter}
            onMouseLeave={handleSubjectMouseLeave}
            className={cn(
              "text-sm cursor-pointer hover:underline decoration-primary/40",
              !message.isRead && "font-semibold",
              displayDensity === "compact" && "text-xs truncate",
              displayDensity === "comfortable" && "line-clamp-1",
              displayDensity === "spacious" && "line-clamp-2",
            )}
          >
            {message.subject || "(ללא נושא)"}
          </p>

          {/* Row 3: Snippet Preview - full width */}
          {showPreview && displayDensity !== "compact" && (
            <p
              className={cn(
                "text-muted-foreground mt-1",
                displayDensity === "spacious"
                  ? "text-sm line-clamp-2"
                  : "text-xs line-clamp-1",
              )}
            >
              {cleanSnippet(message.snippet)}
            </p>
          )}
        </div>
      </div>
    </>
  );
});
