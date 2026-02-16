// EmailListItem - Single email row in the email list
import React from "react";
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
  Star,
  StarOff,
  MoreVertical,
  Bell,
  FileText,
  MailOpen,
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
  MessageSquare,
  Building2,
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
  onToggleSelection: (messageId: string, index: number, shiftKey?: boolean) => void;
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
}

export function EmailListItem({
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
}: EmailListItemProps) {
  return (
    <div
      data-message-id={message.id}
      className={cn(
        "flex items-start gap-3 hover:bg-muted/50 transition-colors cursor-pointer group",
        !message.isRead && "bg-primary/5",
        isSelected && "bg-primary/10",
        displayDensity === "compact" && "p-2",
        displayDensity === "comfortable" && "p-3",
        displayDensity === "spacious" && "p-4",
      )}
    >
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
        className="mt-1"
      />

      {/* Star */}
      <div
        className="flex-shrink-0 mt-1 cursor-pointer"
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
        <div className="flex-shrink-0 mt-1">
          {PRIORITY_CONFIG[emailPriority].icon}
        </div>
      )}

      {/* Main Content */}
      <div
        className="flex-1 min-w-0"
        onClick={async () => {
          onSelect();
          if (!message.isRead) {
            await onMarkAsRead(message.id, true);
            onRefresh();
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
          {threadCount > 1 && (
            <Badge
              variant="outline"
              className="h-5 gap-1 text-xs cursor-pointer hover:bg-primary/10"
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
              className="h-5 gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
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
                      "h-2 w-2 rounded-full",
                      label.color,
                    )}
                    title={label.name}
                  />
                )
              );
            })}
          {(msgLabels?.filter((l) => !l.startsWith("client_")).length || 0) > 2 && (
            <span className="text-xs text-muted-foreground">
              +{(msgLabels?.filter((l) => !l.startsWith("client_")).length || 0) - 2}
            </span>
          )}

          {/* Reminder indicator */}
          {hasReminder && (
            <Bell className="h-3 w-3 text-orange-500" />
          )}

          {/* Note indicator */}
          {hasNote && (
            <FileText className="h-3 w-3 text-blue-500" />
          )}

          {/* Pin indicator */}
          {isPinned && (
            <Bookmark className="h-3 w-3 text-green-500 fill-green-500" />
          )}

          {/* Attachment indicator */}
          {(message.labels?.some((l) => l === "ATTACHMENT") ||
            message.snippet?.includes("attachment") ||
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
            displayDensity === "compact" && "text-xs truncate",
            displayDensity === "comfortable" && "line-clamp-1",
            displayDensity === "spacious" && "line-clamp-2",
          )}
        >
          {message.subject || "(ללא נושא)"}
        </p>
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
        <DropdownMenuContent align="end" className="rtl">
          <DropdownMenuItem onClick={() => onOpenChat(message)}>
            <MessageSquare className="h-4 w-4 ml-2" />
            פתח כשיחה
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSetReminder(message)}>
            <Bell className="h-4 w-4 ml-2" />
            הוסף תזכורת
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSetNote(message)}>
            <FileText className="h-4 w-4 ml-2" />
            הוסף הערה
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              await onMarkAsRead(message.id, !message.isRead);
              onRefresh();
            }}
          >
            <MailOpen className="h-4 w-4 ml-2" />
            {message.isRead ? "סמן כלא נקרא" : "סמן כנקרא"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTogglePin(message.id, isPinned)}
          >
            <Bookmark className="h-4 w-4 ml-2" />
            {isPinned ? "הסר הצמדה" : "הצמד"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onReply(message)}>
            <Reply className="h-4 w-4 ml-2" />
            השב
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onForward(message)}>
            <Forward className="h-4 w-4 ml-2" />
            העבר
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Move to folder sub-menu */}
          {folders.length > 0 && (
            <>
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
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={async () => {
              const success = await onArchive(message.id);
              if (success) onRefresh();
            }}
          >
            <Archive className="h-4 w-4 ml-2" />
            העבר לארכיון
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={async () => {
              const success = await onDelete(message.id);
              if (success) onRefresh();
            }}
          >
            <Trash2 className="h-4 w-4 ml-2" />
            מחק
          </DropdownMenuItem>
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
    </div>
  );
}
