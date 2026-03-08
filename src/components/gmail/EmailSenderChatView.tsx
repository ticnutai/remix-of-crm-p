// EmailSenderChatView - Chat view showing ALL emails with a specific sender
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import DOMPurify from "dompurify";
import {
  ArrowRight,
  Loader2,
  Search,
  X,
  MessageSquare,
  Reply,
  ReplyAll,
  Forward,
  Mail,
  ChevronDown,
  MoreVertical,
  Bookmark,
  Bell,
  Trash2,
  Archive,
  MailPlus,
} from "lucide-react";
import { GmailMessage } from "@/hooks/useGmailIntegration";
import { format, isToday, isYesterday } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Decode HTML entities and clean up messy email snippets
function cleanSnippet(raw: string): string {
  if (!raw) return "";
  // 1. Decode HTML entities
  let text = raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // 2. Remove raw email addresses in angle brackets: <user@domain.com>
  text = text.replace(/<[^@\s>]+@[^>\s]+>/g, "");

  // 3. Remove forwarded/reply header lines (From:, Sent:, To:, Date:, Cc:, Subject:)
  text = text.replace(
    /\b(From|Sent|To|Date|Cc|Subject|מאת|אל|נשלח|תאריך|נושא|עותק)\s*:\s*[^\n]*/gi,
    "",
  );

  // 4. Remove "---------- Forwarded message ----------" style lines
  text = text.replace(
    /-{3,}\s*(Forwarded message|הודעה שהועברה|Original Message|הודעה מקורית)\s*-{3,}/gi,
    "",
  );

  // 5. Clean up multiple spaces and newlines
  text = text.replace(/\s{2,}/g, " ").trim();

  return text;
}

interface EmailSenderChatViewProps {
  senderEmail: string;
  senderName: string;
  currentUserEmail: string;
  // Functions from the Gmail hook
  fetchEmailsForSender: (
    senderEmail: string,
    pageToken?: string,
  ) => Promise<{ messages: GmailMessage[]; nextPageToken: string | null }>;
  getFullMessage: (messageId: string) => Promise<any>;
  extractHtmlBody: (payload: any) => string;
  resolveInlineImages: (
    html: string,
    messageId: string,
    payload: any,
  ) => Promise<string>;
  onBack: () => void;
  onReply: (message: GmailMessage) => void;
  onReplyAll?: (message: GmailMessage) => void;
  onForward: (message: GmailMessage) => void;
  onCompose: (to: string) => void;
  onArchive?: (messageId: string) => Promise<any>;
  onDelete?: (messageId: string) => Promise<any>;
  onToggleStar?: (messageId: string, isStarred: boolean) => Promise<any>;
  onMarkUnread?: (messageId: string) => Promise<any>;
  onSetReminder?: (message: GmailMessage) => void;
}

interface ChatMessage extends GmailMessage {
  htmlBody?: string;
  bodyLoading?: boolean;
  bodyLoaded?: boolean;
}

