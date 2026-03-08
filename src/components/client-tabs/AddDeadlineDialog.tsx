// Add Deadline Dialog - דיאלוג להוספת מניין ימים חדש
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Timer,
  FileText,
  Clock,
  AlertTriangle,
  Shield,
  Sparkles,
  Calendar,
  Bell,
  Plus,
  Save,
  X,
  BellRing,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useClientDeadlines, DeadlineTemplate } from '@/hooks/useClientDeadlines';
import { calculateDeadlineDate } from '@/hooks/useIsraeliWorkdays';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface AddDeadlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

const CATEGORY_OPTIONS = [
  { value: 'submission', label: 'הגשה', icon: FileText, color: 'text-blue-500' },
  { value: 'response', label: 'המתנה לתשובה', icon: Clock, color: 'text-purple-500' },
  { value: 'appeal', label: 'ערעור', icon: AlertTriangle, color: 'text-orange-500' },
  { value: 'permit', label: 'היתר', icon: Shield, color: 'text-green-500' },
  { value: 'custom', label: 'אחר', icon: Sparkles, color: 'text-gray-500' },
];

const DEFAULT_REMINDER_OPTIONS = [
  { days: 30, label: '30 ימים לפני' },
  { days: 14, label: '14 ימים לפני' },
  { days: 10, label: '10 ימים לפני' },
  { days: 7, label: 'שבוע לפני' },
  { days: 5, label: '5 ימים לפני' },
  { days: 3, label: '3 ימים לפני' },
  { days: 1, label: 'יום לפני' },
];

// Calculate reminder date helper
const calculateReminderDate = (startDate: Date, deadlineDays: number, daysBefore: number): Date | null => {
  const daysUntilReminder = deadlineDays - daysBefore;
  if (daysUntilReminder <= 0) return null;

  const reminderDate = new Date(startDate);
  let workdaysAdded = 0;
  while (workdaysAdded < daysUntilReminder) {
    reminderDate.setDate(reminderDate.getDate() + 1);
    const day = reminderDate.getDay();
    if (day !== 5 && day !== 6) { // Not Friday or Saturday
      workdaysAdded++;
    }
  }
  reminderDate.setHours(9, 0, 0, 0);
  return reminderDate;
};

