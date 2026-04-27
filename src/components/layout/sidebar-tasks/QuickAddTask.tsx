// QuickAddTask - Quick Add Task Dialog for Sidebar
import React, { useState, useEffect, forwardRef } from "react";
import { TaskInsert } from "@/hooks/useTasksOptimized";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  CheckSquare,
  Loader2,
  UserPlus,
  X,
  Search,
  Lock,
  Unlock,
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { NotificationOptions } from "./NotificationOptions";
import { InlineReminderSection } from "@/components/reminders/InlineReminderSection";
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
  background: "#FFFFFF",
  borderColor: "#d8ac27",
  color: "#0F1F3D",
};
const brandedInputClass = "placeholder:text-slate-400";

// Priority options
const priorities = [
  {
    value: "low",
    label: "נמוכה",
    icon: ArrowDown,
    color: "text-green-500",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500",
  },
  {
    value: "medium",
    label: "בינונית",
    icon: ArrowRight,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500",
  },
  {
    value: "high",
    label: "גבוהה",
    icon: ArrowUp,
    color: "text-red-500",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500",
  },
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
  initialData?: {
    title?: string;
    description?: string;
    clientId?: string;
    dueDate?: Date;
    priority?: string;
  };
}

export const QuickAddTask = forwardRef<HTMLDivElement, QuickAddTaskProps>(
  function QuickAddTask(
    { open, onOpenChange, onSubmit, clients = [], initialData },
    _ref,
  ) {
    const { themeId, theme, setThemeId } = useDialogTheme();
    const sidebarColors = getSidebarColors(theme);
    const { size, containerRef, startResize } = useDialogResize(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<string>("medium");
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [clientIds, setClientIds] = useState<string[]>([]);
    const [isPrivate, setIsPrivate] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isClientPickerOpen, setIsClientPickerOpen] = useState(false);
    const [clientSearch, setClientSearch] = useState("");
    const [dueDateText, setDueDateText] = useState("");
    const [dateError, setDateError] = useState<string | null>(null);

    // Parse manual date input - supports dd/MM/yyyy, dd-MM-yyyy, dd.MM.yyyy, yyyy-MM-dd
    const parseManualDate = (value: string): Date | null => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      // dd/MM/yyyy or dd-MM-yyyy or dd.MM.yyyy
      const dmy = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
      if (dmy) {
        const [, d, m, y] = dmy;
        const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
        const date = new Date(year, parseInt(m, 10) - 1, parseInt(d, 10));
        if (!isNaN(date.getTime())) return date;
      }
      // yyyy-MM-dd
      const ymd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (ymd) {
        const [, y, m, d] = ymd;
        const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        if (!isNaN(date.getTime())) return date;
      }
      return null;
    };

    const handleManualDateChange = (value: string) => {
      setDueDateText(value);
      if (!value.trim()) {
        setDateError(null);
        setDueDate(undefined);
        return;
      }
      const parsed = parseManualDate(value);
      if (parsed) {
        setDueDate(parsed);
        setDateError(null);
      } else {
        setDateError("פורמט: יום/חודש/שנה (לדוגמה 25/12/2025)");
      }
    };

    // Load initial data when dialog opens
    useEffect(() => {
      if (open && initialData) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        setPriority(initialData.priority || "medium");
        setDueDate(initialData.dueDate);
        setDueDateText(initialData.dueDate ? format(initialData.dueDate, "dd/MM/yyyy") : "");
        setClientIds(initialData.clientId ? [initialData.clientId] : []);
      }
    }, [open, initialData]);

    const resetForm = () => {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate(undefined);
      setDueDateText("");
      setDateError(null);
      setClientIds([]);
      setIsPrivate(false);
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
          client_id: clientIds.length > 0 ? clientIds[0] : null,
          status: "pending",
          is_private: isPrivate,
        });
        resetForm();
        onOpenChange(false);
      } finally {
        setIsSubmitting(false);
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

    return (
      <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
        <DialogContent
          ref={containerRef}
          className="p-0 overflow-visible navy-gold-dialog"
          dir="rtl"
          onKeyDown={(e) => { if (e.key === 'Escape') onOpenChange(false); }}
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
                <CheckSquare
                  className="h-5 w-5"
                  style={{ color: theme.iconColor }}
                />
              </div>
              <DialogTitle
                className="text-lg font-bold flex-1"
                style={{ color: theme.title }}
              >
                משימה חדשה
              </DialogTitle>
              <button
                type="button"
                onClick={() => setIsPrivate((p) => !p)}
                title={isPrivate ? "פרטי — רק את/ה רואה משימה זו (גם אדמין לא)" : "לחץ כדי לסמן כפרטי"}
                aria-pressed={isPrivate}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all"
                style={{
                  background: isPrivate ? `${sidebarColors.gold}25` : "transparent",
                  borderColor: isPrivate ? sidebarColors.gold : `${sidebarColors.gold}40`,
                  color: isPrivate ? sidebarColors.gold : sidebarColors.goldLight,
                }}
              >
                {isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                <span>{isPrivate ? "פרטי" : "פרטי"}</span>
              </button>
              <DialogThemeSwitcher currentTheme={themeId} onThemeChange={setThemeId} />
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden" style={{ maxHeight: 'calc(85vh - 120px)' }}>
            <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 gold-scrollbar">
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
                  className={cn("text-right", brandedInputClass)}
                  style={brandedInputStyle}
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
                  className={cn("text-right resize-none", brandedInputClass)}
                  style={brandedInputStyle}
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
                          isSelected
                            ? p.bgColor
                            : `bg-[${sidebarColors.navyLight}]50`,
                          p.color,
                        )}
                        style={{
                          background: isSelected
                            ? undefined
                            : `${sidebarColors.navyLight}50`,
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-medium">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Due Date - Manual input + Calendar picker */}
              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: sidebarColors.goldLight }}
                >
                  תאריך יעד
                </Label>
                <div className="flex gap-2">
                  {/* Manual text input */}
                  <Input
                    value={dueDateText}
                    onChange={(e) => handleManualDateChange(e.target.value)}
                    placeholder="dd/mm/yyyy"
                    className={cn("flex-1 text-right", brandedInputClass)}
                    style={brandedInputStyle}
                    inputMode="numeric"
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="px-3 gap-2 shrink-0"
                    style={{
                      ...brandedInputStyle,
                      color: sidebarColors.navyDark,
                    }}
                    title="בחר מלוח שנה"
                    onClick={() => setIsCalendarOpen((v) => !v)}
                    aria-expanded={isCalendarOpen}
                  >
                    <CalendarIcon
                      className="h-4 w-4"
                      style={{ color: sidebarColors.gold }}
                    />
                    <span className="text-xs">לוח</span>
                  </Button>
                </div>
                {isCalendarOpen && (
                  <div
                    className="mt-3 w-[340px] max-w-full min-w-[300px] max-h-[48vh] resize overflow-auto rounded-lg border-2 bg-background p-2 shadow-xl"
                    style={{ borderColor: sidebarColors.gold }}
                    data-no-drag
                  >
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date);
                        setDueDateText(date ? format(date, "dd/MM/yyyy") : "");
                        setDateError(null);
                        setIsCalendarOpen(false);
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
                {dateError && (
                  <p className="text-xs" style={{ color: "#ef4444" }}>
                    {dateError}
                  </p>
                )}
                {dueDate && !dateError && (
                  <p className="text-xs" style={{ color: sidebarColors.goldLight }}>
                    {format(dueDate, "EEEE, d בMMMM yyyy", { locale: he })}
                  </p>
                )}
              </div>


              {/* Client Assignment - Multi Select */}
              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: sidebarColors.goldLight }}
                >
                  שיוך ללקוחות
                </Label>
                {/* Selected clients chips */}
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
                        color: selectedClients.length > 0 ? sidebarColors.navyDark : "#64748b",
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
                          c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                          c.phone?.includes(clientSearch)
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

              {/* Reminder & Calendar Sync */}
              <InlineReminderSection
                entityType="task"
                entityTitle={title}
                entityDate={dueDate}
                entityDescription={description}
              />

              {/* Notification Options */}
              {clients.length > 0 && clientIds.length > 0 && (
                <NotificationOptions
                  type="task"
                  clients={clients}
                  selectedClientIds={clientIds}
                  onClientChange={(id) => {
                    if (!clientIds.includes(id)) {
                      setClientIds(prev => [...prev, id]);
                    }
                  }}
                  details={{
                    title,
                    description,
                    date: dueDate
                      ? format(dueDate, "PPP", { locale: he })
                      : undefined,
                    priority,
                  }}
                  disabled={isSubmitting}
                />
              )}
            </div>

            <DialogFooter
              className="px-5 py-4 gap-2"
              style={{ borderTop: `1px solid ${theme.headerBorder}` }}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                style={{ color: theme.cancelText }}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || isSubmitting}
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
  },
);

export default QuickAddTask;
