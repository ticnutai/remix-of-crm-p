// QuickAddTask - Quick Add Task Dialog for Sidebar
import React, { useState } from 'react';
import { TaskInsert } from '@/hooks/useTasks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { NotificationOptions } from './NotificationOptions';

// Sidebar colors
const sidebarColors = {
  navy: '#162C58',
  gold: '#D4A843',
  goldLight: '#E8D1B4',
  goldDark: '#B8923A',
  navyLight: '#1E3A6E',
  navyDark: '#0F1F3D',
};

// Priority options
const priorities = [
  { value: 'low', label: 'נמוכה', icon: ArrowDown, color: 'text-green-500', bgColor: 'bg-green-500/20', borderColor: 'border-green-500' },
  { value: 'medium', label: 'בינונית', icon: ArrowRight, color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500' },
  { value: 'high', label: 'גבוהה', icon: ArrowUp, color: 'text-red-500', bgColor: 'bg-red-500/20', borderColor: 'border-red-500' },
];

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}

interface QuickAddTaskProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: TaskInsert) => Promise<void>;
  clients?: Client[];
}

export function QuickAddTask({
  open,
  onOpenChange,
  onSubmit,
  clients = [],
}: QuickAddTaskProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [clientId, setClientId] = useState<string>('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(undefined);
    setClientId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate ? dueDate.toISOString() : null,
        client_id: clientId && clientId !== 'none' ? clientId : null,
        status: 'pending',
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[400px] p-0 overflow-hidden" 
        dir="rtl"
        style={{ 
          background: `linear-gradient(135deg, ${sidebarColors.navy} 0%, ${sidebarColors.navyDark} 100%)`,
          border: `1px solid ${sidebarColors.gold}40`,
        }}
      >
        <DialogHeader 
          className="px-5 pt-5 pb-3"
          style={{ borderBottom: `1px solid ${sidebarColors.gold}30` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ background: `${sidebarColors.gold}20` }}
            >
              <CheckSquare className="h-5 w-5" style={{ color: sidebarColors.gold }} />
            </div>
            <DialogTitle 
              className="text-lg font-bold"
              style={{ color: sidebarColors.goldLight }}
            >
              משימה חדשה
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label 
                htmlFor="title" 
                className="text-sm font-medium"
                style={{ color: sidebarColors.goldLight }}
              >
                כותרת המשימה *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="מה צריך לעשות?"
                className="text-right"
                style={{ 
                  background: `${sidebarColors.navyLight}50`,
                  borderColor: `${sidebarColors.gold}40`,
                  color: sidebarColors.goldLight,
                }}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label 
                htmlFor="description" 
                className="text-sm font-medium"
                style={{ color: sidebarColors.goldLight }}
              >
                תיאור (אופציונלי)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="פרטים נוספים..."
                rows={2}
                className="text-right resize-none"
                style={{ 
                  background: `${sidebarColors.navyLight}50`,
                  borderColor: `${sidebarColors.gold}40`,
                  color: sidebarColors.goldLight,
                }}
              />
            </div>

            {/* Priority Selection */}
            <div className="space-y-2">
              <Label 
                className="text-sm font-medium"
                style={{ color: sidebarColors.goldLight }}
              >
                עדיפות
              </Label>
              <div className="flex gap-2">
                {priorities.map((p) => {
                  const Icon = p.icon;
                  const isSelected = priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 transition-all",
                        isSelected ? p.borderColor : "border-transparent",
                        isSelected ? p.bgColor : `bg-[${sidebarColors.navyLight}]50`,
                        p.color
                      )}
                      style={{
                        background: isSelected ? undefined : `${sidebarColors.navyLight}50`,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-medium">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label 
                className="text-sm font-medium"
                style={{ color: sidebarColors.goldLight }}
              >
                תאריך יעד
              </Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right gap-2",
                      !dueDate && "text-muted-foreground"
                    )}
                    style={{ 
                      background: `${sidebarColors.navyLight}50`,
                      borderColor: `${sidebarColors.gold}40`,
                      color: dueDate ? sidebarColors.goldLight : `${sidebarColors.goldLight}60`,
                    }}
                  >
                    <CalendarIcon className="h-4 w-4 ml-auto" style={{ color: sidebarColors.gold }} />
                    {dueDate ? format(dueDate, 'PPP', { locale: he }) : 'בחר תאריך'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date);
                      setIsCalendarOpen(false);
                    }}
                    locale={he}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notification Options */}
            {clients.length > 0 && (
              <NotificationOptions
                type="task"
                clients={clients}
                selectedClientId={clientId && clientId !== 'none' ? clientId : undefined}
                onClientChange={setClientId}
                details={{
                  title,
                  description,
                  date: dueDate ? format(dueDate, 'PPP', { locale: he }) : undefined,
                  priority,
                }}
                disabled={isSubmitting}
              />
            )}
          </div>

          <DialogFooter 
            className="px-5 py-4 gap-2"
            style={{ borderTop: `1px solid ${sidebarColors.gold}30` }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              style={{ color: sidebarColors.goldLight }}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="gap-2"
              style={{ 
                background: sidebarColors.gold,
                color: sidebarColors.navy,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4" />
                  צור משימה
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default QuickAddTask;
