// Client Emails Tab - Shows emails classified to client folder
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, 
  Star, 
  StarOff,
  FolderOpen, 
  Search, 
  Calendar,
  User,
  ExternalLink,
  RefreshCw,
  Trash2,
  Eye,
  StickyNote,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';

interface EmailFolderItem {
  id: string;
  folder_id: string;
  email_id: string;
  email_subject: string | null;
  email_from: string | null;
  email_date: string | null;
  email_snippet: string | null;
  client_id: string | null;
  notes: string | null;
  is_starred: boolean | null;
  is_important: boolean | null;
  added_at: string | null;
  user_id: string;
  folder?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

interface EmailFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
  client_id: string | null;
}

interface ClientEmailsTabProps {
  clientId: string;
  clientName: string;
  clientEmail?: string;
}

export function ClientEmailsTab({ clientId, clientName, clientEmail }: ClientEmailsTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailFolderItem[]>([]);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    if (clientId && user) {
      fetchClientEmails();
      fetchClientFolders();
    }
  }, [clientId, user]);

  const fetchClientFolders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('email_folders')
        .select('*')
        .eq('user_id', user.id)
        .eq('client_id', clientId);

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching client folders:', error);
    }
  };

  const fetchClientEmails = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get emails directly classified to this client
      const { data: directEmails, error: directError } = await supabase
        .from('email_folder_items')
        .select(`
          *,
          folder:email_folders(id, name, color, icon)
        `)
        .eq('client_id', clientId)
        .order('email_date', { ascending: false });

      if (directError) throw directError;

      // Get emails from client's folders
      const { data: folderEmails, error: folderError } = await supabase
        .from('email_folder_items')
        .select(`
          *,
          folder:email_folders!inner(id, name, color, icon, client_id)
        `)
        .eq('folder.client_id', clientId)
        .order('email_date', { ascending: false });

      if (folderError) throw folderError;

      // Combine and deduplicate
      const allEmails = [...(directEmails || [])];
      (folderEmails || []).forEach(email => {
        if (!allEmails.find(e => e.id === email.id)) {
          allEmails.push(email);
        }
      });

      // Sort by date
      allEmails.sort((a, b) => {
        const dateA = a.email_date ? new Date(a.email_date).getTime() : 0;
        const dateB = b.email_date ? new Date(b.email_date).getTime() : 0;
        return dateB - dateA;
      });

      setEmails(allEmails);
    } catch (error) {
      console.error('Error fetching client emails:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את המיילים',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = async (emailId: string, currentStar: boolean) => {
    try {
      const { error } = await supabase
        .from('email_folder_items')
        .update({ is_starred: !currentStar })
        .eq('id', emailId);

      if (error) throw error;

      setEmails(prev => prev.map(e => 
        e.id === emailId ? { ...e, is_starred: !currentStar } : e
      ));
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const updateNotes = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('email_folder_items')
        .update({ notes: notesText || null })
        .eq('id', emailId);

      if (error) throw error;

      setEmails(prev => prev.map(e => 
        e.id === emailId ? { ...e, notes: notesText || null } : e
      ));

      setEditingNotes(null);
      toast({
        title: 'הערות נשמרו',
        description: 'ההערות עודכנו בהצלחה'
      });
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את ההערות',
        variant: 'destructive'
      });
    }
  };

  const removeFromFolder = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('email_folder_items')
        .delete()
        .eq('id', emailId);

      if (error) throw error;

      setEmails(prev => prev.filter(e => e.id !== emailId));
      toast({
        title: 'הוסר מהתיקייה',
        description: 'המייל הוסר מתיקיית הלקוח'
      });
    } catch (error) {
      console.error('Error removing email:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להסיר את המייל',
        variant: 'destructive'
      });
    }
  };

  const filteredEmails = emails.filter(email => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (email.email_subject?.toLowerCase().includes(search)) ||
      (email.email_from?.toLowerCase().includes(search)) ||
      (email.email_snippet?.toLowerCase().includes(search)) ||
      (email.notes?.toLowerCase().includes(search))
    );
  });

  const starredEmails = filteredEmails.filter(e => e.is_starred);
  const regularEmails = filteredEmails.filter(e => !e.is_starred);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                מיילים של {clientName}
              </CardTitle>
              <CardDescription>
                {emails.length} מיילים מסווגים
                {clientEmail && ` • ${clientEmail}`}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchClientEmails}
            >
              <RefreshCw className="h-4 w-4 ml-1" />
              רענן
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חפש במיילים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9"
            />
          </div>

          {/* Folders badges */}
          {folders.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {folders.map(folder => (
                <Badge 
                  key={folder.id} 
                  variant="outline"
                  style={{ borderColor: folder.color, color: folder.color }}
                >
                  <FolderOpen className="h-3 w-3 ml-1" />
                  {folder.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Starred Emails */}
      {starredEmails.length > 0 && (
        <Collapsible defaultOpen>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    מסומנים בכוכב
                    <Badge variant="secondary">{starredEmails.length}</Badge>
                  </CardTitle>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {starredEmails.map(email => (
                      <EmailItem 
                        key={email.id}
                        email={email}
                        isExpanded={expandedEmail === email.id}
                        onToggleExpand={() => setExpandedEmail(
                          expandedEmail === email.id ? null : email.id
                        )}
                        onToggleStar={() => toggleStar(email.id, email.is_starred)}
                        onRemove={() => removeFromFolder(email.id)}
                        isEditingNotes={editingNotes === email.id}
                        onEditNotes={() => {
                          setEditingNotes(email.id);
                          setNotesText(email.notes || '');
                        }}
                        onSaveNotes={() => updateNotes(email.id)}
                        onCancelNotes={() => setEditingNotes(null)}
                        notesText={notesText}
                        onNotesChange={setNotesText}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* All Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            כל המיילים
            <Badge variant="secondary">{regularEmails.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>אין מיילים מסווגים ללקוח זה</p>
              <p className="text-sm mt-1">
                ניתן לסווג מיילים מעמוד המיילים
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {regularEmails.map(email => (
                  <EmailItem 
                    key={email.id}
                    email={email}
                    isExpanded={expandedEmail === email.id}
                    onToggleExpand={() => setExpandedEmail(
                      expandedEmail === email.id ? null : email.id
                    )}
                    onToggleStar={() => toggleStar(email.id, email.is_starred)}
                    onRemove={() => removeFromFolder(email.id)}
                    isEditingNotes={editingNotes === email.id}
                    onEditNotes={() => {
                      setEditingNotes(email.id);
                      setNotesText(email.notes || '');
                    }}
                    onSaveNotes={() => updateNotes(email.id)}
                    onCancelNotes={() => setEditingNotes(null)}
                    notesText={notesText}
                    onNotesChange={setNotesText}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Email Item Component
interface EmailItemProps {
  email: EmailFolderItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleStar: () => void;
  onRemove: () => void;
  isEditingNotes: boolean;
  onEditNotes: () => void;
  onSaveNotes: () => void;
  onCancelNotes: () => void;
  notesText: string;
  onNotesChange: (text: string) => void;
}

function EmailItem({
  email,
  isExpanded,
  onToggleExpand,
  onToggleStar,
  onRemove,
  isEditingNotes,
  onEditNotes,
  onSaveNotes,
  onCancelNotes,
  notesText,
  onNotesChange
}: EmailItemProps) {
  return (
    <div className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        {/* Star */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar();
          }}
        >
          {email.is_starred ? (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          ) : (
            <StarOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggleExpand}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">
              {email.email_subject || '(ללא נושא)'}
            </span>
            {email.folder && (
              <Badge 
                variant="outline" 
                className="shrink-0 text-xs"
                style={{ borderColor: email.folder.color, color: email.folder.color }}
              >
                {email.folder.name}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{email.email_from || 'לא ידוע'}</span>
          </div>

          {email.email_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(email.email_date), 'dd/MM/yyyy HH:mm', { locale: he })}
            </div>
          )}

          {email.notes && !isExpanded && (
            <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
              <StickyNote className="h-3 w-3" />
              יש הערות
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onToggleExpand}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>הצג פרטים</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>הסר מייל מהתיקייה?</AlertDialogTitle>
                <AlertDialogDescription>
                  המייל יוסר מתיקיית הלקוח. פעולה זו אינה מוחקת את המייל עצמו.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove} className="bg-red-500 hover:bg-red-600">
                  הסר
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t space-y-3">
          {/* Snippet */}
          {email.email_snippet && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
              {email.email_snippet}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1">
                <StickyNote className="h-4 w-4" />
                הערות
              </span>
              {!isEditingNotes && (
                <Button variant="ghost" size="sm" onClick={onEditNotes}>
                  {email.notes ? 'ערוך' : 'הוסף הערה'}
                </Button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notesText}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="הוסף הערות לגבי המייל..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={onSaveNotes}>שמור</Button>
                  <Button size="sm" variant="outline" onClick={onCancelNotes}>ביטול</Button>
                </div>
              </div>
            ) : email.notes ? (
              <div className="text-sm bg-blue-50 rounded p-2 whitespace-pre-wrap">
                {email.notes}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">אין הערות</p>
            )}
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground">
            סווג: {email.added_at ? format(new Date(email.added_at), 'dd/MM/yyyy HH:mm', { locale: he }) : '-'}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientEmailsTab;