export function EmailSenderChatView({
  senderEmail,
  senderName,
  currentUserEmail,
  fetchEmailsForSender,
  getFullMessage,
  extractHtmlBody,
  resolveInlineImages,
  onBack,
  onReply,
  onReplyAll,
  onForward,
  onCompose,
  onArchive,
  onDelete,
  onToggleStar,
  onMarkUnread,
  onSetReminder,
}: EmailSenderChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set(),
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Load initial emails
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await fetchEmailsForSender(senderEmail);
        if (cancelled) return;
        // Sort oldest first (chat order)
        const sorted = [...result.messages].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        setMessages(sorted);
        setNextPageToken(result.nextPageToken);
      } catch (e) {
        console.error("Error loading sender emails:", e);
      }
      if (!cancelled) setIsLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [senderEmail, fetchEmailsForSender]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [isLoading, messages.length > 0]);

  // Lazy load more (scroll up to load older messages)
  const loadMore = useCallback(async () => {
    if (!nextPageToken || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const result = await fetchEmailsForSender(senderEmail, nextPageToken);
      const sorted = [...result.messages].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setMessages((prev) => {
        // Deduplicate by id
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = sorted.filter((m) => !existingIds.has(m.id));
        return [...newMsgs, ...prev];
      });
      setNextPageToken(result.nextPageToken);
    } catch (e) {
      console.error("Error loading more emails:", e);
    }
    setIsLoadingMore(false);
  }, [nextPageToken, isLoadingMore, senderEmail, fetchEmailsForSender]);

  // Intersection observer for lazy loading (scroll to top)
  useEffect(() => {
    if (!loadMoreTriggerRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextPageToken && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );
    observerRef.current.observe(loadMoreTriggerRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMore, nextPageToken, isLoadingMore]);

  // Load HTML body for a specific message (lazy - on expand)
  const loadMessageBody = useCallback(
    async (messageId: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, bodyLoading: true } : m)),
      );
      try {
        const fullMsg = await getFullMessage(messageId);
        if (fullMsg?.payload) {
          const rawHtml = extractHtmlBody(fullMsg.payload);
          const html = await resolveInlineImages(
            rawHtml,
            messageId,
            fullMsg.payload,
          );
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, htmlBody: html, bodyLoading: false, bodyLoaded: true }
                : m,
            ),
          );
        }
      } catch (e) {
        console.error("Error loading message body:", e);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, bodyLoading: false } : m,
          ),
        );
      }
    },
    [getFullMessage, extractHtmlBody, resolveInlineImages],
  );

  // Toggle expand message body
  const toggleExpand = useCallback(
    (messageId: string) => {
      setExpandedMessages((prev) => {
        const next = new Set(prev);
        if (next.has(messageId)) {
          next.delete(messageId);
        } else {
          next.add(messageId);
          // Load body if not loaded
          const msg = messages.find((m) => m.id === messageId);
          if (msg && !msg.bodyLoaded && !msg.bodyLoading) {
            loadMessageBody(messageId);
          }
        }
        return next;
      });
    },
    [messages, loadMessageBody],
  );

  // Check if message is sent by current user
  const isOwnMessage = (msg: GmailMessage) => {
    const from = msg.from.toLowerCase();
    const userEmail = currentUserEmail.toLowerCase();
    return from === userEmail || from.includes(userEmail);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Format date for display
  const formatMsgDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "HH:mm", { locale: he });
    } catch {
      return dateStr;
    }
  };

  const formatDateHeader = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isToday(date)) return "היום";
      if (isYesterday(date)) return "אתמול";
      return format(date, "EEEE, dd בMMMM yyyy", { locale: he });
    } catch {
      return dateStr;
    }
  };

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const filtered = searchQuery
      ? messages.filter(
          (m) =>
            m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.snippet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.fromName?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : messages;

    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";

    filtered.forEach((msg) => {
      try {
        const msgDate = format(new Date(msg.date), "yyyy-MM-dd");
        if (msgDate !== currentDate) {
          currentDate = msgDate;
          groups.push({ date: msg.date, messages: [msg] });
        } else {
          groups[groups.length - 1].messages.push(msg);
        }
      } catch {
        if (groups.length === 0) {
          groups.push({ date: msg.date, messages: [msg] });
        } else {
          groups[groups.length - 1].messages.push(msg);
        }
      }
    });

    return groups;
  }, [messages, searchQuery]);

  const latestMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;

  const updateMessage = (
    messageId: string,
    updater: (msg: ChatMessage) => ChatMessage,
  ) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? updater(msg) : msg)),
    );
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex flex-col border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4 pb-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(senderName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{senderName}</h2>
            <p className="text-xs text-muted-foreground truncate">
              {senderEmail} • {messages.length} הודעות
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCompose(senderEmail)}
          >
            <Mail className="h-4 w-4 ml-1" />
            כתוב הודעה
          </Button>
          <Badge variant="secondary" className="gap-1">
            <MessageSquare className="h-3 w-3" />
            צ'אט לפי שולח
          </Badge>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-1 rounded-xl border bg-background px-2 py-1 w-fit">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              title="חזרה לכל המיילים"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="פעולות נוספות">
              <MoreVertical className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="כוכב"
              disabled={!latestMessage || !onToggleStar}
              onClick={async () => {
                if (!latestMessage || !onToggleStar) return;
                await onToggleStar(latestMessage.id, latestMessage.isStarred);
                updateMessage(latestMessage.id, (msg) => ({
                  ...msg,
                  isStarred: !msg.isStarred,
                }));
              }}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="סמן כלא נקרא"
              disabled={!latestMessage || !onMarkUnread}
              onClick={async () => {
                if (!latestMessage || !onMarkUnread) return;
                await onMarkUnread(latestMessage.id);
                updateMessage(latestMessage.id, (msg) => ({
                  ...msg,
                  isRead: false,
                }));
              }}
            >
              <MailPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="תזכורת"
              disabled={!latestMessage || !onSetReminder}
              onClick={() => latestMessage && onSetReminder?.(latestMessage)}
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500"
              title="מחק"
              disabled={!latestMessage || !onDelete}
              onClick={async () => {
                if (!latestMessage || !onDelete) return;
                await onDelete(latestMessage.id);
                setMessages((prev) =>
                  prev.filter((msg) => msg.id !== latestMessage.id),
                );
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="ארכיון"
              disabled={!latestMessage || !onArchive}
              onClick={async () => {
                if (!latestMessage || !onArchive) return;
                await onArchive(latestMessage.id);
                setMessages((prev) =>
                  prev.filter((msg) => msg.id !== latestMessage.id),
                );
              }}
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="השב"
              disabled={!latestMessage}
              onClick={() => latestMessage && onReply(latestMessage)}
            >
              <Reply className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="השב לכולם"
              disabled={!latestMessage}
              onClick={() =>
                latestMessage &&
                (onReplyAll
                  ? onReplyAll(latestMessage)
                  : onReply(latestMessage))
              }
            >
              <ReplyAll className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="העבר"
              disabled={!latestMessage}
              onClick={() => latestMessage && onForward(latestMessage)}
            >
              <Forward className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש בהתכתבות..."
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

      {/* Chat Messages Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {/* Load More Trigger (scroll up for older messages) */}
          {nextPageToken && (
            <div ref={loadMoreTriggerRef} className="flex justify-center py-2">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  טוען הודעות ישנות...
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  className="text-xs text-muted-foreground"
                >
                  <ChevronDown className="h-3 w-3 rotate-180 ml-1" />
                  טען הודעות ישנות יותר
                </Button>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                טוען התכתבות עם {senderName}...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Mail className="h-12 w-12" />
              <p>אין הודעות עם {senderName}</p>
            </div>
          ) : (
            groupedMessages.map((group, groupIdx) => (
              <div key={groupIdx}>
                {/* Date Separator */}
                <div className="flex items-center gap-3 my-4">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full whitespace-nowrap">
                    {formatDateHeader(group.date)}
                  </span>
                  <Separator className="flex-1" />
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {group.messages.map((msg) => {
                    const isOwn = isOwnMessage(msg);
                    const isExpanded = expandedMessages.has(msg.id);

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-2 max-w-[85%]",
                          isOwn ? "mr-auto flex-row-reverse" : "ml-auto",
                        )}
                      >
                        {/* Avatar - only for received */}
                        {!isOwn && (
                          <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(msg.fromName)}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        {/* Message Bubble */}
                        <div className="flex-1 min-w-0">
                          {/* Subject line */}
                          {msg.subject && (
                            <p
                              className={cn(
                                "text-[10px] text-muted-foreground mb-0.5 px-1",
                                isOwn ? "text-left" : "text-right",
                              )}
                            >
                              {msg.subject}
                            </p>
                          )}

                          <div
                            className={cn(
                              "rounded-2xl px-4 py-3 cursor-pointer transition-colors",
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-bl-sm hover:bg-primary/90"
                                : "bg-muted rounded-br-sm hover:bg-muted/80",
                            )}
                            onClick={() => toggleExpand(msg.id)}
                          >
                            {/* Snippet (always shown) */}
                            {!isExpanded && (
                              <p
                                className={cn(
                                  "text-sm leading-relaxed",
                                  isOwn
                                    ? "text-primary-foreground"
                                    : "text-foreground",
                                )}
                              >
                                {cleanSnippet(msg.snippet)}
                              </p>
                            )}

                            {/* Full body (expanded) */}
                            {isExpanded && (
                              <div>
                                {msg.bodyLoading ? (
                                  <div className="flex items-center gap-2 py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-xs">
                                      טוען תוכן...
                                    </span>
                                  </div>
                                ) : msg.htmlBody ? (
                                  <div
                                    className={cn(
                                      "prose prose-sm max-w-none text-sm",
                                      isOwn
                                        ? "prose-invert"
                                        : "dark:prose-invert",
                                    )}
                                    dangerouslySetInnerHTML={{
                                      __html: DOMPurify.sanitize(msg.htmlBody, {
                                        ALLOW_UNKNOWN_PROTOCOLS: true,
                                      }),
                                    }}
                                  />
                                ) : (
                                  <p
                                    className={cn(
                                      "text-sm leading-relaxed whitespace-pre-wrap",
                                      isOwn
                                        ? "text-primary-foreground"
                                        : "text-foreground",
                                    )}
                                  >
                                    {cleanSnippet(msg.snippet)}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Time + Actions */}
                            <div
                              className={cn(
                                "flex items-center gap-2 mt-2 pt-1.5 border-t",
                                isOwn
                                  ? "border-primary-foreground/20"
                                  : "border-border/50",
                              )}
                            >
                              <span
                                className={cn(
                                  "text-[10px]",
                                  isOwn
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground",
                                )}
                              >
                                {formatMsgDate(msg.date)}
                              </span>

                              {isExpanded && (
                                <div className="flex items-center gap-1 ms-auto">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-6 w-6",
                                      isOwn &&
                                        "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10",
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onReply(msg);
                                    }}
                                  >
                                    <Reply className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-6 w-6",
                                      isOwn &&
                                        "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10",
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onForward(msg);
                                    }}
                                  >
                                    <Forward className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}

                              {!isExpanded && (
                                <span
                                  className={cn(
                                    "text-[10px] ms-auto",
                                    isOwn
                                      ? "text-primary-foreground/50"
                                      : "text-muted-foreground/50",
                                  )}
                                >
                                  לחץ להרחבה ▾
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Bottom anchor for auto-scroll */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
