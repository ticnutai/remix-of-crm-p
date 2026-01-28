import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  MessageCircle,
  Plus,
  X,
  Users,
  Send,
  Loader2,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  type: 'task' | 'meeting' | 'invoice' | 'reminder';
}

export function ShareDialog({ open, onOpenChange, title, content, type }: ShareDialogProps) {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [shareMethod, setShareMethod] = useState<'email' | 'whatsapp'>('email');
  
  // Selected recipients
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  
  // Manual input
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  
  // Message
  const [message, setMessage] = useState('');

  const typeLabels: Record<string, string> = {
    task: 'משימה',
    meeting: 'פגישה',
    invoice: 'חשבונית',
    reminder: 'תזכורת',
  };

  useEffect(() => {
    if (open) {
      fetchClients();
      setMessage(`שלום,\n\nמצורפים פרטי ${typeLabels[type]}:\n\n${title}\n\n${content}\n\nבברכה`);
    }
  }, [open, title, content, type]);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clients')
      .select('id, name, email, phone, whatsapp')
      .order('name');
    if (data) {
      setClients(data);
    }
    setLoading(false);
  };

  const toggleEmail = (email: string) => {
    setSelectedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const togglePhone = (phone: string) => {
    setSelectedPhones(prev =>
      prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
    );
  };

  const addManualEmail = () => {
    if (manualEmail && !selectedEmails.includes(manualEmail)) {
      setSelectedEmails(prev => [...prev, manualEmail]);
      setManualEmail('');
    }
  };

  const addManualPhone = () => {
    if (manualPhone && !selectedPhones.includes(manualPhone)) {
      setSelectedPhones(prev => [...prev, manualPhone]);
      setManualPhone('');
    }
  };

  const removeEmail = (email: string) => {
    setSelectedEmails(prev => prev.filter(e => e !== email));
  };

  const removePhone = (phone: string) => {
    setSelectedPhones(prev => prev.filter(p => p !== phone));
  };

  const handleSendEmail = async () => {
    if (selectedEmails.length === 0) {
      toast({ title: 'נא לבחור לפחות נמען אחד', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      for (const email of selectedEmails) {
        await supabase.functions.invoke('send-reminder-email', {
          body: {
            to: email,
            title: `${typeLabels[type]}: ${title}`,
            message: message,
          },
        });
      }
      toast({ title: 'המייל נשלח בהצלחה!' });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({ title: 'שגיאה בשליחת המייל', variant: 'destructive' });
    }
    setSending(false);
  };

  const handleSendWhatsApp = () => {
    if (selectedPhones.length === 0) {
      toast({ title: 'נא לבחור לפחות נמען אחד', variant: 'destructive' });
      return;
    }

    // Open WhatsApp for each phone
    selectedPhones.forEach((phone, index) => {
      const cleanPhone = phone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('972') ? cleanPhone : `972${cleanPhone.replace(/^0/, '')}`;
      const encodedMessage = encodeURIComponent(message);
      const url = `https://wa.me/${fullPhone}?text=${encodedMessage}`;
      
      setTimeout(() => {
        window.open(url, '_blank');
      }, index * 500);
    });

    toast({ title: 'נפתח וואטסאפ לשליחה' });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedEmails([]);
    setSelectedPhones([]);
    setManualEmail('');
    setManualPhone('');
    setMessage('');
  };

  const recipients = shareMethod === 'email' ? selectedEmails : selectedPhones;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            שליחת {typeLabels[type]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Method Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={shareMethod === 'email' ? 'default' : 'outline'}
              onClick={() => setShareMethod('email')}
              className="flex-1 gap-2"
            >
              <Mail className="h-4 w-4" />
              אימייל
            </Button>
            <Button
              type="button"
              variant={shareMethod === 'whatsapp' ? 'default' : 'outline'}
              onClick={() => setShareMethod('whatsapp')}
              className="flex-1 gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              וואטסאפ
            </Button>
          </div>

          {/* Selected Recipients */}
          {recipients.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
              {recipients.map((recipient) => (
                <Badge key={recipient} variant="secondary" className="gap-1 pr-1">
                  {recipient}
                  <button
                    onClick={() => shareMethod === 'email' ? removeEmail(recipient) : removePhone(recipient)}
                    className="hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Client List */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              בחירה מרשימת לקוחות
            </Label>
            <ScrollArea className="h-40 border rounded-lg p-2">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-1">
                  {clients.map((client) => {
                    const value = shareMethod === 'email' ? client.email : (client.whatsapp || client.phone);
                    if (!value) return null;
                    
                    const isSelected = shareMethod === 'email'
                      ? selectedEmails.includes(value)
                      : selectedPhones.includes(value);

                    return (
                      <div
                        key={client.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                          isSelected ? "bg-primary/10" : "hover:bg-muted"
                        )}
                        onClick={() => shareMethod === 'email' ? toggleEmail(value) : togglePhone(value)}
                      >
                        <Checkbox checked={isSelected} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{client.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {shareMethod === 'email' ? (
                              <><Mail className="h-3 w-3" /> {value}</>
                            ) : (
                              <><Phone className="h-3 w-3" /> {value}</>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <Label>הוספה ידנית</Label>
            <div className="flex gap-2">
              {shareMethod === 'email' ? (
                <Input
                  type="email"
                  placeholder="הזן כתובת אימייל"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualEmail())}
                />
              ) : (
                <Input
                  type="tel"
                  placeholder="הזן מספר טלפון"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualPhone())}
                />
              )}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={shareMethod === 'email' ? addManualEmail : addManualPhone}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>הודעה</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              onClick={shareMethod === 'email' ? handleSendEmail : handleSendWhatsApp}
              disabled={sending || recipients.length === 0}
              className="flex-1 gap-2"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : shareMethod === 'email' ? (
                <Mail className="h-4 w-4" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              {shareMethod === 'email' ? 'שלח אימייל' : 'שלח בוואטסאפ'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
