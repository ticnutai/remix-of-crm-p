// EmailListItem - Single email row in the email list
import React, { useRef, useState, useEffect, useCallback } from "react";
import DOMPurify from "dompurify";
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
  MessageSquare,
  Building2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  // Callbacks
  onSelect: () => void;
  onToggleSelection: (
    messageId: string,
    index: number,
    shiftKey?: boolean,
  ) => void;
  onToggleStar: (messageId: string, isStarred: boolean) => Promise<void>;
  onOpenChat: (message: GmailMessage) => void;
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
  onHoverPreview?: (messageId: string) => void;
  hoverPreviewHtml?: string | null;
  hoverPreviewLoading?: boolean;
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
  onSelect,
  onToggleSelection,
  onToggleStar,
  onOpenChat,
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
  hoverPreviewHtml,
  hoverPreviewLoading,
}: EmailListItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: message.id,
    data: { message },
  });

  // Hover preview timer (3-second hover)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => {
      setShowPreviewPopup(true);
      onHoverPreview?.(message.id);
    }, 3000);
  }, [message.id, onHoverPreview]);

  const handleMouseLeave = useCallback(() => {
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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
                    className={cn(
                      "h-3.5 w-3.5",
                      isPinned && "fill-green-500",
                    )}
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
                  פתח כשיחה
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSetNote(message)}>
                  <FileText className="h-4 w-4 ml-2" />
                  הוסף הערה
                </DropdownMenuItem>
                {/* Move to folder sub-menu */}
                {folders.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      סווג לתיקייה
                    </div>
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={() => onMoveToFolder(folder.id, message)}
                      >
                        <Folder
                          className="h-4 w-4 ml-2"
                          style={{ color: folder.color }}
                        />
                        {folder.name}
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
              "font-medium truncate flex-shrink min-w-0",
              !message.isRead && "font-bold",
            )}
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

        {/* Row 2: Subject - full width */}
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
            className={cn(
              "text-sm",
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
              {message.snippet}
            </p>
          )}
        </div>
      </div>

      {/* Hover Preview Popup - shows after 3 seconds hover */}
      {showPreviewPopup && (
        <div
          ref={popupRef}
          className="fixed z-50 rounded-xl shadow-2xl"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(700px, 90vw)",
            maxHeight: "70vh",
            backgroundColor: "#ffffff",
            border: "3px solid #d4a843",
            boxShadow: "0 0 0 1px #b8962e, 0 25px 50px -12px rgba(0,0,0,0.25)",
            color: "#1a2744",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4"
            dir="rtl"
            style={{ borderBottom: "2px solid #d4a843", color: "#1a2744" }}
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate" style={{ color: "#1a2744" }}>
                {message.subject || "(ללא נושא)"}
              </h3>
              <p className="text-sm" style={{ color: "#3d5a8a" }}>
                {message.fromName} &lt;{message.from}&gt;
              </p>
              <p className="text-xs" style={{ color: "#6b82a8" }}>
                {formatDate(message.date)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 hover:bg-gray-100"
              style={{ color: "#1a2744" }}
              onClick={(e) => {
                e.stopPropagation();
                setShowPreviewPopup(false);
              }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Body */}
          <div
            className="overflow-y-auto p-4"
            dir="rtl"
            style={{ maxHeight: "calc(70vh - 100px)", backgroundColor: "#ffffff", color: "#1a2744" }}
          >
            {hoverPreviewLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : hoverPreviewHtml ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(hoverPreviewHtml, {
                    ALLOW_UNKNOWN_PROTOCOLS: true,
                  }),
                }}
              />
            ) : (
              <p className="whitespace-pre-wrap" style={{ color: "#3d5a8a" }}>
                {message.snippet}
              </p>
            )}
          </div>
          {/* Footer actions */}
          <div
            className="flex items-center gap-2 p-3"
            dir="rtl"
            style={{ borderTop: "2px solid #d4a843", backgroundColor: "#ffffff" }}
          >
            <Button
              size="sm"
              variant="outline"
              className="border-[#d4a843] hover:bg-[#f8f3e6]"
              style={{ color: "#1a2744" }}
              onClick={(e) => {
                e.stopPropagation();
                setShowPreviewPopup(false);
                onSelect();
              }}
            >
              פתח מייל מלא
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-[#d4a843] hover:bg-[#f8f3e6]"
              style={{ color: "#1a2744" }}
              onClick={(e) => {
                e.stopPropagation();
                setShowPreviewPopup(false);
                onReply(message);
              }}
            >
              <Reply className="h-3.5 w-3.5 ml-1" />
              השב
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-[#d4a843] hover:bg-[#f8f3e6]"
              style={{ color: "#1a2744" }}
              onClick={(e) => {
                e.stopPropagation();
                setShowPreviewPopup(false);
                onForward(message);
              }}
            >
              <Forward className="h-3.5 w-3.5 ml-1" />
              העבר
            </Button>
          </div>
        </div>
      )}
      {/* Backdrop for preview popup */}
      {showPreviewPopup && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setShowPreviewPopup(false)}
        />
      )}
    </>
  );
});
