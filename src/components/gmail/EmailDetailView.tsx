// EmailDetailView - Extracted from Gmail.tsx for better maintainability
import React, { memo, useMemo, useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  User,
  Clock,
  ChevronLeft,
  Loader2,
  Tag,
  Reply,
  ReplyAll,
  Forward,
  Paperclip,
  Building2,
  FileText,
  Bookmark,
  Bell,
  MessageSquare,
  Download,
  File,
  Image as ImageIcon,
  Film,
  Volume2,
  FileSpreadsheet,
  Printer,
  ShieldAlert,
  VolumeX,
  Timer,
  Archive,
  Trash2,
  MailPlus,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { GmailMessage } from "@/hooks/useGmailIntegration";
import { EmailQuickActions, EmailSmartSuggestions } from "@/components/gmail";
import {
  type Client,
  type EmailLabel,
  type Priority,
  PRIORITY_CONFIG,
} from "./gmail-types";

export interface EmailDetailViewProps {
  // Core data
  selectedEmail: GmailMessage;
  emailHtmlBody: string;
  loadingBody: boolean;
  emailAttachments: Array<{
    name: string;
    type: string;
    attachmentId: string;
    size: number;
  }>;
  loadingAttachments: boolean;
  downloadingAtt: string | null;

  // Metadata
  emailPriority: Record<string, Priority>;
  emailLabels: Record<string, string[]>;
  emailReminders: Record<string, string>;
  emailNotes: Record<string, string>;
  customLabels: EmailLabel[];
  mutedThreads: Set<string>;
  clients: Client[];
  user: { email?: string } | null;

  // Metadata methods
  getMetadata: (emailId: string) => any;
  setPin: (emailId: string, isPinned: boolean) => void;
  getLinkedClientId: (emailId: string) => string | null;

  // UI state
  actionLoading: string | null;

  // Handlers
  onBack: () => void;
  onOpenChatView: (email: GmailMessage) => void;
  onCompose: (data: {
    to: string;
    subject: string;
    quotedBody?: string;
    mode?: "reply" | "forward" | "replyAll";
    originalFrom?: string;
    originalDate?: string;
  }) => void;
  onMarkAsRead: (id: string, read: boolean) => Promise<any>;
  onArchive: (id: string) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onReportSpam: (id: string) => Promise<any>;
  onRefresh: () => Promise<void>;
  onSnooze: (emailId: string, until: Date) => void;
  onMuteThread: (threadId: string) => void;
  onPrint: () => void;
  onDownloadAttachment: (
    messageId: string,
    attachmentId: string,
    filename: string,
    mimeType: string,
  ) => void;
  setActionLoading: (loading: string | null) => void;
  setSelectedEmailForAction: (email: GmailMessage | null) => void;
  setIsReminderDialogOpen: (open: boolean) => void;
  setIsNoteDialogOpen: (open: boolean) => void;
  toggleEmailLabel: (emailId: string, labelId: string) => void;
  setEmailPriorityLevel: (emailId: string, priority: Priority) => void;
  buildQuotedBody: (
    email: GmailMessage | null,
    mode: "reply" | "forward" | "replyAll",
  ) => string;
  formatDate: (dateStr: string) => string;
  getClientForMessage: (message: GmailMessage) => Client | null;

  // Task/Meeting handlers
  onCreateTask: (email: GmailMessage, clientId?: string) => void;
  onCreateMeeting: (email: GmailMessage, clientId?: string) => void;
  onCreateReminder: (email: GmailMessage) => void;
  onLinkClient: (emailId: string, clientId: string | null) => Promise<void>;
}

export const EmailDetailView = memo(function EmailDetailView({
  selectedEmail,
  emailHtmlBody,
  loadingBody,
  emailAttachments,
  loadingAttachments,
  downloadingAtt,
  emailPriority,
  emailLabels,
  emailReminders,
  emailNotes,
  customLabels,
  mutedThreads,
  clients,
  user,
  getMetadata,
  setPin,
  getLinkedClientId,
  actionLoading,
  onBack,
  onOpenChatView,
  onCompose,
  onMarkAsRead,
  onArchive,
  onDelete,
  onReportSpam,
  onRefresh,
  onSnooze,
  onMuteThread,
  onPrint,
  onDownloadAttachment,
  setActionLoading,
  setSelectedEmailForAction,
  setIsReminderDialogOpen,
  setIsNoteDialogOpen,
  toggleEmailLabel,
  setEmailPriorityLevel,
  buildQuotedBody,
  formatDate,
  getClientForMessage,
  onCreateTask,
  onCreateMeeting,
  onCreateReminder,
  onLinkClient,
}: EmailDetailViewProps) {
  const handleReply = () => {
    const replySubject = selectedEmail.subject?.startsWith("Re:")
      ? selectedEmail.subject
      : `Re: ${selectedEmail.subject || ""}`;
    onCompose({
      to: selectedEmail.from,
      subject: replySubject,
      quotedBody: buildQuotedBody(selectedEmail, "reply"),
      mode: "reply",
      originalFrom: selectedEmail.from,
      originalDate: formatDate(selectedEmail.date),
    });
  };

  const handleForward = () => {
    const fwdSubject = selectedEmail.subject?.startsWith("Fwd:")
      ? selectedEmail.subject
      : `Fwd: ${selectedEmail.subject || ""}`;
    onCompose({
      to: "",
      subject: fwdSubject,
      quotedBody: buildQuotedBody(selectedEmail, "forward"),
      mode: "forward",
      originalFrom: selectedEmail.from,
      originalDate: formatDate(selectedEmail.date),
    });
  };

  const handleReplyAll = () => {
    const replySubject = selectedEmail.subject?.startsWith("Re:")
      ? selectedEmail.subject
      : `Re: ${selectedEmail.subject || ""}`;
    const allRecipients = [selectedEmail.from, ...(selectedEmail.to || [])]
      .filter((e) => e !== user?.email)
      .join(", ");
    onCompose({
      to: allRecipients,
      subject: replySubject,
      quotedBody: buildQuotedBody(selectedEmail, "replyAll"),
      mode: "replyAll",
      originalFrom: selectedEmail.from,
      originalDate: formatDate(selectedEmail.date),
    });
  };

  const metadata = getMetadata(selectedEmail.id);
  const isPinned = metadata?.is_pinned || false;
  const linkedClientId = getLinkedClientId(selectedEmail.id);
  const autoDetectedClient = getClientForMessage(selectedEmail);
  const sanitizedEmailHtml = useMemo(() => {
    if (!emailHtmlBody) return "";
    return DOMPurify.sanitize(emailHtmlBody, {
      ALLOW_UNKNOWN_PROTOCOLS: true,
    });
  }, [emailHtmlBody]);

  // Lazy-load suggestions/quick-actions after body settles to prevent layout shift
  const [showExtras, setShowExtras] = useState(false);
  useEffect(() => {
    setShowExtras(false);
    if (!loadingBody && emailHtmlBody) {
      const id = requestAnimationFrame(() => setShowExtras(true));
      return () => cancelAnimationFrame(id);
    }
  }, [selectedEmail.id, loadingBody, emailHtmlBody]);

  return (
    <div className="p-4 bg-background relative z-10" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 ml-2" />
            חזרה לרשימה
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChatView(selectedEmail)}
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
              <div className="px-2 py-1.5 text-sm font-medium">תוויות</div>
              {customLabels.map((label) => (
                <DropdownMenuCheckboxItem
                  key={label.id}
                  checked={emailLabels[selectedEmail.id]?.includes(label.id)}
                  onCheckedChange={() =>
                    toggleEmailLabel(selectedEmail.id, label.id)
                  }
                >
                  <div
                    className={cn("h-3 w-3 rounded-full ml-2", label.color)}
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
                  PRIORITY_CONFIG[emailPriority[selectedEmail.id] || "none"]
                    .icon
                }
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rtl">
              <div className="px-2 py-1.5 text-sm font-medium">עדיפות</div>
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={emailPriority[selectedEmail.id] === key}
                  onCheckedChange={() =>
                    setEmailPriorityLevel(selectedEmail.id, key as Priority)
                  }
                >
                  {config.icon}
                  <span className="mr-2">{config.label}</span>
                </DropdownMenuCheckboxItem>
              ))}
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
                    emailReminders[selectedEmail.id] ? "text-orange-500" : ""
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
                    emailNotes[selectedEmail.id] ? "text-blue-500" : ""
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
                {emailNotes[selectedEmail.id] ? "ערוך הערה" : "הוסף הערה"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Reply */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleReply}>
                  <Reply className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>השב</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Forward */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleForward}>
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
                <Button variant="ghost" size="icon" onClick={handleReplyAll}>
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
                    await onMarkAsRead(selectedEmail.id, false);
                    await onRefresh();
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
                  className={isPinned ? "text-green-500" : ""}
                  onClick={() => setPin(selectedEmail.id, !isPinned)}
                >
                  <Bookmark
                    className={cn("h-4 w-4", isPinned && "fill-green-500")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPinned ? "הסר הצמדה" : "הצמד"}</TooltipContent>
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
                    await onArchive(selectedEmail.id);
                    setActionLoading(null);
                    onBack();
                    onRefresh();
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
                    await onDelete(selectedEmail.id);
                    setActionLoading(null);
                    onBack();
                    onRefresh();
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
                    await onReportSpam(selectedEmail.id);
                    onBack();
                    onRefresh();
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
                        onSnooze(selectedEmail.id, d);
                      }}
                    >
                      בעוד שעה
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const d = new Date();
                        d.setHours(d.getHours() + 3);
                        onSnooze(selectedEmail.id, d);
                      }}
                    >
                      בעוד 3 שעות
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        d.setHours(9, 0, 0, 0);
                        onSnooze(selectedEmail.id, d);
                      }}
                    >
                      מחר בבוקר
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 7);
                        d.setHours(9, 0, 0, 0);
                        onSnooze(selectedEmail.id, d);
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
                  onClick={() => onMuteThread(selectedEmail.threadId)}
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
                <Button variant="ghost" size="icon" onClick={onPrint}>
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
            const label = customLabels.find((l) => l.id === labelId);
            return (
              label && (
                <Badge key={labelId} variant="secondary" className="gap-1">
                  <div className={cn("h-2 w-2 rounded-full", label.color)} />
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
            <span className="font-medium">{selectedEmail.fromName}</span>
            <span className="text-xs" dir="ltr">
              &lt;{selectedEmail.from}&gt;
            </span>

            {/* Client Badge */}
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

        {/* Email Quick Actions and Smart Suggestions moved below email body */}

        <Separator />

        <div
          className="prose dark:prose-invert max-w-none text-sm"
          style={{ overflowAnchor: "auto" }}
        >
          {/* Recipients info */}
          {selectedEmail.to && selectedEmail.to.length > 0 && (
            <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
              <span className="font-medium">אל:</span>
              <span dir="ltr">{selectedEmail.to.join(", ")}</span>
            </div>
          )}

          {/* Email body */}
          {loadingBody ? (
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>טוען תוכן ההודעה...</span>
              </div>
            </div>
          ) : emailHtmlBody ? (
            <div
              className="border rounded-lg p-4 bg-card overflow-x-auto text-sm"
              dir="auto"
              style={{ contain: "layout style" }}
              dangerouslySetInnerHTML={{
                __html: sanitizedEmailHtml,
              }}
            />
          ) : (
            <div className="whitespace-pre-wrap break-words leading-relaxed border rounded-lg p-4 bg-card">
              {selectedEmail.snippet}
            </div>
          )}

          {/* Attachments */}
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
                <span>קבצים מצורפים ({emailAttachments.length})</span>
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
                          onDownloadAttachment(
                            selectedEmail.id,
                            att.attachmentId,
                            att.name,
                            att.type,
                          )
                        }
                        disabled={downloadingAtt === att.attachmentId}
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

        {/* Quick Actions & Smart Suggestions - rendered after body to prevent layout shift */}
        {showExtras && (
          <>
            <Separator className="my-4" />
            <div style={{ overflowAnchor: "none" }}>
              <EmailQuickActions
                email={selectedEmail}
                clients={clients}
                linkedClientId={linkedClientId}
                autoDetectedClient={autoDetectedClient}
                onCreateTask={onCreateTask}
                onCreateMeeting={onCreateMeeting}
                onCreateReminder={onCreateReminder}
                onLinkClient={onLinkClient}
              />
            </div>
            <div style={{ overflowAnchor: "none" }}>
              <EmailSmartSuggestions
                email={selectedEmail}
                clients={clients}
                onCreateTask={onCreateTask}
                onCreateMeeting={onCreateMeeting}
                onLinkClient={onLinkClient}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
});
