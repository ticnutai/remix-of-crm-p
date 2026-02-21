/**
 * ChatMessenger - מערכת שיחות ווידוא מלאה
 * Real-time messaging - internal + client chats
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat, ChatConversation, ChatMessage } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Check,
  CheckCheck,
  Circle,
  X,
  Phone,
  Video,
  Pin,
  Archive,
  Edit3,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// -----------------------------------------------------------
// Emoji Picker (Inline simple version)
// -----------------------------------------------------------
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '✅'];

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-10 left-0 bg-background border rounded-xl shadow-lg p-2 z-50 flex gap-1">
      {QUICK_EMOJIS.map(emoji => (
        <button
          key={emoji}
          onClick={() => { onSelect(emoji); onClose(); }}
          className="text-xl hover:scale-125 transition-transform p-1 rounded"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
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
}: {
  msg: ChatMessage;
  isOwn: boolean;
  onReply: (m: ChatMessage) => void;
  onReact: (id: string, emoji: string) => void;
  onDelete: (id: string) => void;
  showName: boolean;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [hovered, setHovered] = useState(false);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return `אתמול ${format(d, 'HH:mm')}`;
    return format(d, 'dd/MM HH:mm');
  };

  const totalReactions = Object.entries(msg.reactions || {}).map(([emoji, users]) => ({
    emoji,
    count: (users as string[]).length,
  }));

  return (
    <div
      className={cn('flex gap-2 group mb-1', isOwn ? 'flex-row-reverse' : 'flex-row')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowEmoji(false); }}
    >
      {/* Avatar */}
      {!isOwn && (
        <Avatar className="h-7 w-7 mt-1 shrink-0">
          {msg.sender_avatar && <AvatarImage src={msg.sender_avatar} />}
          <AvatarFallback className="text-xs bg-primary/10">
            {(msg.sender_name || 'U').slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn('flex flex-col max-w-[70%]', isOwn && 'items-end')}>
        {showName && !isOwn && (
          <span className="text-xs text-muted-foreground mb-0.5 mr-1">
            {msg.sender_name}
          </span>
        )}

        {/* Reply preview */}
        {msg.reply_to && (
          <div className="text-xs bg-muted/50 rounded px-2 py-1 mb-1 border-r-2 border-primary text-muted-foreground">
            {(msg.reply_to as any)?.content?.slice(0, 60)}...
          </div>
        )}

        {/* Bubble */}
        <div className="relative">
          <div
            className={cn(
              'px-3 py-2 rounded-2xl text-sm leading-relaxed break-words',
              isOwn
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted rounded-bl-sm'
            )}
          >
            {/* File message */}
            {msg.message_type === 'file' && msg.file_url && (
              <a
                href={msg.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm underline mb-1"
              >
                <Paperclip className="h-3 w-3" />
                {msg.file_name || 'קובץ'}
              </a>
            )}

            {/* Image message */}
            {msg.message_type === 'image' && msg.file_url && (
              <img
                src={msg.file_url}
                alt="תמונה"
                className="rounded-lg max-w-[200px] mb-1 cursor-pointer"
                onClick={() => window.open(msg.file_url!, '_blank')}
              />
            )}

            {msg.content}

            {msg.is_edited && (
              <span className="text-[10px] opacity-60 mr-1">(נערך)</span>
            )}
          </div>

          {/* Action buttons on hover */}
          {hovered && (
            <div
              className={cn(
                'absolute top-0 flex gap-0.5 bg-background border rounded-lg shadow-md p-0.5',
                isOwn ? 'right-full mr-1' : 'left-full ml-1'
              )}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onReply(msg)}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                    >
                      <Reply className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>השב</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <button
                        onClick={() => setShowEmoji(s => !s)}
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
                  <TooltipContent>תגובה</TooltipContent>
                </Tooltip>
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
                    <TooltipContent>מחק</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Reactions */}
        {totalReactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {totalReactions.map(({ emoji, count }) => (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                className="text-xs bg-muted border rounded-full px-1.5 py-0.5 hover:bg-muted/80"
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}

        {/* Time */}
        <span className="text-[10px] text-muted-foreground mt-0.5 mx-1">
          {formatTime(msg.created_at)}
        </span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// Date divider
// -----------------------------------------------------------
function DateDivider({ date }: { date: string }) {
  const d = new Date(date);
  let label = format(d, 'dd MMMM yyyy', { locale: he });
  if (isToday(d)) label = 'היום';
  else if (isYesterday(d)) label = 'אתמול';

  return (
    <div className="flex items-center gap-2 my-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground bg-background px-2">{label}</span>
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
  const [type, setType] = useState<'internal' | 'client' | 'group'>('internal');
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    // Fetch clients and employees
    Promise.all([
      supabase.from('clients').select('id, name').order('name').limit(100),
      supabase.from('profiles').select('id, full_name, email').order('full_name').limit(100),
    ]).then(([cRes, eRes]) => {
      setClients(cRes.data || []);
      setEmployees(eRes.data || []);
    });
  }, [open]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const conv = await createConversation(type, {
        title: title || undefined,
        participantIds: selectedUsers,
        clientId: type === 'client' ? clientId : undefined,
      });
      if (conv) {
        toast({ title: 'שיחה נוצרה בהצלחה!' });
        onCreated(conv as ChatConversation);
        onOpenChange(false);
        setTitle(''); setClientId(''); setSelectedUsers([]);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            שיחה חדשה
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>סוג שיחה</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'internal', icon: Users, label: 'פנימי' },
                { key: 'client', icon: Building2, label: 'לקוח' },
                { key: 'group', icon: MessageCircle, label: 'קבוצה' },
              ] as const).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm',
                    type === key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted hover:border-muted-foreground/30'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>שם השיחה (אופציונלי)</Label>
            <Input
              placeholder={type === 'client' ? 'שיחה עם לקוח...' : 'שם הקבוצה...'}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {type === 'client' && (
            <div className="space-y-1">
              <Label>בחר לקוח</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="חפש לקוח..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(type === 'internal' || type === 'group') && (
            <div className="space-y-1">
              <Label>הוסף משתתפים</Label>
              <ScrollArea className="h-36 border rounded-lg p-2">
                <div className="space-y-1">
                  {employees.map(e => (
                    <label key={e.id} className="flex items-center gap-2 p-1.5 hover:bg-muted rounded cursor-pointer">
                      <Checkbox
                        checked={selectedUsers.includes(e.id)}
                        onCheckedChange={(v) => {
                          setSelectedUsers(prev =>
                            v ? [...prev, e.id] : prev.filter(x => x !== e.id)
                          );
                        }}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {e.full_name?.slice(0, 2) || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{e.full_name}</div>
                        <div className="text-xs text-muted-foreground">{e.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
              {selectedUsers.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedUsers.length} נבחרו</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button
            onClick={handleCreate}
            disabled={creating || (type === 'internal' && selectedUsers.length === 0)}
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Plus className="h-4 w-4 ml-1" />}
            צור שיחה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -----------------------------------------------------------
// Main ChatMessenger Component
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
  } = useChat();

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Responsive
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile || !activeConversation);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [activeConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Group messages by date for dividers
  const groupedMessages = messages.reduce<{ date: string; msgs: ChatMessage[] }[]>((acc, msg) => {
    const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
    const last = acc[acc.length - 1];
    if (!last || last.date !== date) {
      acc.push({ date, msgs: [msg] });
    } else {
      last.msgs.push(msg);
    }
    return acc;
  }, []);

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      c.title?.toLowerCase().includes(q) ||
      c.client_name?.toLowerCase().includes(q) ||
      c.last_message?.toLowerCase().includes(q)
    );
  });

  // Send handler
  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    setReplyTo(null);
    await sendMessage(text, replyTo ? { replyToId: replyTo.id } : undefined);
  };

  // File upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    const isImage = file.type.startsWith('image/');
    const path = `chat/${activeConversation.id}/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file);

    if (error) {
      toast({ title: 'שגיאה בהעלאת קובץ', variant: 'destructive' });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);

    await sendMessage(file.name, {
      messageType: isImage ? 'image' : 'file',
      fileUrl: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  };

  // Conversation item
  const ConvItem = ({ conv }: { conv: ChatConversation }) => {
    const isActive = activeConversation?.id === conv.id;
    const TypeIcon = conv.type === 'client' ? Building2 : conv.type === 'group' ? Users : MessageCircle;

    const title = conv.title || conv.client_name ||
      (conv.type === 'internal' ? 'שיחה פנימית' : 'שיחה');

    const lastMsgTime = conv.last_message_at
      ? formatDistanceToNow(new Date(conv.last_message_at), { locale: he, addSuffix: true })
      : '';

    return (
      <button
        onClick={() => {
          selectConversation(conv);
          if (isMobile) setShowSidebar(false);
        }}
        className={cn(
          'w-full flex items-start gap-3 p-3 rounded-xl text-right transition-all hover:bg-muted/50',
          isActive && 'bg-primary/10 border border-primary/20'
        )}
      >
        <div className={cn(
          'shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
          conv.type === 'client' ? 'bg-blue-100 text-blue-600' :
          conv.type === 'group' ? 'bg-purple-100 text-purple-600' :
          'bg-green-100 text-green-600'
        )}>
          <TypeIcon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className={cn('font-medium text-sm truncate', isActive && 'text-primary')}>
              {title}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0 mr-1">{lastMsgTime}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground truncate">
              {conv.last_message || 'אין הודעות'}
            </p>
            {(conv.unread_count || 0) > 0 && (
              <Badge className="bg-primary text-primary-foreground text-[10px] h-4 min-w-4 shrink-0 rounded-full">
                {conv.unread_count}
              </Badge>
            )}
          </div>
        </div>
      </button>
    );
  };

  // -----------------------------------------------------------
  // Main render
  // -----------------------------------------------------------
  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] bg-background border rounded-2xl overflow-hidden" dir="rtl">

      {/* ====== SIDEBAR ====== */}
      {(showSidebar || !isMobile) && (
        <div className="w-full md:w-72 lg:w-80 flex flex-col border-l bg-muted/20 shrink-0">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                שיחות
                {totalUnread > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-xs rounded-full">
                    {totalUnread}
                  </Badge>
                )}
              </h2>
              <Button
                size="sm"
                onClick={() => setNewConvOpen(true)}
                className="h-8 gap-1 rounded-xl"
              >
                <Plus className="h-4 w-4" />
                חדש
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute right-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חפש שיחה..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-8 h-8 bg-background text-sm rounded-xl"
              />
            </div>
          </div>

          {/* Conversations list */}
          <ScrollArea className="flex-1 p-2">
            {loading && conversations.length === 0 && (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && filteredConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
                <MessageCircle className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">אין שיחות עדיין</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewConvOpen(true)}
                  className="rounded-xl"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  התחל שיחה
                </Button>
              </div>
            )}

            <div className="space-y-0.5">
              {filteredConversations.map(conv => (
                <ConvItem key={conv.id} conv={conv} />
              ))}
            </div>
          </ScrollArea>

          {/* User status */}
          <div className="p-3 border-t bg-background/50">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-primary/20">
                    {profile?.full_name?.slice(0, 2) || 'אנ'}
                  </AvatarFallback>
                </Avatar>
                <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 absolute -bottom-0.5 -right-0.5" />
              </div>
              <div className="text-xs">
                <div className="font-medium">{profile?.full_name}</div>
                <div className="text-muted-foreground">מחובר</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== CHAT AREA ====== */}
      {(!isMobile || !showSidebar) && (
        <div className="flex-1 flex flex-col min-w-0">
          {!activeConversation ? (
            // Empty state
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-12 w-12 text-primary/50" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">ברוכים הבאים למרכז השיחות</h3>
                <p className="text-muted-foreground text-sm">
                  בחר שיחה מהרשימה או פתח שיחה חדשה
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setNewConvOpen(true)} className="gap-2 rounded-xl">
                  <Users className="h-4 w-4" />
                  שיחה פנימית
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setNewConvOpen(true); }}
                  className="gap-2 rounded-xl"
                >
                  <Building2 className="h-4 w-4" />
                  שיחה עם לקוח
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowSidebar(true)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <div className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center',
                    activeConversation.type === 'client' ? 'bg-blue-100 text-blue-600' :
                    activeConversation.type === 'group' ? 'bg-purple-100 text-purple-600' :
                    'bg-green-100 text-green-600'
                  )}>
                    {activeConversation.type === 'client' ? <Building2 className="h-5 w-5" /> :
                     activeConversation.type === 'group' ? <Users className="h-5 w-5" /> :
                     <MessageCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {activeConversation.title || activeConversation.client_name || 'שיחה פנימית'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {activeConversation.type === 'client' && 'שיחה עם לקוח'}
                      {activeConversation.type === 'group' && 'קבוצה'}
                      {activeConversation.type === 'internal' && 'שיחה פנימית'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <TooltipProvider>
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
                      <TooltipContent>וידאו שיחה</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Pin className="h-4 w-4 ml-2" />
                        הצמד שיחה
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 ml-2" />
                        העבר לארכיון
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit3 className="h-4 w-4 ml-2" />
                        ערוך שם
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages area */}
              <ScrollArea className="flex-1 px-4 py-2">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">אין הודעות עדיין. שלח את ההודעה הראשונה!</p>
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
                            showName={i === 0 || msgs[i - 1]?.sender_id !== msg.sender_id}
                          />
                        ))}
                      </div>
                    ))}
                  </>
                )}
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Reply preview */}
              {replyTo && (
                <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-2">
                  <Reply className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-primary">{replyTo.sender_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{replyTo.content}</div>
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

              {/* Input area */}
              <div className="p-3 border-t bg-background">
                <div className="flex items-end gap-2 bg-muted/40 rounded-2xl p-2 border">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-full"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>צרף קובץ</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Textarea
                    ref={inputRef}
                    placeholder="כתוב הודעה..."
                    value={input}
                    onChange={e => {
                      setInput(e.target.value);
                      sendTyping();
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    className="flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 min-h-[36px] max-h-[120px] overflow-y-auto py-1.5 text-sm"
                    style={{ fieldSizing: 'content' } as any}
                  />

                  <Button
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full"
                    onClick={handleSend}
                    disabled={!input.trim() || sendingMessage}
                  >
                    {sendingMessage
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  Enter לשליחה • Shift+Enter לשורה חדשה
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={newConvOpen}
        onOpenChange={setNewConvOpen}
        onCreated={(conv) => selectConversation(conv)}
      />
    </div>
  );
}
