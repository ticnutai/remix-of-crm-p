// Email Thread Chat View - Display email conversations like a chat
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  ArrowRight, 
  User, 
  Clock, 
  Paperclip,
  Loader2,
  ChevronDown,
  Star,
  MoreVertical,
  Reply,
  Forward,
  Trash2,
  Archive,
  MessageSquare
} from 'lucide-react';
import { GmailMessage } from '@/hooks/useGmailIntegration';
import { format, isToday, isYesterday } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  onSendReply: (message: string) => Promise<boolean>;
  onArchive?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onToggleStar?: (messageId: string, isStarred: boolean) => void;
}

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
}: EmailThreadChatProps) => {
  const [replyText, setReplyText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        return format(date, 'HH:mm', { locale: he });
      }
      if (isYesterday(date)) {
        return 'אתמול ' + format(date, 'HH:mm', { locale: he });
      }
      return format(date, 'dd/MM HH:mm', { locale: he });
    } catch {
      return dateStr;
    }
  };

  // Check if message is from current user
  const isOwnMessage = (msg: ThreadMessage) => {
    return msg.from.toLowerCase() === currentUserEmail.toLowerCase() || msg.isSent;
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Handle send reply
  const handleSendReply = async () => {
    if (!replyText.trim() || isSending) return;
    
    const success = await onSendReply(replyText);
    if (success) {
      setReplyText('');
      textareaRef.current?.focus();
    }
  };

  // Handle key press (Ctrl+Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: ThreadMessage[] }[] = [];
    let currentDate = '';

    messages.forEach(msg => {
      const msgDate = format(new Date(msg.date), 'yyyy-MM-dd');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  }, [messages]);

  // Format date header
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'היום';
    if (isYesterday(date)) return 'אתמול';
    return format(date, 'EEEE, dd בMMMM', { locale: he });
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{subject || '(ללא נושא)'}</h2>
          <p className="text-sm text-muted-foreground">
            {messages.length} הודעות בשרשור
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <MessageSquare className="h-3 w-3" />
          תצוגת צ'אט
        </Badge>
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
                        className={cn(
                          'flex gap-3 max-w-[85%]',
                          isOwn ? 'mr-auto flex-row-reverse' : 'ml-auto'
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
                        <div className="flex-1 min-w-0">
                          {/* Sender Name (only for received messages) */}
                          {!isOwn && (
                            <p className="text-xs text-muted-foreground mb-1 mr-1">
                              {msg.fromName}
                            </p>
                          )}

                          <div
                            className={cn(
                              'rounded-2xl px-4 py-3 relative group',
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-tl-sm'
                                : 'bg-muted rounded-tr-sm'
                            )}
                          >
                            {/* Message Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    'absolute top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
                                    isOwn ? 'left-1' : 'right-1'
                                  )}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isOwn ? 'start' : 'end'}>
                                {onToggleStar && (
                                  <DropdownMenuItem onClick={() => onToggleStar(msg.id, msg.isStarred)}>
                                    <Star className={cn('h-4 w-4 ml-2', msg.isStarred && 'fill-yellow-500 text-yellow-500')} />
                                    {msg.isStarred ? 'הסר כוכב' : 'הוסף כוכב'}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Forward className="h-4 w-4 ml-2" />
                                  העבר
                                </DropdownMenuItem>
                                {onArchive && (
                                  <DropdownMenuItem onClick={() => onArchive(msg.id)}>
                                    <Archive className="h-4 w-4 ml-2" />
                                    ארכיון
                                  </DropdownMenuItem>
                                )}
                                {onDelete && (
                                  <DropdownMenuItem onClick={() => onDelete(msg.id)} className="text-red-600">
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
                            <p className={cn(
                              'text-sm whitespace-pre-wrap break-words',
                              isOwn ? 'text-primary-foreground' : 'text-foreground'
                            )}>
                              {msg.body || msg.snippet}
                            </p>

                            {/* Time */}
                            <p className={cn(
                              'text-[10px] mt-2 text-left',
                              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}>
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

      {/* Reply Input */}
      <div className="p-4 border-t bg-background/95 backdrop-blur">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="כתוב תשובה..."
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
            onClick={handleSendReply}
            disabled={!replyText.trim() || isSending}
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
