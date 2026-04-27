import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Bell, Plus, Volume2, Upload, X, Mail, MessageSquare, Phone, UserPlus, Search, Loader2, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import { he } from 'date-fns/locale';
import { useReminders, ReminderInsert } from '@/hooks/useReminders';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { useDialogTheme, DialogThemeSwitcher, useDialogResize, ResizeHandles } from "@/components/shared/DialogThemeSwitcher";

// Dynamic sidebar colors based on theme
function getSidebarColors(theme: ReturnType<typeof useDialogTheme>['theme']) {
  return {
    navy: theme.background,
    gold: theme.border,
    goldLight: theme.label,
    goldDark: theme.buttonBorder,
    navyLight: theme.inputBg,
    navyDark: theme.background,
  };
}

// Readable input/trigger style: white bg + dark text + gold border (fixes "text swallowed" issue)
const brandedInputStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderColor: '#d8ac27',
  color: '#0F1F3D',
};
const brandedInputClass = 'placeholder:text-slate-400';

interface AddReminderDialogProps {
  entityType?: string;
  entityId?: string;
  trigger?: React.ReactNode;
  initialValues?: {
    title?: string;
    message?: string;
    remind_at?: string;
    client_id?: string;
  };
}

const reminderTypes = [
  { value: 'browser', label: '🔔 דפדפן', icon: Bell },
  { value: 'popup', label: '📢 קופץ', icon: Bell },
  { value: 'email', label: '📧 אימייל', icon: Mail },
  { value: 'voice', label: '🔊 קולי', icon: Volume2 },
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

export function AddReminderDialog({ entityType, entityId, trigger, initialValues }: AddReminderDialogProps) {
  const { themeId, theme, setThemeId } = useDialogTheme();
  const sidebarColors = getSidebarColors(theme);
  const { size, containerRef, startResize } = useDialogResize(500);
  const [open, setOpen] = useState(false);
  const { createReminder } = useReminders();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [clients, setClients] = useState<{ id: string; name: string; email: string | null; phone: string | null; whatsapp: string | null }[]>([]);
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [isClientPickerOpen, setIsClientPickerOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['browser']);
  const [selectedRingtone, setSelectedRingtone] = useState('default');
  const [customRingtoneUrl, setCustomRingtoneUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReminderCalendarOpen, setIsReminderCalendarOpen] = useState(false);
  const [reminderDateText, setReminderDateText] = useState('');
  const [reminderTimeText, setReminderTimeText] = useState('');
  const [reminderDateError, setReminderDateError] = useState<string | null>(null);

  // Parse manual date input
  const parseManualDate = (value: string): Date | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const dmy = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (dmy) {
      const [, d, m, y] = dmy;
      const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
      const dt = new Date(year, parseInt(m, 10) - 1, parseInt(d, 10));
      if (!isNaN(dt.getTime())) return dt;
    }
    const ymd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymd) {
      const [, y, m, d] = ymd;
      const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      if (!isNaN(dt.getTime())) return dt;
    }
    return null;
  };

  // Combine date+time text into the form.remind_at (datetime-local format YYYY-MM-DDTHH:mm)
  const updateRemindAt = (dateStr: string, timeStr: string) => {
    const parsedDate = parseManualDate(dateStr);
    const timeMatch = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!parsedDate) {
      setReminderDateError(dateStr.trim() ? 'תאריך לא תקין: יום/חודש/שנה' : 'יש להזין תאריך');
      return;
    }
    if (!timeMatch) {
      setReminderDateError('שעה לא תקינה (HH:MM)');
      return;
    }
    setReminderDateError(null);
    const hh = timeMatch[1].padStart(2, '0');
    const mm = timeMatch[2];
    const yyyy = parsedDate.getFullYear();
    const MM = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(parsedDate.getDate()).padStart(2, '0');
    setForm((f) => ({ ...f, remind_at: `${yyyy}-${MM}-${dd}T${hh}:${mm}` }));
  };

  const handleReminderDateChange = (value: string) => {
    setReminderDateText(value);
    updateRemindAt(value, reminderTimeText || '09:00');
    if (!reminderTimeText) setReminderTimeText('09:00');
  };

  const handleReminderTimeChange = (value: string) => {
    setReminderTimeText(value);
    if (reminderDateText) updateRemindAt(reminderDateText, value);
  };

  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
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
    
    const fetchEmailTemplates = async () => {
      const { data } = await supabase
        .from('email_templates')
        .select('*')
        .order('is_default', { ascending: false });
      if (data) setEmailTemplates(data);
    };
    
    if (open) {
      fetchClients();
      fetchEmailTemplates();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !initialValues) return;

    setForm((prev) => ({
      ...prev,
      title: initialValues.title ?? prev.title,
      message: initialValues.message ?? prev.message,
      remind_at: initialValues.remind_at ?? prev.remind_at,
    }));

    if (initialValues.remind_at) {
      const dt = new Date(initialValues.remind_at);
      if (!isNaN(dt.getTime())) {
        setReminderDateText(format(dt, 'dd/MM/yyyy'));
        setReminderTimeText(format(dt, 'HH:mm'));
        setReminderDateError(null);
      }
    }

    if (initialValues.client_id) {
      setClientIds([initialValues.client_id]);
    }
  }, [open, initialValues]);

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

  const toggleClient = (id: string) => {
    setClientIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const removeClient = (id: string) => {
    setClientIds(prev => prev.filter(c => c !== id));
  };

  const selectedClients = clients.filter(c => clientIds.includes(c.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const reminderData: any = {
        title: form.title,
        message: form.message,
        remind_at: new Date(form.remind_at).toISOString(),
        reminder_type: selectedTypes[0] || 'browser',
        reminder_types: selectedTypes,
        entity_type: entityType || null,
        entity_id: entityId || null,
        client_id: clientIds.length > 0 ? clientIds[0] : null,
        is_recurring: form.is_recurring,
        recurring_interval: form.recurring_interval !== 'none' ? form.recurring_interval : null,
        recurring_count: form.recurring_count,
        ringtone: selectedRingtone,
        custom_ringtone_url: customRingtoneUrl,
        recipient_emails: form.recipient_emails,
        recipient_phones: form.recipient_phones,
        send_whatsapp: form.send_whatsapp || selectedTypes.includes('whatsapp'),
        send_sms: form.send_sms || selectedTypes.includes('sms'),
        email_template_id: selectedTemplate,
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
      setClientIds([]);
      setClientSearch('');
      setReminderDateText('');
      setReminderTimeText('');
      setReminderDateError(null);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            הוסף תזכורת
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        ref={containerRef}
        dialogKey="add-reminder"
        className="p-0 overflow-visible navy-gold-dialog"
        dir="rtl"
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        style={{
          background: theme.backgroundGradient,
          border: `2px solid ${theme.border}`,
          width: `${size.width}px`,
          maxWidth: '90vw',
          ...(size.height ? { height: `${size.height}px`, maxHeight: '90vh' } : {}),
        }}
      >
        <ResizeHandles onResize={startResize} />
        <DialogHeader
          className="px-5 pt-5 pb-3"
          style={{ borderBottom: `1px solid ${theme.headerBorder}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ background: theme.iconBg }}
            >
              <Bell className="h-5 w-5" style={{ color: theme.iconColor }} />
            </div>
            <DialogTitle
              className="text-lg font-bold flex-1"
              style={{ color: theme.title }}
            >
              תזכורת חדשה
            </DialogTitle>
            <DialogThemeSwitcher currentTheme={themeId} onThemeChange={setThemeId} />
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 gold-scrollbar">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: sidebarColors.goldLight }}>
                כותרת *
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="תזכורת לפגישה..."
                required
                className={cn("text-right", brandedInputClass)}
                style={brandedInputStyle}
                autoFocus
              />
            </div>
            
            {/* Remind At - Manual date + time + Broad calendar */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: sidebarColors.goldLight }}>
                מתי להזכיר *
              </Label>
              <div className="flex gap-2">
                {/* Manual date input */}
                <Input
                  value={reminderDateText}
                  onChange={(e) => handleReminderDateChange(e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className={cn('flex-1 text-right', brandedInputClass)}
                  style={brandedInputStyle}
                  inputMode="numeric"
                  dir="ltr"
                />
                {/* Manual time input */}
                <Input
                  value={reminderTimeText}
                  onChange={(e) => handleReminderTimeChange(e.target.value)}
                  placeholder="HH:MM"
                  className={cn('w-24 text-right', brandedInputClass)}
                  style={brandedInputStyle}
                  inputMode="numeric"
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="px-3 gap-2 shrink-0"
                  style={{ ...brandedInputStyle, color: sidebarColors.navyDark }}
                  title="בחר מלוח שנה"
                  onClick={() => setIsReminderCalendarOpen((v) => !v)}
                  aria-expanded={isReminderCalendarOpen}
                >
                  <CalendarIcon className="h-4 w-4" style={{ color: sidebarColors.gold }} />
                  <span className="text-xs">לוח</span>
                </Button>
              </div>
              {isReminderCalendarOpen && (
                <div
                  className="mt-3 w-[340px] max-w-full min-w-[300px] max-h-[48vh] resize overflow-auto rounded-lg border-2 bg-background p-2 shadow-xl"
                  style={{ borderColor: sidebarColors.gold }}
                  data-no-drag
                >
                  <Calendar
                    mode="single"
                    selected={form.remind_at ? new Date(form.remind_at) : undefined}
                    onSelect={(d) => {
                      if (!d) return;
                      const dateStr = format(d, 'dd/MM/yyyy');
                      setReminderDateText(dateStr);
                      const tStr = reminderTimeText || '09:00';
                      setReminderTimeText(tStr);
                      updateRemindAt(dateStr, tStr);
                      setIsReminderCalendarOpen(false);
                    }}
                    locale={he}
                    captionLayout="dropdown-buttons"
                    fromYear={2000}
                    toYear={2100}
                    showOutsideDays
                    initialFocus
                    className="p-2 pointer-events-auto"
                  />
                </div>
              )}
              {reminderDateError && (
                <p className="text-xs" style={{ color: '#ef4444' }}>{reminderDateError}</p>
              )}
              {form.remind_at && !reminderDateError && (
                <p className="text-xs" style={{ color: sidebarColors.goldLight }}>
                  {format(new Date(form.remind_at), 'EEEE, d בMMMM yyyy בשעה HH:mm', { locale: he })}
                </p>
              )}
            </div>

            {/* Client Assignment - Multi Select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: sidebarColors.goldLight }}>
                שיוך ללקוחות
              </Label>
              {selectedClients.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedClients.map(client => (
                    <div
                      key={client.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: `${sidebarColors.gold}20`,
                        border: `1px solid ${sidebarColors.gold}50`,
                        color: sidebarColors.goldLight,
                      }}
                    >
                      <span>{client.name}</span>
                      <button
                        type="button"
                        onClick={() => removeClient(client.id)}
                        className="p-0.5 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Popover open={isClientPickerOpen} onOpenChange={setIsClientPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2"
                    style={{
                      ...brandedInputStyle,
                      color: selectedClients.length > 0 ? sidebarColors.navyDark : '#64748b',
                    }}
                  >
                    <UserPlus className="h-4 w-4 ml-auto" style={{ color: sidebarColors.gold }} />
                    {selectedClients.length > 0 ? `${selectedClients.length} לקוחות נבחרו — הוסף עוד` : "בחר לקוח או איש קשר"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[320px] p-0 overflow-hidden"
                  align="start"
                  style={{
                    background: sidebarColors.navy,
                    border: `1px solid ${sidebarColors.gold}40`,
                  }}
                >
                  <div className="p-2 border-b" style={{ borderColor: `${sidebarColors.gold}30` }}>
                    <div className="relative">
                      <Search className="absolute right-2.5 top-2.5 h-4 w-4" style={{ color: `${sidebarColors.goldLight}60` }} />
                      <Input
                        placeholder="חיפוש לקוח..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className={cn("pr-9 text-right text-sm", brandedInputClass)}
                        style={brandedInputStyle}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1 gold-scrollbar">
                    {clients
                      .filter(c =>
                        !clientSearch ||
                        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                        c.email?.toLowerCase().includes(clientSearch.toLowerCase())
                      )
                      .map(client => {
                        const isSelected = clientIds.includes(client.id);
                        return (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => toggleClient(client.id)}
                            className={cn(
                              "w-full text-right px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                              isSelected ? "bg-white/15" : "hover:bg-white/10"
                            )}
                            style={{ color: sidebarColors.goldLight }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{
                                background: isSelected ? `${sidebarColors.gold}40` : `${sidebarColors.gold}25`,
                                color: sidebarColors.gold,
                              }}
                            >
                              {isSelected ? "✓" : client.name.charAt(0)}
                            </div>
                            <div className="flex-1 text-right">
                              <div className="font-medium">{client.name}</div>
                              {client.email && (
                                <div className="text-xs opacity-60">{client.email}</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    {clients.filter(c =>
                      !clientSearch ||
                      c.name.toLowerCase().includes(clientSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center py-4 text-sm" style={{ color: `${sidebarColors.goldLight}60` }}>
                        לא נמצאו לקוחות
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Reminder Types */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: sidebarColors.goldLight }}>
                סוגי התראה (ניתן לבחור כמה)
              </Label>
              <div className="flex flex-wrap gap-2">
                {reminderTypes.map(type => {
                  const isSelected = selectedTypes.includes(type.value);
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => toggleReminderType(type.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        isSelected ? "border-current" : "border-transparent"
                      )}
                      style={{
                        background: isSelected ? `${sidebarColors.gold}25` : `${sidebarColors.navyLight}50`,
                        color: isSelected ? sidebarColors.gold : `${sidebarColors.goldLight}80`,
                        borderColor: isSelected ? `${sidebarColors.gold}60` : 'transparent',
                      }}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recurring Options */}
            <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: `${sidebarColors.gold}30`, background: `${sidebarColors.navyLight}20` }}>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="recurring"
                  checked={form.is_recurring}
                  onCheckedChange={(checked) => setForm({ ...form, is_recurring: !!checked })}
                />
                <Label htmlFor="recurring" className="text-sm" style={{ color: sidebarColors.goldLight }}>
                  תזכורת חוזרת
                </Label>
              </div>
              
              {form.is_recurring && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1">
                    <Label className="text-xs" style={{ color: `${sidebarColors.goldLight}80` }}>תדירות</Label>
                    <Select
                      value={form.recurring_interval}
                      onValueChange={(value) => setForm({ ...form, recurring_interval: value })}
                    >
                      <SelectTrigger
                        style={brandedInputStyle}
                      >
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
                  <div className="space-y-1">
                    <Label className="text-xs" style={{ color: `${sidebarColors.goldLight}80` }}>מספר פעמים</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={form.recurring_count}
                      onChange={(e) => setForm({ ...form, recurring_count: parseInt(e.target.value) || 1 })}
                      style={brandedInputStyle}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Ringtone Selection */}
            <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: `${sidebarColors.gold}30`, background: `${sidebarColors.navyLight}20` }}>
              <Label className="text-sm font-medium" style={{ color: sidebarColors.goldLight }}>
                בחר רינגטון
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                {RINGTONES.map(ringtone => (
                  <div
                    key={ringtone.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors text-xs",
                    )}
                    style={{
                      background: selectedRingtone === ringtone.id ? `${sidebarColors.gold}20` : `${sidebarColors.navyLight}30`,
                      borderColor: selectedRingtone === ringtone.id ? `${sidebarColors.gold}50` : `${sidebarColors.gold}20`,
                      color: sidebarColors.goldLight,
                    }}
                    onClick={() => setSelectedRingtone(ringtone.id)}
                  >
                    <span>{ringtone.name}</span>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        playRingtone(ringtone.url);
                      }}
                    >
                      <Volume2 className="h-3.5 w-3.5" style={{ color: sidebarColors.gold }} />
                    </button>
                  </div>
                ))}
                
                {/* Custom ringtone */}
                <div
                  className="flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors text-xs col-span-2"
                  style={{
                    background: selectedRingtone === 'custom' ? `${sidebarColors.gold}20` : `${sidebarColors.navyLight}30`,
                    borderColor: selectedRingtone === 'custom' ? `${sidebarColors.gold}50` : `${sidebarColors.gold}20`,
                    color: sidebarColors.goldLight,
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="flex items-center gap-2">
                    <Upload className="h-3.5 w-3.5" />
                    {customRingtoneUrl ? 'רינגטון מותאם' : 'העלה רינגטון'}
                  </span>
                  {customRingtoneUrl && (
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        playRingtone(customRingtoneUrl);
                      }}
                    >
                      <Volume2 className="h-3.5 w-3.5" style={{ color: sidebarColors.gold }} />
                    </button>
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
              {isUploading && <p className="text-xs" style={{ color: `${sidebarColors.goldLight}60` }}>מעלה...</p>}
            </div>

            {/* Recipients - Email */}
            {(selectedTypes.includes('email')) && (
              <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: `${sidebarColors.gold}30`, background: `${sidebarColors.navyLight}20` }}>
                <Label className="text-sm font-medium" style={{ color: sidebarColors.goldLight }}>נמענים לאימייל</Label>
                
                {emailTemplates.length > 0 && (
                  <div>
                    <Label className="text-xs mb-1 block" style={{ color: `${sidebarColors.goldLight}80` }}>תבנית אימייל (אופציונלי)</Label>
                    <Select value={selectedTemplate || 'none'} onValueChange={(value) => setSelectedTemplate(value === 'none' ? null : value)}>
                      <SelectTrigger style={brandedInputStyle}>
                        <SelectValue placeholder="בחר תבנית" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">ברירת מחדל</SelectItem>
                        {emailTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} {template.is_default && '⭐'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1.5">
                  {form.recipient_emails.map(email => (
                    <div key={email} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: `${sidebarColors.gold}20`, color: sidebarColors.goldLight }}>
                      {email}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeRecipientEmail(email)} />
                    </div>
                  ))}
                </div>
                
                <Select onValueChange={(value) => addRecipientEmail(value)}>
                  <SelectTrigger style={brandedInputStyle}>
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
                
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={form.manual_email}
                    onChange={(e) => setForm({ ...form, manual_email: e.target.value })}
                    placeholder="הזן אימייל ידנית..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualEmail())}
                    className={brandedInputClass}
                    style={brandedInputStyle}
                  />
                  <Button type="button" variant="outline" onClick={addManualEmail} style={{ borderColor: `${sidebarColors.gold}40`, color: sidebarColors.gold }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Recipients - Phone (SMS/WhatsApp) */}
            {(selectedTypes.includes('sms') || selectedTypes.includes('whatsapp')) && (
              <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: `${sidebarColors.gold}30`, background: `${sidebarColors.navyLight}20` }}>
                <Label className="text-sm font-medium" style={{ color: sidebarColors.goldLight }}>נמענים ל-SMS / וואטסאפ</Label>
                
                <div className="flex flex-wrap gap-1.5">
                  {form.recipient_phones.map(phone => (
                    <div key={phone} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: `${sidebarColors.gold}20`, color: sidebarColors.goldLight }}>
                      {phone}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeRecipientPhone(phone)} />
                    </div>
                  ))}
                </div>
                
                <Select onValueChange={(value) => addRecipientPhone(value)}>
                  <SelectTrigger style={brandedInputStyle}>
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
                
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value={form.manual_phone}
                    onChange={(e) => setForm({ ...form, manual_phone: e.target.value })}
                    placeholder="הזן מספר טלפון ידנית..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualPhone())}
                    className={brandedInputClass}
                    style={brandedInputStyle}
                  />
                  <Button type="button" variant="outline" onClick={addManualPhone} style={{ borderColor: `${sidebarColors.gold}40`, color: sidebarColors.gold }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Message */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: sidebarColors.goldLight }}>
                הודעה (אופציונלי)
              </Label>
              <Textarea
                value={form.message || ''}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="פרטים נוספים..."
                rows={2}
                className={cn("text-right resize-none", brandedInputClass)}
                style={brandedInputStyle}
              />
            </div>
          </div>

          <DialogFooter
            className="px-5 py-4 gap-2"
            style={{ borderTop: `1px solid ${theme.headerBorder}` }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              style={{ color: theme.cancelText }}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={!form.title || !form.remind_at || isSubmitting}
              className="gap-2"
              style={{
                background: theme.buttonBg,
                color: theme.buttonText,
                border: `1px solid ${theme.buttonBorder}`,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  צור תזכורת
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
