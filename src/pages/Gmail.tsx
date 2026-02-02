// Gmail Page - Email management with Google Gmail integration
import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  MessageSquare
} from 'lucide-react';
import { useGmailIntegration, GmailMessage } from '@/hooks/useGmailIntegration';
import { useGoogleServices } from '@/hooks/useGoogleServices';
import { useEmailActions } from '@/hooks/useEmailActions';
import { format, isToday, isYesterday, isThisWeek, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEmailMetadata } from '@/hooks/useEmailMetadata';
import { useTasksOptimized as useTasks } from '@/hooks/useTasksOptimized';
import { useMeetingsOptimized as useMeetings } from '@/hooks/useMeetingsOptimized';
import { QuickAddTask } from '@/components/layout/sidebar-tasks/QuickAddTask';
import { QuickAddMeeting } from '@/components/layout/sidebar-tasks/QuickAddMeeting';
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
  useScrollDateTracker
} from '@/components/gmail';

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
  { id: 'client', name: 'לקוח', color: 'bg-blue-500' },
  { id: 'project', name: 'פרויקט', color: 'bg-green-500' },
  { id: 'urgent', name: 'דחוף', color: 'bg-red-500' },
  { id: 'followup', name: 'מעקב', color: 'bg-orange-500' },
  { id: 'invoice', name: 'חשבונית', color: 'bg-purple-500' },
  { id: 'meeting', name: 'פגישה', color: 'bg-pink-500' },
  { id: 'task', name: 'משימה', color: 'bg-yellow-500' },
  { id: 'info', name: 'מידע', color: 'bg-gray-500' },
];

