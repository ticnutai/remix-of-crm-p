// ClientEmailsDialog - Non-blocking dialog to identify and link emails to clients
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmailMetadata } from '@/hooks/useEmailMetadata';
import { GmailMessage } from '@/hooks/useGmailIntegration';
import { cn } from '@/lib/utils';
import {
  Users,
  Mail,
  Search,
  Link as LinkIcon,
  Link2Off,
  Check,
  ExternalLink,
  User,
  Loader2,
  Sparkles,
  Star,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface ClientWithEmails extends Client {
  linkedEmails: GmailMessage[];
  detectedEmails: GmailMessage[];
}

interface ClientEmailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emails: GmailMessage[];
  onEmailClick?: (email: GmailMessage) => void;
}

export function ClientEmailsDialog({ 
  open, 
  onOpenChange, 
  emails,
  onEmailClick,
}: ClientEmailsDialogProps) {
  const { toast } = useToast();
  const { metadata, linkClient, getMetadata, refreshMetadata } = useEmailMetadata();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientWithEmails | null>(null);

  // Load clients from database
  useEffect(() => {
    if (open) {
      loadClients();
      refreshMetadata();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, company')
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group emails by client (linked + auto-detected)
  const clientsWithEmails = useMemo((): ClientWithEmails[] => {
    return clients.map(client => {
      const linkedEmails: GmailMessage[] = [];
      const detectedEmails: GmailMessage[] = [];

      emails.forEach(email => {
        const emailMeta = getMetadata(email.id);
        
        // Check if manually linked to this client
        if (emailMeta?.linked_client_id === client.id) {
          linkedEmails.push(email);
        }
        // Check if email address matches (auto-detection)
        else if (client.email && (
          email.from.toLowerCase().includes(client.email.toLowerCase()) ||
          email.to.some(to => to.toLowerCase().includes(client.email!.toLowerCase()))
        )) {
          detectedEmails.push(email);
        }
      });

      return {
        ...client,
        linkedEmails,
        detectedEmails,
      };
    });
  }, [clients, emails, getMetadata]);

  // Filter clients by search
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clientsWithEmails;
    
    const query = searchQuery.toLowerCase();
    return clientsWithEmails.filter(client =>
      client.name.toLowerCase().includes(query) ||
      (client.email && client.email.toLowerCase().includes(query)) ||
      (client.company && client.company.toLowerCase().includes(query))
    );
  }, [clientsWithEmails, searchQuery]);

  // Clients with emails (sorted by total email count)
  const clientsWithEmailsSorted = useMemo(() => {
    return [...filteredClients]
      .filter(c => c.linkedEmails.length > 0 || c.detectedEmails.length > 0)
      .sort((a, b) => 
        (b.linkedEmails.length + b.detectedEmails.length) - 
        (a.linkedEmails.length + a.detectedEmails.length)
      );
  }, [filteredClients]);

  // Link email to client
  const handleLinkEmail = async (email: GmailMessage, clientId: string, clientName: string) => {
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
      
      // Refresh to update the UI
      await refreshMetadata();
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לקשר את המייל',
        variant: 'destructive',
      });
    }
  };

  // Unlink email
  const handleUnlinkEmail = async (email: GmailMessage) => {
    try {
      await linkClient(email.id, null);
      
      toast({
        title: 'המייל נותק',
        description: 'המייל כבר לא מקושר ללקוח',
      });
      
      await refreshMetadata();
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לנתק את המייל',
        variant: 'destructive',
      });
    }
  };

  // Link all detected emails to a client
  const handleLinkAllDetected = async (client: ClientWithEmails) => {
    try {
      for (const email of client.detectedEmails) {
        await linkClient(email.id, client.id, {
          from: email.from,
          subject: email.subject,
          date: new Date(email.date),
        });
      }
      
      toast({
        title: 'כל המיילים קושרו',
        description: `${client.detectedEmails.length} מיילים קושרו ל-${client.name}`,
      });
      
      await refreshMetadata();
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לקשר את כל המיילים',
        variant: 'destructive',
      });
    }
  };

  // Format date
  const formatEmailDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'd.M.yy', { locale: he });
    } catch {
      return '';
    }
  };

  // Client detail view
  const ClientDetailView = ({ client }: { client: ClientWithEmails }) => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSelectedClient(null)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="w-10 h-10 rounded-full bg-[#162C58] flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold">{client.name}</h3>
          {client.email && (
            <p className="text-sm text-gray-500">{client.email}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Badge className="bg-[#D4A843]/20 text-[#162C58]">
            {client.linkedEmails.length} מקושרים
          </Badge>
          <Badge className="bg-green-100 text-green-700">
            {client.detectedEmails.length} זוהו
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Linked emails section */}
        {client.linkedEmails.length > 0 && (
          <div className="p-4 border-b">
            <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              מיילים מקושרים
            </h4>
            <div className="space-y-2">
              {client.linkedEmails.map(email => (
                <div 
                  key={email.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onEmailClick?.(email)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {email.isStarred && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                        <span className="text-xs text-gray-500">{email.from}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{email.subject || '(ללא נושא)'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatEmailDate(email.date)}</span>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detected emails section */}
        {client.detectedEmails.length > 0 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-500" />
                זוהו אוטומטית
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleLinkAllDetected(client)}
                className="text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                קשר הכל
              </Button>
            </div>
            <div className="space-y-2">
              {client.detectedEmails.map(email => (
                <div 
                  key={email.id}
                  className="p-3 border border-green-200 rounded-lg bg-green-50/50 hover:bg-green-50 cursor-pointer transition-colors"
                  onClick={() => onEmailClick?.(email)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {email.isStarred && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                        <span className="text-xs text-gray-500">{email.from}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{email.subject || '(ללא נושא)'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatEmailDate(email.date)}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLinkEmail(email, client.id, client.name);
                            }}
                          >
                            <LinkIcon className="w-3 h-3 text-[#D4A843]" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>קשר ללקוח</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No emails */}
        {client.linkedEmails.length === 0 && client.detectedEmails.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Mail className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">אין מיילים ללקוח זה</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4A843]" />
            זיהוי מיילים לפי לקוחות
          </DialogTitle>
        </DialogHeader>

        {selectedClient ? (
          <ClientDetailView client={selectedClient} />
        ) : (
          <>
            {/* Search */}
            <div className="p-4 border-b shrink-0">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="חיפוש לקוח..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#D4A843]" />
                  <p className="text-gray-500 mt-2">טוען לקוחות...</p>
                </div>
              ) : clientsWithEmailsSorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-700 mb-1">לא נמצאו מיילים</h3>
                  <p className="text-sm text-gray-500 max-w-xs">
                    {searchQuery 
                      ? 'נסה לחפש לקוח אחר'
                      : 'לא נמצאו מיילים התואמים ללקוחות במערכת. ודא שללקוחות מוגדרת כתובת מייל.'
                    }
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {clientsWithEmailsSorted.map(client => (
                    <div
                      key={client.id}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                        "hover:border-[#162C58]/30"
                      )}
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#162C58] flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium">{client.name}</h3>
                            {client.email && (
                              <p className="text-sm text-gray-500">{client.email}</p>
                            )}
                            {client.company && (
                              <p className="text-xs text-gray-400">{client.company}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {client.linkedEmails.length > 0 && (
                            <Badge className="bg-[#D4A843]/20 text-[#162C58]">
                              <LinkIcon className="w-3 h-3 mr-1" />
                              {client.linkedEmails.length}
                            </Badge>
                          )}
                          {client.detectedEmails.length > 0 && (
                            <Badge className="bg-green-100 text-green-700">
                              <Sparkles className="w-3 h-3 mr-1" />
                              {client.detectedEmails.length}
                            </Badge>
                          )}
                          <ChevronLeft className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
