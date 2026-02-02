// ClientEmailsTab - Display emails linked to a specific client
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useGmailIntegration, GmailMessage } from '@/hooks/useGmailIntegration';
import { useEmailMetadata } from '@/hooks/useEmailMetadata';
import { cn } from '@/lib/utils';
import {
  Mail,
  Search,
  RefreshCw,
  ExternalLink,
  Star,
  Clock,
  Inbox,
  Send,
  Loader2,
  MailOpen,
  AlertCircle,
  Link as LinkIcon,
  Link2Off,
  ArrowLeft,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

interface ClientEmailsTabProps {
  clientId: string;
  clientName: string;
  clientEmail?: string | null;
}

export function ClientEmailsTab({ clientId, clientName, clientEmail }: ClientEmailsTabProps) {
  const { toast } = useToast();
  const { messages, fetchEmails, isLoading } = useGmailIntegration();
  const { metadata, linkClient, refreshMetadata, getMetadata } = useEmailMetadata();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
  const [autoDetectedEmails, setAutoDetectedEmails] = useState<GmailMessage[]>([]);
  const [linkedEmails, setLinkedEmails] = useState<GmailMessage[]>([]);
  const [isLoadingClientEmails, setIsLoadingClientEmails] = useState(false);
  const [activeTab, setActiveTab] = useState<'linked' | 'detected'>('linked');

  // Load emails linked to this client + auto-detect by email address
  const loadClientEmails = useCallback(async () => {
    setIsLoadingClientEmails(true);
    try {
      // First fetch recent emails to search through
      const allEmails = await fetchEmails(100);
      
      // Find manually linked emails (from metadata)
      const linked: GmailMessage[] = [];
      const detected: GmailMessage[] = [];
      
      allEmails.forEach((email) => {
        const emailMeta = getMetadata(email.id);
        
        // Check if manually linked
        if (emailMeta?.linked_client_id === clientId) {
          linked.push(email);
        }
        // Check if matches client email address (auto-detection)
        else if (clientEmail && (
          email.from.toLowerCase().includes(clientEmail.toLowerCase()) ||
          email.to.some(to => to.toLowerCase().includes(clientEmail.toLowerCase()))
        )) {
          detected.push(email);
        }
      });
      
      setLinkedEmails(linked);
      setAutoDetectedEmails(detected);
    } catch (error) {
      console.error('Error loading client emails:', error);
    } finally {
      setIsLoadingClientEmails(false);
    }
  }, [clientId, clientEmail, fetchEmails, getMetadata]);

  // Load client emails on mount
  useEffect(() => {
    loadClientEmails();
    refreshMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, clientEmail]);

  // Link email to client
  const handleLinkEmail = async (email: GmailMessage) => {
    try {
      await linkClient(email.id, clientId, {
        from: email.from,
        subject: email.subject,
        date: new Date(email.date),
      });
      
      toast({
        title: 'מייל קושר',
        description: `המייל קושר ללקוח ${clientName}`,
      });
      
      // Move from detected to linked
      setAutoDetectedEmails(prev => prev.filter(e => e.id !== email.id));
      setLinkedEmails(prev => [...prev, email]);
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לקשר את המייל',
        variant: 'destructive',
      });
    }
  };

  // Unlink email from client
  const handleUnlinkEmail = async (email: GmailMessage) => {
    try {
      await linkClient(email.id, null);
      
      toast({
        title: 'המייל נותק',
        description: 'המייל כבר לא מקושר ללקוח',
      });
      
      // Move from linked to detected if matches email
      setLinkedEmails(prev => prev.filter(e => e.id !== email.id));
      if (clientEmail && (
        email.from.toLowerCase().includes(clientEmail.toLowerCase()) ||
        email.to.some(to => to.toLowerCase().includes(clientEmail.toLowerCase()))
      )) {
        setAutoDetectedEmails(prev => [...prev, email]);
      }
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לנתק את המייל',
        variant: 'destructive',
      });
    }
  };

  // Filter emails by search query
  const displayedEmails = useMemo(() => {
    const emails = activeTab === 'linked' ? linkedEmails : autoDetectedEmails;
    if (!searchQuery) return emails;
    
    const query = searchQuery.toLowerCase();
    return emails.filter(email =>
      email.subject.toLowerCase().includes(query) ||
      email.from.toLowerCase().includes(query) ||
      email.snippet.toLowerCase().includes(query)
    );
  }, [activeTab, linkedEmails, autoDetectedEmails, searchQuery]);

  // Format date in Hebrew
  const formatEmailDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'd בMMMM yyyy, HH:mm', { locale: he });
    } catch {
      return dateStr;
    }
  };

  // Email list item component
  const EmailListItem = ({ email, showLinkButton }: { email: GmailMessage; showLinkButton: boolean }) => (
    <div
      className={cn(
        "p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md",
        selectedEmail?.id === email.id 
          ? "border-[#D4A843] bg-[#D4A843]/5" 
          : "border-gray-200 hover:border-[#162C58]/30",
        !email.isRead && "bg-blue-50/50"
      )}
      onClick={() => setSelectedEmail(email)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {!email.isRead && <div className="w-2 h-2 rounded-full bg-blue-500" />}
            {email.isStarred && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
            <span className="font-medium text-sm truncate">{email.fromName || email.from}</span>
          </div>
          <p className="text-sm font-semibold truncate mb-1">{email.subject || '(ללא נושא)'}</p>
          <p className="text-xs text-gray-500 truncate">{email.snippet}</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-gray-400">{formatEmailDate(email.date)}</span>
          {showLinkButton ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLinkEmail(email);
                  }}
                >
                  <LinkIcon className="w-3 h-3 text-[#D4A843]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>קשר ללקוח</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnlinkEmail(email);
                  }}
                >
                  <Link2Off className="w-3 h-3 text-gray-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>הסר קישור</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );

  // Email detail view
  const EmailDetailView = ({ email }: { email: GmailMessage }) => (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setSelectedEmail(null)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold truncate flex-1">{email.subject || '(ללא נושא)'}</h3>
      </div>
      
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{email.fromName || email.from}</p>
            <p className="text-xs text-gray-500">{email.from}</p>
            <p className="text-xs text-gray-500 mt-1">
              אל: {email.to.join(', ')}
            </p>
          </div>
          <div className="text-left text-xs text-gray-400">
            {formatEmailDate(email.date)}
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="text-sm whitespace-pre-wrap">
          {email.snippet}
          <p className="mt-4 text-gray-400 text-xs">
            (תוכן מלא זמין ב-Gmail)
          </p>
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#162C58] flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">מיילים של {clientName}</h2>
            {clientEmail && (
              <p className="text-sm text-gray-500">{clientEmail}</p>
            )}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={loadClientEmails}
          disabled={isLoadingClientEmails}
        >
          {isLoadingClientEmails ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="mr-2">רענן</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b px-4">
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'linked'
              ? "border-[#D4A843] text-[#162C58]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
          onClick={() => setActiveTab('linked')}
        >
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            מקושרים
            {linkedEmails.length > 0 && (
              <Badge variant="secondary" className="bg-[#D4A843]/20 text-[#162C58]">
                {linkedEmails.length}
              </Badge>
            )}
          </div>
        </button>
        
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'detected'
              ? "border-[#D4A843] text-[#162C58]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
          onClick={() => setActiveTab('detected')}
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            זוהו אוטומטית
            {autoDetectedEmails.length > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {autoDetectedEmails.length}
              </Badge>
            )}
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="חיפוש מיילים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {selectedEmail ? (
          <div className="flex-1">
            <EmailDetailView email={selectedEmail} />
          </div>
        ) : (
          <ScrollArea className="flex-1 p-4">
            {isLoadingClientEmails || isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#D4A843]" />
                <p className="text-gray-500 mt-2">טוען מיילים...</p>
              </div>
            ) : displayedEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-700 mb-1">
                  {activeTab === 'linked' ? 'אין מיילים מקושרים' : 'לא זוהו מיילים'}
                </h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  {activeTab === 'linked' 
                    ? 'עדיין לא קושרו מיילים ללקוח זה. עבור לטאב "זוהו אוטומטית" כדי לקשר מיילים.'
                    : clientEmail 
                      ? 'לא נמצאו מיילים התואמים לכתובת הלקוח.'
                      : 'אין כתובת מייל ללקוח זה. הוסף כתובת מייל לזיהוי אוטומטי.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedEmails.map((email) => (
                  <EmailListItem 
                    key={email.id} 
                    email={email} 
                    showLinkButton={activeTab === 'detected'}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