export function AddDeadlineDialog({ open, onOpenChange, clientId }: Readonly<AddDeadlineDialogProps>) {
  const { templates, createDeadline, createTemplate } = useClientDeadlines(clientId);
  
  const [activeTab, setActiveTab] = useState<'template' | 'custom'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<DeadlineTemplate | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [deadlineDays, setDeadlineDays] = useState(30);
  const [reminderDays, setReminderDays] = useState<number[]>([10, 5, 3, 1]);
  const [customReminderDay, setCustomReminderDay] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  // Calculate deadline date preview
  const deadlineDate = calculateDeadlineDate(new Date(startDate), deadlineDays);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setActiveTab('template');
      setSelectedTemplate(null);
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('custom');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setDeadlineDays(30);
    setReminderDays([10, 5, 3, 1]);
    setNotes('');
    setSaveAsTemplate(false);
  };

  const applyTemplate = (template: DeadlineTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.title);
    setDescription(template.description || '');
    setCategory(template.category);
    setDeadlineDays(template.deadline_days);
    setReminderDays(template.reminder_days || [10, 5, 3, 1]);
    setActiveTab('custom'); // Switch to custom tab to show details
  };

  const toggleReminder = (days: number) => {
    setReminderDays(prev => 
      prev.includes(days) 
        ? prev.filter(d => d !== days)
        : [...prev, days].sort((a, b) => b - a)
    );
  };

  const addCustomReminder = () => {
    const days = Number.parseInt(customReminderDay);
    if (days > 0 && days < deadlineDays && !reminderDays.includes(days)) {
      setReminderDays(prev => [...prev, days].sort((a, b) => b - a));
      setCustomReminderDay('');
    }
  };

  const removeReminder = (days: number) => {
    setReminderDays(prev => prev.filter(d => d !== days));
  };

  // Get reminder dates preview
  const getReminderPreview = () => {
    const start = new Date(startDate);
    return reminderDays
      .map(days => {
        const date = calculateReminderDate(start, deadlineDays, days);
        return date ? { days, date, isValid: date > new Date() } : null;
      })
      .filter(Boolean) as { days: number; date: Date; isValid: boolean }[];
  };

  const handleSubmit = async () => {
    if (!title || !startDate || deadlineDays <= 0) return;

    // Save as template if requested
    if (saveAsTemplate) {
      await createTemplate({
        title,
        description,
        category,
        deadline_days: deadlineDays,
        reminder_days: reminderDays,
      });
    }

    // Create the deadline
    await createDeadline({
      client_id: clientId,
      title,
      description: description || null,
      category,
      start_date: startDate,
      deadline_days: deadlineDays,
      reminder_days: reminderDays,
      notes: notes || null,
    });

    onOpenChange(false);
    resetForm();
  };

  const systemTemplates = templates.filter(t => t.is_system);
  const userTemplates = templates.filter(t => !t.is_system);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
            <Timer className="h-5 w-5 text-[#d4a843]" />
            הוספת מניין ימים חדש
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'template' | 'custom')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template" className="gap-2">
              <Sparkles className="h-4 w-4" />
              בחר תבנית
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-2">
              <Plus className="h-4 w-4" />
              מותאם אישית
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="template" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {/* System Templates */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">תבניות מערכת</h4>
                <div className="grid gap-2">
                  {systemTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-right transition-all",
                        "hover:border-[#d4a843] hover:bg-amber-50 dark:hover:bg-amber-950/20",
                        selectedTemplate?.id === template.id && "border-[#d4a843] bg-amber-50 dark:bg-amber-950/20"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#1e3a5f] dark:text-white">{template.title}</p>
                          {template.description && (
                            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {template.deadline_days} ימים
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* User Templates */}
              {userTemplates.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">התבניות שלי</h4>
                  <div className="grid gap-2">
                    {userTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className={cn(
                          "w-full p-3 rounded-lg border text-right transition-all",
                          "hover:border-[#d4a843] hover:bg-amber-50 dark:hover:bg-amber-950/20",
                          selectedTemplate?.id === template.id && "border-[#d4a843] bg-amber-50 dark:bg-amber-950/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-[#1e3a5f] dark:text-white">{template.title}</p>
                          <Badge variant="outline">{template.deadline_days} ימים</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Custom Form Tab */}
          <TabsContent value="custom" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label>כותרת *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="לדוגמה: הגשה לוועדה מקומית"
                    className="text-right"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>תיאור</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="פירוט נוסף..."
                    className="text-right resize-none"
                    rows={2}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>קטגוריה</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              <Icon className={cn("h-4 w-4", opt.color)} />
                              {opt.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    תאריך התחלה *
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                {/* Deadline Days */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    מספר ימי עבודה *
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(Number.parseInt(e.target.value) || 0)}
                    className="text-right"
                  />
                  <p className="text-xs text-muted-foreground">
                    ימי עבודה בלבד (ללא שישי, שבת וחגים)
                  </p>
                </div>

                {/* Deadline Preview */}
                <div className="p-3 rounded-lg bg-[#1e3a5f]/5 border border-[#1e3a5f]/20">
                  <p className="text-sm">
                    <span className="text-muted-foreground">תאריך סיום משוער: </span>
                    <span className="font-medium text-[#1e3a5f] dark:text-white">
                      {format(deadlineDate, 'EEEE, d בMMMM yyyy', { locale: he })}
                    </span>
                  </p>
                </div>

                {/* Reminder Days */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    התראות לפני סיום המניין
                  </Label>
                  
                  {/* Quick select buttons */}
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_REMINDER_OPTIONS.map(opt => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => toggleReminder(opt.days)}
                        disabled={opt.days >= deadlineDays}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                          opt.days >= deadlineDays && "opacity-50 cursor-not-allowed",
                          reminderDays.includes(opt.days)
                            ? "bg-[#d4a843] text-white border-[#d4a843]"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#d4a843]"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom reminder input */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">הוסף התראה מותאמת:</span>
                    <Input
                      type="number"
                      min={1}
                      max={deadlineDays - 1}
                      value={customReminderDay}
                      onChange={(e) => setCustomReminderDay(e.target.value)}
                      placeholder="ימים לפני"
                      className="w-24 h-8 text-center"
                    />
                    <span className="text-sm text-muted-foreground">ימים לפני</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomReminder}
                      disabled={!customReminderDay || Number.parseInt(customReminderDay) <= 0 || Number.parseInt(customReminderDay) >= deadlineDays}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      הוסף
                    </Button>
                  </div>

                  {/* Selected reminders preview */}
                  {reminderDays.length > 0 && (
                    <div className="space-y-2 p-3 rounded-lg border border-[#d4a843]/30 bg-amber-50/50 dark:bg-amber-950/20">
                      <div className="flex items-center gap-2 text-sm font-medium text-[#d4a843]">
                        <BellRing className="h-4 w-4" />
                        {reminderDays.length} התראות מתוכננות:
                      </div>
                      <div className="space-y-1.5 mr-2">
                        {getReminderPreview().map(({ days, date, isValid }) => (
                          <div 
                            key={days}
                            className={cn(
                              "flex items-center justify-between text-sm py-1 px-2 rounded",
                              isValid ? "bg-white dark:bg-gray-800" : "bg-red-50 dark:bg-red-950/30"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {isValid ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                              )}
                              <span className={cn(!isValid && "text-red-500")}>
                                {days} ימים לפני - {format(date, 'dd/MM/yyyy', { locale: he })}
                              </span>
                              {!isValid && (
                                <span className="text-xs text-red-500">(עבר)</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeReminder(days)}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 ההתראות יופיעו במערכת ההתראות המרכזית ובהודעות דפדפן
                      </p>
                    </div>
                  )}

                  {reminderDays.length === 0 && (
                    <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-sm text-orange-700 dark:text-orange-300">
                      <AlertTriangle className="h-4 w-4 inline ml-2" />
                      לא נבחרו התראות - לא תקבל תזכורות לפני סיום המניין
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>הערות</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="הערות פנימיות..."
                    className="text-right resize-none"
                    rows={2}
                  />
                </div>

                {/* Save as Template */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <Checkbox
                    id="saveTemplate"
                    checked={saveAsTemplate}
                    onCheckedChange={(checked) => setSaveAsTemplate(checked === true)}
                  />
                  <Label htmlFor="saveTemplate" className="text-sm cursor-pointer">
                    שמור כתבנית לשימוש עתידי
                  </Label>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!title || !startDate || deadlineDays <= 0}
            className="gap-2 bg-[#1e3a5f] hover:bg-[#2d4a6f]"
          >
            <Save className="h-4 w-4" />
            צור מניין
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
