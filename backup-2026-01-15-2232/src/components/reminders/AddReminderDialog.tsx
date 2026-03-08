import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Plus, Volume2, Upload, X, Mail, MessageSquare, Phone } from 'lucide-react';
import { useReminders, ReminderInsert } from '@/hooks/useReminders';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddReminderDialogProps {
  entityType?: string;
  entityId?: string;
  trigger?: React.ReactNode;
}

const reminderTypes = [
  { value: 'browser', label: '🔔 התראת דפדפן', icon: Bell },
  { value: 'popup', label: '📢 חלון קופץ', icon: Bell },
  { value: 'email', label: '📧 אימייל', icon: Mail },
  { value: 'voice', label: '🔊 הקראה קולית', icon: Volume2 },
  { value: 'sms', label: '💬 SMS', icon: MessageSquare },
  { value: 'whatsapp', label: '📱 וואטסאפ', icon: Phone },
];

const recurringOptions = [
  { value: 'none', label: 'ללא (פעם אחת)' },
  { value: 'daily', label: 'יומי' },
  { value: 'weekly', label: 'שבועי' },
  { value: 'monthly', label: 'חודשי' },
  { value: 'custom', label: 'מותאם אישית' },
];

const RINGTONES = [
  { id: 'default', name: 'ברירת מחדל', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { id: 'chime', name: 'צליל פעמון', url: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3' },
  { id: 'bell', name: 'פעמון קלאסי', url: 'https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3' },
  { id: 'alert', name: 'התראה חדה', url: 'https://assets.mixkit.co/active_storage/sfx/2872/2872-preview.mp3' },
  { id: 'notification', name: 'נוטיפיקציה', url: 'https://assets.mixkit.co/active_storage/sfx/1518/1518-preview.mp3' },
  { id: 'gentle', name: 'עדין', url: 'https://assets.mixkit.co/active_storage/sfx/2873/2873-preview.mp3' },
  { id: 'urgent', name: 'דחוף', url: 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3' },
  { id: 'melody', name: 'מלודי', url: 'https://assets.mixkit.co/active_storage/sfx/2875/2875-preview.mp3' },
  { id: 'digital', name: 'דיגיטלי', url: 'https://assets.mixkit.co/active_storage/sfx/2876/2876-preview.mp3' },
  { id: 'soft', name: 'רך ונעים', url: 'https://assets.mixkit.co/active_storage/sfx/2877/2877-preview.mp3' },
];

export function AddReminderDialog({ entityType, entityId, trigger }: AddReminderDialogProps) {
  const [open, setOpen] = useState(false);
  const { createReminder } = useReminders();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [clients, setClients] = useState<{ id: string; name: string; email: string | null; phone: string | null; whatsapp: string | null }[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['browser']);
  const [selectedRingtone, setSelectedRingtone] = useState('default');
  const [customRingtoneUrl, setCustomRingtoneUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    message: '',
    remind_at: '',
    is_recurring: false,
    recurring_interval: 'none',
    recurring_count: 1,
    recipient_emails: [] as string[],
    recipient_phones: [] as string[],
    manual_email: '',
    manual_phone: '',
    send_whatsapp: false,
    send_sms: false,
  });

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, name, email, phone, whatsapp')
        .order('name');
      if (data) setClients(data);
    };
    if (open) fetchClients();
  }, [open]);

  const toggleReminderType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const playRingtone = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(url);
    audioRef.current.play();
  };

  const handleUploadRingtone = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({ title: 'שגיאה', description: 'יש להעלות קובץ אודיו בלבד', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'שגיאה', description: 'יש להתחבר קודם', variant: 'destructive' });
      setIsUploading(false);
      return;
    }

    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('ringtones')
      .upload(fileName, file);

    if (error) {
      toast({ title: 'שגיאה', description: 'לא הצלחנו להעלות את הקובץ', variant: 'destructive' });
    } else {
      const { data: { publicUrl } } = supabase.storage.from('ringtones').getPublicUrl(fileName);
      setCustomRingtoneUrl(publicUrl);
      setSelectedRingtone('custom');
      toast({ title: 'הועלה בהצלחה', description: 'הרינגטון שלך נשמר' });
    }
    
    setIsUploading(false);
  };

  const addRecipientEmail = (email: string) => {
    if (email && !form.recipient_emails.includes(email)) {
      setForm(prev => ({ ...prev, recipient_emails: [...prev.recipient_emails, email] }));
    }
  };

  const removeRecipientEmail = (email: string) => {
    setForm(prev => ({ ...prev, recipient_emails: prev.recipient_emails.filter(e => e !== email) }));
  };

  const addRecipientPhone = (phone: string) => {
    if (phone && !form.recipient_phones.includes(phone)) {
      setForm(prev => ({ ...prev, recipient_phones: [...prev.recipient_phones, phone] }));
    }
  };

  const removeRecipientPhone = (phone: string) => {
    setForm(prev => ({ ...prev, recipient_phones: prev.recipient_phones.filter(p => p !== phone) }));
  };

  const addManualEmail = () => {
    if (form.manual_email && form.manual_email.includes('@')) {
      addRecipientEmail(form.manual_email);
      setForm(prev => ({ ...prev, manual_email: '' }));
    }
  };

  const addManualPhone = () => {
    if (form.manual_phone) {
      addRecipientPhone(form.manual_phone);
      setForm(prev => ({ ...prev, manual_phone: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const reminderData: any = {
      title: form.title,
      message: form.message,
      remind_at: new Date(form.remind_at).toISOString(),
      reminder_type: selectedTypes[0] || 'browser', // Keep for backward compatibility
      reminder_types: selectedTypes,
      entity_type: entityType || null,
      entity_id: entityId || null,
      is_recurring: form.is_recurring,
      recurring_interval: form.recurring_interval !== 'none' ? form.recurring_interval : null,
      recurring_count: form.recurring_count,
      ringtone: selectedRingtone,
      custom_ringtone_url: customRingtoneUrl,
      recipient_emails: form.recipient_emails,
      recipient_phones: form.recipient_phones,
      send_whatsapp: form.send_whatsapp || selectedTypes.includes('whatsapp'),
      send_sms: form.send_sms || selectedTypes.includes('sms'),
    };
    
    await createReminder(reminderData);
    
    // Reset form
    setForm({
      title: '',
      message: '',
      remind_at: '',
      is_recurring: false,
      recurring_interval: 'none',
      recurring_count: 1,
      recipient_emails: [],
      recipient_phones: [],
      manual_email: '',
      manual_phone: '',
      send_whatsapp: false,
      send_sms: false,
    });
    setSelectedTypes(['browser']);
    setSelectedRingtone('default');
    setCustomRingtoneUrl(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            הוסף תזכורת
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[hsl(45,80%,45%)]" />
            תזכורת חדשה
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div>
              <Label>כותרת *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="תזכורת לפגישה..."
                required
              />
            </div>
            
            <div>
              <Label>מתי להזכיר *</Label>
              <Input
                type="datetime-local"
                value={form.remind_at}
                onChange={(e) => setForm({ ...form, remind_at: e.target.value })}
                required
              />
            </div>

            {/* Multiple Reminder Types */}
            <div>
              <Label className="mb-2 block">סוגי התראה (ניתן לבחור כמה)</Label>
              <div className="flex flex-wrap gap-2">
                {reminderTypes.map(type => (
                  <Badge
                    key={type.value}
                    variant={selectedTypes.includes(type.value) ? 'default' : 'outline'}
                    className="cursor-pointer py-2 px-3 text-sm"
                    onClick={() => toggleReminderType(type.value)}
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recurring Options */}
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="recurring"
                  checked={form.is_recurring}
                  onCheckedChange={(checked) => setForm({ ...form, is_recurring: !!checked })}
                />
                <Label htmlFor="recurring">תזכורת חוזרת</Label>
              </div>
              
              {form.is_recurring && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label>תדירות</Label>
                    <Select
                      value={form.recurring_interval}
                      onValueChange={(value) => setForm({ ...form, recurring_interval: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {recurringOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>מספר פעמים</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={form.recurring_count}
                      onChange={(e) => setForm({ ...form, recurring_count: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Ringtone Selection */}
            <div className="space-y-3 rounded-lg border p-4">
              <Label className="block">בחר רינגטון</Label>
              <div className="grid grid-cols-2 gap-2">
                {RINGTONES.map(ringtone => (
                  <div
                    key={ringtone.id}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedRingtone === ringtone.id ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedRingtone(ringtone.id)}
                  >
                    <span className="text-sm">{ringtone.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        playRingtone(ringtone.url);
                      }}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {/* Custom ringtone */}
                <div
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedRingtone === 'custom' ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="text-sm flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {customRingtoneUrl ? 'רינגטון מותאם' : 'העלה רינגטון'}
                  </span>
                  {customRingtoneUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        playRingtone(customRingtoneUrl);
                      }}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleUploadRingtone}
              />
              {isUploading && <p className="text-sm text-muted-foreground">מעלה...</p>}
            </div>

            {/* Recipients - Email */}
            {(selectedTypes.includes('email')) && (
              <div className="space-y-3 rounded-lg border p-4">
                <Label className="block">נמענים לאימייל</Label>
                
                {/* Selected emails */}
                <div className="flex flex-wrap gap-2">
                  {form.recipient_emails.map(email => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeRecipientEmail(email)} />
                    </Badge>
                  ))}
                </div>
                
                {/* Client emails dropdown */}
                <Select onValueChange={(value) => addRecipientEmail(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מהלקוחות..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.filter(c => c.email).map(client => (
                      <SelectItem key={client.id} value={client.email!}>
                        {client.name} - {client.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Manual email input */}
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={form.manual_email}
                    onChange={(e) => setForm({ ...form, manual_email: e.target.value })}
                    placeholder="הזן אימייל ידנית..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualEmail())}
                  />
                  <Button type="button" variant="outline" onClick={addManualEmail}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Recipients - Phone (SMS/WhatsApp) */}
            {(selectedTypes.includes('sms') || selectedTypes.includes('whatsapp')) && (
              <div className="space-y-3 rounded-lg border p-4">
                <Label className="block">נמענים ל-SMS / וואטסאפ</Label>
                
                {/* Selected phones */}
                <div className="flex flex-wrap gap-2">
                  {form.recipient_phones.map(phone => (
                    <Badge key={phone} variant="secondary" className="gap-1">
                      {phone}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeRecipientPhone(phone)} />
                    </Badge>
                  ))}
                </div>
                
                {/* Client phones dropdown */}
                <Select onValueChange={(value) => addRecipientPhone(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מהלקוחות..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.filter(c => c.phone || c.whatsapp).map(client => (
                      <SelectItem key={client.id} value={client.phone || client.whatsapp || ''}>
                        {client.name} - {client.phone || client.whatsapp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Manual phone input */}
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value={form.manual_phone}
                    onChange={(e) => setForm({ ...form, manual_phone: e.target.value })}
                    placeholder="הזן מספר טלפון ידנית..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualPhone())}
                  />
                  <Button type="button" variant="outline" onClick={addManualPhone}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label>הודעה (אופציונלי)</Label>
              <Textarea
                value={form.message || ''}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="פרטים נוספים..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 gap-2">
                <Plus className="h-4 w-4" />
                צור תזכורת
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                ביטול
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
