// Client Portal - Messages Page with File Attachments
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Send, Paperclip, Image, FileText, X, Download, ZoomIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PortalNavigation from '@/components/client-portal/PortalNavigation';

interface MessageAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
  attachments?: MessageAttachment[];
  metadata?: { attachments?: MessageAttachment[] };
}

export default function ClientMessages() {
  const { user, isClient, isLoading, clientId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    } else if (!isLoading && user && !isClient) {
      navigate('/');
    }
  }, [isLoading, user, isClient, navigate]);

  useEffect(() => {
    if (clientId) {
      fetchMessages();
      markMessagesAsRead();
      const unsubscribe = subscribeToMessages();
      return unsubscribe;
    }
  }, [clientId]);

  const fetchMessages = async () => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Parse attachments from metadata if exists
      const messagesWithAttachments = (data || []).map(msg => ({
        ...msg,
        attachments: (msg as any).metadata?.attachments || []
      }));
      
      setMessages(messagesWithAttachments);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!clientId) return;
    
    await supabase
      .from('client_messages')
      .update({ is_read: true })
      .eq('client_id', clientId)
      .eq('sender_type', 'staff')
      .eq('is_read', false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('client-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_messages',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          const newMsg = {
            ...payload.new as Message,
            attachments: (payload.new as any).metadata?.attachments || []
          };
          setMessages(prev => [...prev, newMsg]);
          // Mark as read if from staff
          if (newMsg.sender_type === 'staff') {
            supabase
              .from('client_messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Calculate unread count
  useEffect(() => {
    const count = messages.filter(m => !m.is_read && m.sender_type === 'staff').length;
    setUnreadCount(count);
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      // Max 10MB per file
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'קובץ גדול מדי',
          description: `${file.name} גדול מ-10MB`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<MessageAttachment[]> => {
    if (!clientId || selectedFiles.length === 0) return [];

    const uploadedFiles: MessageAttachment[] = [];

    for (const file of selectedFiles) {
      try {
        const fileName = `${clientId}/messages/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('client-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('client-files')
          .getPublicUrl(fileName);

        uploadedFiles.push({
          id: crypto.randomUUID(),
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size
        });
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    return uploadedFiles;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || !clientId || !user) return;

    setSending(true);
    setUploading(selectedFiles.length > 0);
    
    try {
      // Upload files if any
      const attachments = await uploadFiles();

      const { error } = await supabase
        .from('client_messages')
        .insert({
          client_id: clientId,
          sender_id: user.id,
          sender_type: 'client',
          message: newMessage.trim() || (attachments.length > 0 ? '📎 קבצים מצורפים' : ''),
          is_read: false,
          metadata: attachments.length > 0 ? { attachments } : null
        });

      if (error) throw error;
      
      setNewMessage('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשלוח את ההודעה',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const isImageFile = (fileType: string) => {
    return fileType?.startsWith('image/');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold text-right flex-1">הודעות</h1>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col mx-2 my-2 border-0 shadow-none bg-transparent">
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 px-2" ref={scrollRef}>
              <div className="space-y-3 py-4">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    אין הודעות עדיין. התחל שיחה חדשה!
                  </p>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'client' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          message.sender_type === 'client'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {/* Message Text */}
                        {message.message && !message.message.startsWith('📎') && (
                          <p className="whitespace-pre-wrap text-right">{message.message}</p>
                        )}
                        
                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id} className="rounded-lg overflow-hidden">
                                {isImageFile(attachment.file_type) ? (
                                  // Image Preview
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <div className="cursor-pointer relative group">
                                        <img
                                          src={attachment.file_url}
                                          alt={attachment.file_name}
                                          className="max-w-full max-h-48 rounded-lg object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                          <ZoomIn className="h-8 w-8 text-white" />
                                        </div>
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl">
                                      <img
                                        src={attachment.file_url}
                                        alt={attachment.file_name}
                                        className="w-full h-auto max-h-[80vh] object-contain"
                                      />
                                    </DialogContent>
                                  </Dialog>
                                ) : (
                                  // File Attachment
                                  <a
                                    href={attachment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded-lg ${
                                      message.sender_type === 'client'
                                        ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
                                        : 'bg-background hover:bg-background/80'
                                    } transition-colors`}
                                  >
                                    <FileText className="h-5 w-5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                                      <p className="text-xs opacity-70">{formatFileSize(attachment.file_size)}</p>
                                    </div>
                                    <Download className="h-4 w-4 shrink-0" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Time */}
                        <p className={`text-xs mt-1 text-left ${
                          message.sender_type === 'client' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="px-3 py-2 border-t bg-muted/30">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative shrink-0">
                      {file.type.startsWith('image/') ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex flex-col items-center justify-center p-1">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground truncate w-full text-center mt-1">
                            {file.name.split('.').pop()?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => removeSelectedFile(index)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t bg-card flex gap-2 items-end mb-16">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="shrink-0"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="כתוב הודעה..."
                disabled={sending}
                className="flex-1 text-right"
                dir="rtl"
              />
              
              <Button 
                type="submit" 
                disabled={sending || (!newMessage.trim() && selectedFiles.length === 0)}
                size="icon"
                className="shrink-0"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <PortalNavigation unreadMessages={unreadCount} />
    </div>
  );
}