// Priority levels
type Priority = 'high' | 'medium' | 'low' | 'none';

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: React.ReactNode }> = {
  high: { label: 'גבוהה', color: 'text-red-600', icon: <Flag className="h-4 w-4 text-red-500 fill-red-500" /> },
  medium: { label: 'בינונית', color: 'text-orange-600', icon: <Flag className="h-4 w-4 text-orange-500 fill-orange-500" /> },
  low: { label: 'נמוכה', color: 'text-blue-600', icon: <Flag className="h-4 w-4 text-blue-500" /> },
  none: { label: 'ללא', color: 'text-gray-400', icon: <Flag className="h-4 w-4 text-gray-300" /> },
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
    isSending 
  } = useGmailIntegration();
  const { isConnected } = useGoogleServices();
  const { user } = useAuth();
  const { createTask: createTaskOriginal } = useTasks();
  const { createMeeting: createMeetingOriginal } = useMeetings();
  const emailMetadata = useEmailMetadata();
  const { archiveEmail, deleteEmail, toggleStar, markAsRead } = useEmailActions();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
  
  // Date navigation state
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const { currentDate: scrollCurrentDate, isScrolling } = useScrollDateTracker(
    scrollContainerRef as React.RefObject<HTMLElement>,
    messages,
    hasLoaded && !selectedEmail
  );
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  
  // Chat view state
  const [viewMode, setViewMode] = useState<'list' | 'chat'>('list');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<GmailMessage[]>([]);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  
  // Client emails dialog
  const [isClientEmailsDialogOpen, setIsClientEmailsDialogOpen] = useState(false);
  
  // Task/Meeting dialogs
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);
  const [taskInitialData, setTaskInitialData] = useState<any>(null);
  const [meetingInitialData, setMeetingInitialData] = useState<any>(null);
  
  // Wrapper functions for QuickAddTask/QuickAddMeeting (they expect Promise<void>)
  const handleCreateTask = async (task: Parameters<typeof createTaskOriginal>[0]): Promise<void> => {
    await createTaskOriginal(task);
  };
  
  const handleCreateMeeting = async (meeting: Parameters<typeof createMeetingOriginal>[0]): Promise<void> => {
    await createMeetingOriginal(meeting);
  };
  
  // New Enhanced Features State
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [emailLabels, setEmailLabels] = useState<Record<string, string[]>>({});
  const [emailPriority, setEmailPriority] = useState<Record<string, Priority>>({});
  const [emailReminders, setEmailReminders] = useState<Record<string, Date>>({});
  const [emailNotes, setEmailNotes] = useState<Record<string, string>>({});
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [customLabels, setCustomLabels] = useState<EmailLabel[]>(DEFAULT_LABELS);
  const [filterByLabel, setFilterByLabel] = useState<string | null>(null);
  const [filterByPriority, setFilterByPriority] = useState<Priority | null>(null);
  const [filterByClient, setFilterByClient] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'sender'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [displayDensity, setDisplayDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [showPreview, setShowPreview] = useState(true);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedEmailForAction, setSelectedEmailForAction] = useState<GmailMessage | null>(null);
  
  // Client auto-tagging state
  const [clients, setClients] = useState<Client[]>([]);
  const [clientEmailMap, setClientEmailMap] = useState<Map<string, Client>>(new Map());
  const [autoTagEnabled, setAutoTagEnabled] = useState(true);
  
  // Load clients for auto-tagging
  useEffect(() => {
    const loadClients = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, email, phone')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        if (data) {
          setClients(data);
          // Create email -> client map for quick lookup
          const emailMap = new Map<string, Client>();
          data.forEach(client => {
            if (client.email) {
              // Handle multiple emails (comma separated or semicolon)
              const emails = client.email.split(/[,;]/).map(e => e.trim().toLowerCase());
              emails.forEach(email => {
                if (email) {
                  emailMap.set(email, client);
                }
              });
            }
          });
          setClientEmailMap(emailMap);
          
          // Add client-based labels dynamically
          const clientLabels: EmailLabel[] = data.map(client => ({
            id: `client_${client.id}`,
            name: client.name,
            color: 'bg-blue-500',
            icon: <Building2 className="h-3 w-3" />,
          }));
          
          setCustomLabels([...DEFAULT_LABELS, ...clientLabels]);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    };
    
    loadClients();
  }, [user]);
  
  // Auto-tag emails based on client email addresses
  useEffect(() => {
    if (!autoTagEnabled || messages.length === 0 || clientEmailMap.size === 0) return;
    
    const newLabels = { ...emailLabels };
    let hasChanges = false;
    
    messages.forEach(message => {
      // Get sender email (normalize to lowercase)
      const senderEmail = message.from?.toLowerCase().trim();
      if (!senderEmail) return;
      
      // Check if sender matches any client
      const matchedClient = clientEmailMap.get(senderEmail);
      if (matchedClient) {
        const labelId = `client_${matchedClient.id}`;
        const currentLabels = newLabels[message.id] || [];
        
        // Add client label if not already present
        if (!currentLabels.includes(labelId)) {
          newLabels[message.id] = [...currentLabels, labelId];
          hasChanges = true;
        }
      }
    });
    
    if (hasChanges) {
      setEmailLabels(newLabels);
    }
  }, [messages, clientEmailMap, autoTagEnabled]);
  
  // Get client info for a message (for display)
  const getClientForMessage = (message: GmailMessage): Client | null => {
    const senderEmail = message.from?.toLowerCase().trim();
    if (!senderEmail) return null;
    return clientEmailMap.get(senderEmail) || null;
  };

  // Auto-load emails if already connected
  useEffect(() => {
    if (isConnected && !hasLoaded && !isLoading) {
      fetchEmails(50).then(() => setHasLoaded(true));
    }
  }, [isConnected, hasLoaded, isLoading, fetchEmails]);

  const handleConnect = async () => {
    await fetchEmails(50);
    setHasLoaded(true);
  };

  const handleRefresh = async () => {
    setSelectedDateFilter(null);
    await fetchEmails(50);
  };

  // Handle date filter selection
  const handleDateFilterSelect = async (date: Date) => {
    setSelectedDateFilter(date);
    await searchByDateRange(date);
  };

  // Clear date filter
  const handleClearDateFilter = async () => {
    setSelectedDateFilter(null);
    await fetchEmails(50);
  };

  // Load thread messages for chat view
  const loadThreadMessages = async (threadId: string) => {
    setIsLoadingThread(true);
    try {
      // Get all messages with this threadId
      const threadMsgs = messages.filter(m => m.threadId === threadId);
      // Sort by date ascending for chat view
      threadMsgs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setThreadMessages(threadMsgs);
    } catch (error) {
      console.error('Error loading thread:', error);
    }
    setIsLoadingThread(false);
  };

  // Open chat view for a thread
  const openChatView = async (email: GmailMessage) => {
    setSelectedThreadId(email.threadId);
    setViewMode('chat');
    await loadThreadMessages(email.threadId);
  };

  // Handle send reply in chat view
  const handleSendReply = async (message: string): Promise<boolean> => {
    if (!selectedThreadId || threadMessages.length === 0) return false;
    
    // Get the last message to reply to
    const lastMessage = threadMessages[threadMessages.length - 1];
    
    // Prepare reply subject
    const subject = lastMessage.subject.startsWith('Re:') 
      ? lastMessage.subject 
      : `Re: ${lastMessage.subject}`;
    
    // Determine who to reply to
    const replyTo = lastMessage.from === user?.email 
      ? lastMessage.to[0] 
      : lastMessage.from;
    
    // Send the reply
    const success = await sendEmail({
      to: replyTo,
      subject,
      body: message,
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
        return format(date, 'HH:mm', { locale: he });
      }
      if (isYesterday(date)) {
        return 'אתמול ' + format(date, 'HH:mm', { locale: he });
      }
      if (isThisWeek(date)) {
        return format(date, 'EEEE HH:mm', { locale: he });
      }
      return format(date, 'dd/MM/yyyy', { locale: he });
    } catch {
      return dateStr;
    }
  };

  // Toggle label on email
  const toggleEmailLabel = (emailId: string, labelId: string) => {
    setEmailLabels(prev => {
      const current = prev[emailId] || [];
      if (current.includes(labelId)) {
        return { ...prev, [emailId]: current.filter(l => l !== labelId) };
      }
      return { ...prev, [emailId]: [...current, labelId] };
    });
  };

  // Set priority on email
  const setEmailPriorityLevel = (emailId: string, priority: Priority) => {
    setEmailPriority(prev => ({ ...prev, [emailId]: priority }));
  };

  // Set reminder on email
  const setEmailReminder = (emailId: string, date: Date | null) => {
    if (date) {
      setEmailReminders(prev => ({ ...prev, [emailId]: date }));
    } else {
      setEmailReminders(prev => {
        const newReminders = { ...prev };
        delete newReminders[emailId];
        return newReminders;
      });
    }
  };

  // Save note on email
  const saveEmailNote = (emailId: string, note: string) => {
    setEmailNotes(prev => ({ ...prev, [emailId]: note }));
  };

  // Toggle message selection
  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Select all messages
  const selectAllMessages = () => {
    if (selectedMessages.size === filteredMessages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(filteredMessages.map(m => m.id)));
    }
  };

  // Bulk actions
  const bulkAddLabel = (labelId: string) => {
    selectedMessages.forEach(msgId => {
      setEmailLabels(prev => {
        const current = prev[msgId] || [];
        if (!current.includes(labelId)) {
          return { ...prev, [msgId]: [...current, labelId] };
        }
        return prev;
      });
    });
    setSelectedMessages(new Set());
  };

  const bulkSetPriority = (priority: Priority) => {
    selectedMessages.forEach(msgId => {
      setEmailPriorityLevel(msgId, priority);
    });
    setSelectedMessages(new Set());
  };

  // Create task from email
  const handleCreateTaskFromEmail = (email: GmailMessage, clientId?: string) => {
    setTaskInitialData({
      title: email.subject || 'משימה ממייל',
      description: `תוכן מהמייל:\n\n${email.snippet || ''}\n\nמאת: ${email.fromName} (${email.from})`,
      clientId: clientId,
    });
    setIsAddTaskOpen(true);
  };

  // Create meeting from email
  const handleCreateMeetingFromEmail = (email: GmailMessage, clientId?: string) => {
    setMeetingInitialData({
      title: 'פגישה: ' + (email.subject || 'נושא המייל'),
      description: `תוכן מהמייל:\n\n${email.snippet || ''}\n\nמאת: ${email.fromName} (${email.from})`,
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
    await emailMetadata.linkClient(
      emailId, 
      clientId,
      {
        from: selectedEmail?.from,
        subject: selectedEmail?.subject,
        date: selectedEmail?.date ? new Date(selectedEmail.date) : undefined,
      }
    );
  };

  // Filter and sort messages
  const filteredMessages = useMemo(() => {
    let result = messages.filter(msg => 
      msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.fromName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.from?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Filter by tab
    if (activeTab === 'starred') {
      result = result.filter(msg => msg.isStarred);
    }
    
    // Filter by label
    if (filterByLabel) {
      result = result.filter(msg => emailLabels[msg.id]?.includes(filterByLabel));
    }
    
    // Filter by priority
    if (filterByPriority) {
      result = result.filter(msg => emailPriority[msg.id] === filterByPriority);
    }
    
    // Filter by client
    if (filterByClient) {
      result = result.filter(msg => {
        const client = getClientForMessage(msg);
        return client && client.id === filterByClient;
      });
    }
    
    // Sort
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
        result.sort((a, b) => {
          const aPriority = emailPriority[a.id] || 'none';
          const bPriority = emailPriority[b.id] || 'none';
          return priorityOrder[aPriority] - priorityOrder[bPriority];
        });
        break;
      case 'sender':
        result.sort((a, b) => (a.fromName || '').localeCompare(b.fromName || '', 'he'));
        break;
      case 'date':
      default:
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    return result;
  }, [messages, searchQuery, activeTab, filterByLabel, filterByPriority, filterByClient, sortBy, emailLabels, emailPriority, clientEmailMap]);

  // Count emails with reminders for today
  const remindersForToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Object.entries(emailReminders).filter(([, date]) => {
      const reminderDate = new Date(date);
      reminderDate.setHours(0, 0, 0, 0);
      return reminderDate.getTime() === today.getTime();
    }).length;
  }, [emailReminders]);
  return (
    <AppLayout>
      <div className="container mx-auto py-4 px-2 md:py-6 md:px-4 max-w-7xl" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gmail</h1>
              <p className="text-muted-foreground text-sm">ניהול הדוא"ל שלך במקום אחד</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            {hasLoaded ? (
              <>
                <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                  רענון
                </Button>
                <Button onClick={() => setIsComposeOpen(true)}>
                  <PenSquare className="h-4 w-4 ml-2" />
                  כתיבת הודעה
                </Button>
              </>
            ) : (
              <Button onClick={handleConnect} disabled={isLoading} className="w-full md:w-auto">
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
              <h2 className="text-xl font-semibold mb-2">התחבר לחשבון Gmail שלך</h2>
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
                {[1, 2, 3, 4, 5].map(i => (
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
        {hasLoaded && viewMode === 'chat' && selectedThreadId && (
          <Card className="h-[calc(100vh-180px)]">
            <EmailThreadChat
              threadId={selectedThreadId}
              messages={threadMessages.map(m => ({
                ...m,
                isSent: m.from === user?.email,
              }))}
              currentUserEmail={user?.email || ''}
              subject={threadMessages[0]?.subject || ''}
              isLoading={isLoadingThread}
              isSending={isSending}
              onBack={() => {
                setViewMode('list');
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
            />
          </Card>
        )}

        {hasLoaded && viewMode === 'list' && (
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
                    variant={activeTab === 'inbox' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start text-right"
                    onClick={() => { setActiveTab('inbox'); setFilterByLabel(null); }}
                  >
                    <Inbox className="h-4 w-4 ml-2" />
                    דואר נכנס
                    {messages.filter(m => !m.isRead).length > 0 && (
                      <Badge variant="secondary" className="mr-auto">
                        {messages.filter(m => !m.isRead).length}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    variant={activeTab === 'starred' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start text-right"
                    onClick={() => { setActiveTab('starred'); setFilterByLabel(null); }}
                  >
                    <Star className="h-4 w-4 ml-2" />
                    מסומנים בכוכב
                  </Button>
                  <Button 
                    variant={activeTab === 'sent' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start text-right"
                    onClick={() => { setActiveTab('sent'); setFilterByLabel(null); }}
                  >
                    <Send className="h-4 w-4 ml-2" />
                    נשלחו
                  </Button>
                  
                  {/* Reminders */}
                  {remindersForToday > 0 && (
                    <Button 
                      variant={activeTab === 'reminders' ? 'secondary' : 'ghost'} 
                      className="w-full justify-start text-right"
                      onClick={() => setActiveTab('reminders')}
                    >
                      <Bell className="h-4 w-4 ml-2 text-orange-500" />
                      תזכורות להיום
                      <Badge variant="destructive" className="mr-auto">
                        {remindersForToday}
                      </Badge>
                    </Button>
                  )}
                </nav>
                
                <Separator className="my-4" />
                
                {/* Labels Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">תוויות</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowLabelManager(true)}>
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                  {customLabels.map(label => {
                    const count = Object.values(emailLabels).filter(labels => labels.includes(label.id)).length;
                    return (
                      <Button 
                        key={label.id}
                        variant={filterByLabel === label.id ? 'secondary' : 'ghost'} 
                        className="w-full justify-start text-right h-8"
                        onClick={() => setFilterByLabel(filterByLabel === label.id ? null : label.id)}
                      >
                        <div className={cn('h-3 w-3 rounded-full ml-2', label.color)} />
                        {label.name}
                        {count > 0 && (
                          <span className="mr-auto text-xs text-muted-foreground">{count}</span>
                        )}
                      </Button>
                    );
                  })}
                </div>
                
                <Separator className="my-4" />
                
                {/* Priority Filter */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">סינון לפי עדיפות</h3>
                  {Object.entries(PRIORITY_CONFIG).filter(([key]) => key !== 'none').map(([key, config]) => {
                    const count = Object.values(emailPriority).filter(p => p === key).length;
                    return (
                      <Button 
                        key={key}
                        variant={filterByPriority === key ? 'secondary' : 'ghost'} 
                        className="w-full justify-start text-right h-8"
                        onClick={() => setFilterByPriority(filterByPriority === key ? null : key as Priority)}
                      >
                        {config.icon}
                        <span className="mr-2">{config.label}</span>
                        {count > 0 && (
                          <span className="mr-auto text-xs text-muted-foreground">{count}</span>
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
                        <h3 className="text-sm font-medium text-muted-foreground">סינון לפי לקוח</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setAutoTagEnabled(!autoTagEnabled)}
                              >
                                {autoTagEnabled ? (
                                  <Tag className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Tag className="h-3.5 w-3.5 text-gray-400" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              {autoTagEnabled ? 'תיוג אוטומטי פעיל' : 'תיוג אוטומטי כבוי'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <ScrollArea className="h-32">
                        {clients.slice(0, 10).map((client) => {
                          const count = messages.filter(msg => {
                            const c = getClientForMessage(msg);
                            return c && c.id === client.id;
                          }).length;
                          return (
                            <Button 
                              key={client.id}
                              variant={filterByClient === client.id ? 'secondary' : 'ghost'} 
                              className="w-full justify-start text-right h-8"
                              onClick={() => setFilterByClient(filterByClient === client.id ? null : client.id)}
                            >
                              <Building2 className="h-4 w-4 text-blue-500" />
                              <span className="mr-2 truncate">{client.name}</span>
                              {count > 0 && (
                                <span className="mr-auto text-xs text-muted-foreground">{count}</span>
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
                    </div>
                  </>
                )}
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
                        placeholder="חיפוש במיילים..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-9 text-right"
                        dir="rtl"
                      />
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
                          checked={sortBy === 'date'}
                          onCheckedChange={() => setSortBy('date')}
                        >
                          לפי תאריך
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem 
                          checked={sortBy === 'priority'}
                          onCheckedChange={() => setSortBy('priority')}
                        >
                          לפי עדיפות
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem 
                          checked={sortBy === 'sender'}
                          onCheckedChange={() => setSortBy('sender')}
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
                        <div className="px-2 py-1.5 text-sm font-medium border-b mb-1">סגנון תצוגה</div>
                        <DropdownMenuCheckboxItem 
                          checked={displayDensity === 'compact'}
                          onCheckedChange={() => setDisplayDensity('compact')}
                          className="gap-2"
                        >
                          <Rows3 className="h-4 w-4" />
                          צפוף - יותר הודעות
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem 
                          checked={displayDensity === 'comfortable'}
                          onCheckedChange={() => setDisplayDensity('comfortable')}
                          className="gap-2"
                        >
                          <LayoutList className="h-4 w-4" />
                          נוח - מאוזן
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem 
                          checked={displayDensity === 'spacious'}
                          onCheckedChange={() => setDisplayDensity('spacious')}
                          className="gap-2"
                        >
                          <Maximize2 className="h-4 w-4" />
                          מרווח - קריאות מקסימלית
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-sm font-medium">אפשרויות נוספות</div>
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
                  
                  {/* Bulk Actions (when messages are selected) */}
                  {selectedMessages.size > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <Checkbox 
                        checked={selectedMessages.size === filteredMessages.length}
                        onCheckedChange={selectAllMessages}
                      />
                      <span className="text-sm font-medium mr-2">{selectedMessages.size} נבחרו</span>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Tag className="h-4 w-4 ml-2" />
                            הוסף תווית
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="rtl">
                          {customLabels.map(label => (
                            <DropdownMenuItem key={label.id} onClick={() => bulkAddLabel(label.id)}>
                              <div className={cn('h-3 w-3 rounded-full ml-2', label.color)} />
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
                          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                            <DropdownMenuItem key={key} onClick={() => bulkSetPriority(key as Priority)}>
                              {config.icon}
                              <span className="mr-2">{config.label}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button variant="ghost" size="sm" onClick={() => setSelectedMessages(new Set())}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Active Filters Display */}
                  {(filterByLabel || filterByPriority) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">מסננים פעילים:</span>
                      {filterByLabel && (
                        <Badge 
                          variant="secondary" 
                          className="gap-1 cursor-pointer"
                          onClick={() => setFilterByLabel(null)}
                        >
                          <div className={cn('h-2 w-2 rounded-full', customLabels.find(l => l.id === filterByLabel)?.color)} />
                          {customLabels.find(l => l.id === filterByLabel)?.name}
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
                            <div className="px-2 py-1.5 text-sm font-medium">תוויות</div>
                            {customLabels.map(label => (
                              <DropdownMenuCheckboxItem 
                                key={label.id}
                                checked={emailLabels[selectedEmail.id]?.includes(label.id)}
                                onCheckedChange={() => toggleEmailLabel(selectedEmail.id, label.id)}
                              >
                                <div className={cn('h-3 w-3 rounded-full ml-2', label.color)} />
                                {label.name}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {/* Priority */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              {PRIORITY_CONFIG[emailPriority[selectedEmail.id] || 'none'].icon}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rtl">
                            <div className="px-2 py-1.5 text-sm font-medium">עדיפות</div>
                            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                              <DropdownMenuCheckboxItem 
                                key={key}
                                checked={emailPriority[selectedEmail.id] === key}
                                onCheckedChange={() => setEmailPriorityLevel(selectedEmail.id, key as Priority)}
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
                                className={emailReminders[selectedEmail.id] ? 'text-orange-500' : ''}
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
                                ? `תזכורת: ${format(new Date(emailReminders[selectedEmail.id]), 'dd/MM/yyyy HH:mm')}`
                                : 'הוסף תזכורת'
                              }
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
                                className={emailNotes[selectedEmail.id] ? 'text-blue-500' : ''}
                                onClick={() => {
                                  setSelectedEmailForAction(selectedEmail);
                                  setIsNoteDialogOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {emailNotes[selectedEmail.id] ? 'ערוך הערה' : 'הוסף הערה'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <Button variant="ghost" size="icon">
                          <Reply className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Forward className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Labels Display */}
                    {emailLabels[selectedEmail.id]?.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {emailLabels[selectedEmail.id].map(labelId => {
                          const label = customLabels.find(l => l.id === labelId);
                          return label && (
                            <Badge 
                              key={labelId} 
                              variant="secondary"
                              className="gap-1"
                            >
                              <div className={cn('h-2 w-2 rounded-full', label.color)} />
                              {label.name}
                            </Badge>
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
                            <p className="text-blue-800 dark:text-blue-200">{emailNotes[selectedEmail.id]}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    <div className="space-y-4 text-right">
                      <div>
                        <h2 className="text-xl font-semibold">{selectedEmail.subject || '(ללא נושא)'}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{selectedEmail.fromName}</span>
                          <span className="text-xs" dir="ltr">&lt;{selectedEmail.from}&gt;</span>
                          
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
                        linkedClientId={emailMetadata.getMetadata(selectedEmail.id)?.linked_client_id || null}
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
                      
                      <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                        {selectedEmail.snippet}
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
                    
                    <ScrollArea className="h-[600px]" ref={scrollContainerRef as any}>
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
                            const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
                            const showDateSeparator = !prevMessage || 
                              !isSameDay(new Date(message.date), new Date(prevMessage.date));
                            
                            return (
                              <React.Fragment key={message.id}>
                                {showDateSeparator && (
                                  <DateSeparator date={message.date} />
                                )}
                                <div
                                  data-message-id={message.id}
                                  className={cn(
                                    'flex items-start gap-3 hover:bg-muted/50 transition-colors cursor-pointer group',
                                    !message.isRead && 'bg-primary/5',
                                    selectedMessages.has(message.id) && 'bg-primary/10',
                                    displayDensity === 'compact' && 'p-2',
                                    displayDensity === 'comfortable' && 'p-3',
                                    displayDensity === 'spacious' && 'p-4'
                                  )}
                                >
                                  {/* Checkbox */}
                                  <Checkbox 
                                    checked={selectedMessages.has(message.id)}
                              onCheckedChange={() => toggleMessageSelection(message.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1"
                            />
                            
                            {/* Star */}
                            <div 
                              className="flex-shrink-0 mt-1 cursor-pointer"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await toggleStar(message.id, message.isStarred);
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
                            {emailPriority[message.id] && emailPriority[message.id] !== 'none' && (
                              <div className="flex-shrink-0 mt-1">
                                {PRIORITY_CONFIG[emailPriority[message.id]].icon}
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
                                <span className={cn('font-medium truncate', !message.isRead && 'font-bold')}>
                                  {message.fromName}
                                </span>
                                
                                {/* Thread count badge */}
                                {(() => {
                                  const threadCount = messages.filter(m => m.threadId === message.threadId).length;
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
                                  const client = getClientForMessage(message);
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
                                {emailLabels[message.id]?.filter(l => !l.startsWith('client_')).slice(0, 2).map(labelId => {
                                  const label = customLabels.find(l => l.id === labelId);
                                  return label && (
                                    <div 
                                      key={labelId}
                                      className={cn('h-2 w-2 rounded-full', label.color)}
                                      title={label.name}
                                    />
                                  );
                                })}
                                {emailLabels[message.id]?.filter(l => !l.startsWith('client_')).length > 2 && (
                                  <span className="text-xs text-muted-foreground">+{emailLabels[message.id].filter(l => !l.startsWith('client_')).length - 2}</span>
                                )}
                                
                                {/* Reminder indicator */}
                                {emailReminders[message.id] && (
                                  <Bell className="h-3 w-3 text-orange-500" />
                                )}
                                
                                {/* Note indicator */}
                                {emailNotes[message.id] && (
                                  <FileText className="h-3 w-3 text-blue-500" />
                                )}
                                
                                <span className="text-xs text-muted-foreground mr-auto flex-shrink-0">
                                  {formatDate(message.date)}
                                </span>
                              </div>
                              <p className={cn(
                                'text-sm', 
                                !message.isRead && 'font-semibold',
                                displayDensity === 'compact' && 'text-xs truncate',
                                displayDensity === 'comfortable' && 'line-clamp-1',
                                displayDensity === 'spacious' && 'line-clamp-2'
                              )}>
                                {message.subject || '(ללא נושא)'}
                              </p>
                              {showPreview && displayDensity !== 'compact' && (
                                <p className={cn(
                                  'text-muted-foreground mt-1',
                                  displayDensity === 'spacious' ? 'text-sm line-clamp-2' : 'text-xs line-clamp-1'
                                )}>
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
                                <DropdownMenuItem onClick={() => openChatView(message)}>
                                  <MessageSquare className="h-4 w-4 ml-2" />
                                  פתח כשיחה
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setSelectedEmailForAction(message);
                                  setIsReminderDialogOpen(true);
                                }}>
                                  <Bell className="h-4 w-4 ml-2" />
                                  הוסף תזכורת
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedEmailForAction(message);
                                  setIsNoteDialogOpen(true);
                                }}>
                                  <FileText className="h-4 w-4 ml-2" />
                                  הוסף הערה
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={async () => {
                                  const success = await archiveEmail(message.id);
                                  if (success) handleRefresh();
                                }}>
                                  <Archive className="h-4 w-4 ml-2" />
                                  העבר לארכיון
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={async () => {
                                    const success = await deleteEmail(message.id);
                                    if (success) handleRefresh();
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 ml-2" />
                                  מחק
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
          onOpenChange={setIsComposeOpen}
          onSendSuccess={() => {
            setIsComposeOpen(false);
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
        <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>הגדרת תזכורת</DialogTitle>
              <DialogDescription>
                {selectedEmailForAction?.subject || 'ללא נושא'}
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
                      setEmailReminder(selectedEmailForAction.id, new Date(e.target.value));
                      setIsReminderDialogOpen(false);
                    }
                  }}
                />
              </div>
              {selectedEmailForAction && emailReminders[selectedEmailForAction.id] && (
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
                {selectedEmailForAction?.subject || 'ללא נושא'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea 
                placeholder="כתוב הערה..."
                rows={5}
                defaultValue={selectedEmailForAction ? emailNotes[selectedEmailForAction.id] || '' : ''}
                onChange={(e) => {
                  if (selectedEmailForAction) {
                    saveEmailNote(selectedEmailForAction.id, e.target.value);
                  }
                }}
              />
              <div className="flex gap-2">
                <Button onClick={() => setIsNoteDialogOpen(false)}>
                  שמור
                </Button>
                <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
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
                  {customLabels.map(label => (
                    <div key={label.id} className="flex items-center gap-3 p-2 border rounded-lg">
                      <div className={cn('h-4 w-4 rounded-full', label.color)} />
                      <span className="flex-1">{label.name}</span>
                      <Badge variant="secondary">
                        {Object.values(emailLabels).filter(labels => labels.includes(label.id)).length}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator />
              <div className="flex gap-2">
                <Input placeholder="שם תווית חדשה..." className="flex-1" />
                <Button size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
