// QuickAddMeeting - Quick Add Meeting Dialog for Sidebar
import React, { useState, useEffect, forwardRef } from "react";
import { MeetingInsert } from "@/hooks/useMeetingsOptimized";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Users,
  Video,
  Phone,
  MapPin,
  Clock,
  Loader2,
  Calendar as CalendarIcon2,
  UserPlus,
  X,
  Search,
} from "lucide-react";
import { format, setHours, setMinutes } from "date-fns";
import { he } from "date-fns/locale";
import { NotificationOptions } from "./NotificationOptions";
import { InlineReminderSection } from "@/components/reminders/InlineReminderSection";

// Sidebar colors
const sidebarColors = {
  navy: "#162C58",
  gold: "#d8ac27",
  goldLight: "#e8c85a",
  goldDark: "#b8941f",
  navyLight: "#1E3A6E",
  navyDark: "#0F1F3D",
};

// Meeting type options
const meetingTypes = [
  {
    value: "in_person",
    label: "פגישה פיזית",
    icon: Users,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500",
  },
  {
    value: "video",
    label: "שיחת וידאו",
    icon: Video,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500",
  },
  {
    value: "phone",
    label: "שיחת טלפון",
    icon: Phone,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500",
  },
];

// Time options
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  return {
    value: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    label: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
  };
});

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}

interface QuickAddMeetingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (meeting: MeetingInsert) => Promise<void>;
  clients?: Client[];
  initialData?: {
    title?: string;
    description?: string;
    clientId?: string;
    date?: Date;
    startTime?: string;
    endTime?: string;
    location?: string;
    meetingType?: string;
  };
}

export const QuickAddMeeting = forwardRef<HTMLDivElement, QuickAddMeetingProps>(
  function QuickAddMeeting(
    { open, onOpenChange, onSubmit, clients = [], initialData },
    _ref,
  ) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [meetingType, setMeetingType] = useState<string>("in_person");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const [location, setLocation] = useState("");
    const [clientIds, setClientIds] = useState<string[]>([]);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isClientPickerOpen, setIsClientPickerOpen] = useState(false);
    const [clientSearch, setClientSearch] = useState("");

    // Load initial data when dialog opens
    useEffect(() => {
      if (open && initialData) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        setMeetingType(initialData.meetingType || "in_person");
        setDate(initialData.date || new Date());
        setStartTime(initialData.startTime || "09:00");
        setEndTime(initialData.endTime || "10:00");
        setLocation(initialData.location || "");
        setClientIds(initialData.clientId ? [initialData.clientId] : []);
      }
    }, [open, initialData]);

    const resetForm = () => {
      setTitle("");
      setDescription("");
      setMeetingType("in_person");
      setDate(new Date());
      setStartTime("09:00");
      setEndTime("10:00");
      setLocation("");
      setClientIds([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || !date) return;

      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);

      const startDateTime = setMinutes(setHours(date, startHour), startMin);
      const endDateTime = setMinutes(setHours(date, endHour), endMin);

      setIsSubmitting(true);
      try {
        await onSubmit({
          title: title.trim(),
          description: description.trim() || null,
          meeting_type: meetingType,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          location: location.trim() || null,
          client_id: clientIds.length > 0 ? clientIds[0] : null,
          status: "scheduled",
        });
        resetForm();
        onOpenChange(false);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleStartTimeChange = (newStartTime: string) => {
      setStartTime(newStartTime);
      const [hour, min] = newStartTime.split(":").map(Number);
      const newEndHour = hour + 1;
      if (newEndHour < 24) {
        setEndTime(
          `${newEndHour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`,
        );
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
          className="sm:max-w-[500px] p-0 overflow-hidden"
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
                <CalendarIcon2
                  className="h-5 w-5"
                  style={{ color: sidebarColors.gold }}
                />
              </div>
              <DialogTitle
                className="text-lg font-bold"
                style={{ color: sidebarColors.goldLight }}
              >
                פגישה חדשה
              </DialogTitle>
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
                  כותרת הפגישה *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="נושא הפגישה"
                  className="text-right"
                  style={{
                    background: `${sidebarColors.navyLight}50`,
                    borderColor: `${sidebarColors.gold}40`,
                    color: sidebarColors.goldLight,
                  }}
                  autoFocus
                />
              </div>

              {/* Meeting Type Selection */}
              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: sidebarColors.goldLight }}
                >
                  סוג הפגישה
                </Label>
                <div className="flex gap-2">
                  {meetingTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = meetingType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setMeetingType(type.value)}
                        className={cn(
                          "flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 transition-all",
                          isSelected ? type.borderColor : "border-transparent",
                          isSelected ? type.bgColor : "",
                          type.color,
                        )}
                        style={{
                          background: isSelected
                            ? undefined
                            : `${sidebarColors.navyLight}50`,
                        }}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-[10px] font-medium">
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: sidebarColors.goldLight }}
                >
                  תאריך *
                </Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right gap-2",
                        !date && "text-muted-foreground",
                      )}
                      style={{
                        background: `${sidebarColors.navyLight}50`,
                        borderColor: `${sidebarColors.gold}40`,
                        color: date
                          ? sidebarColors.goldLight
                          : `${sidebarColors.goldLight}60`,
                      }}
                    >
                      <CalendarIcon
                        className="h-4 w-4 ml-auto"
                        style={{ color: sidebarColors.gold }}
                      />
                      {date ? format(date, "PPP", { locale: he }) : "בחר תאריך"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate);
                        setIsCalendarOpen(false);
                      }}
                      locale={he}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: sidebarColors.goldLight }}
                  >
                    שעת התחלה
                  </Label>
                  <Select
                    value={startTime}
                    onValueChange={handleStartTimeChange}
                  >
                    <SelectTrigger
                      className="text-right"
                      style={{
                        background: `${sidebarColors.navyLight}50`,
                        borderColor: `${sidebarColors.gold}40`,
                        color: sidebarColors.goldLight,
                      }}
                    >
                      <Clock
                        className="h-4 w-4 ml-auto"
                        style={{ color: sidebarColors.gold }}
                      />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: sidebarColors.goldLight }}
                  >
                    שעת סיום
                  </Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger
                      className="text-right"
                      style={{
                        background: `${sidebarColors.navyLight}50`,
                        borderColor: `${sidebarColors.gold}40`,
                        color: sidebarColors.goldLight,
                      }}
                    >
                      <Clock
                        className="h-4 w-4 ml-auto"
                        style={{ color: sidebarColors.gold }}
                      />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className="text-sm font-medium"
                  style={{ color: sidebarColors.goldLight }}
                >
                  {meetingType === "video"
                    ? "קישור לפגישה"
                    : meetingType === "phone"
                      ? "מספר טלפון"
                      : "מיקום"}
                </Label>
                <div className="relative">
                  <MapPin
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: sidebarColors.gold }}
                  />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={
                      meetingType === "video"
                        ? "https://meet.google.com/..."
                        : meetingType === "phone"
                          ? "050-000-0000"
                          : "כתובת או חדר"
                    }
                    className="text-right pr-10"
                    style={{
                      background: `${sidebarColors.navyLight}50`,
                      borderColor: `${sidebarColors.gold}40`,
                      color: sidebarColors.goldLight,
                    }}
                  />
                </div>
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
                        background: `${sidebarColors.navyLight}50`,
                        borderColor: `${sidebarColors.gold}40`,
                        color: `${sidebarColors.goldLight}60`,
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
                          className="pr-9 text-right text-sm"
                          style={{
                            background: `${sidebarColors.navyLight}50`,
                            borderColor: `${sidebarColors.gold}30`,
                            color: sidebarColors.goldLight,
                          }}
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
                entityType="meeting"
                entityTitle={title}
                entityDate={date}
                entityDescription={description}
                entityLocation={location}
              />

              {/* Notification Options */}
              {clients.length > 0 && clientIds.length > 0 && (
                <NotificationOptions
                  type="meeting"
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
                    date: date
                      ? format(date, "PPP", { locale: he })
                      : undefined,
                    time: `${startTime} - ${endTime}`,
                    location,
                  }}
                  disabled={isSubmitting}
                />
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium"
                  style={{ color: sidebarColors.goldLight }}
                >
                  הערות (אופציונלי)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="פרטים נוספים על הפגישה..."
                  rows={2}
                  className="text-right resize-none"
                  style={{
                    background: `${sidebarColors.navyLight}50`,
                    borderColor: `${sidebarColors.gold}40`,
                    color: sidebarColors.goldLight,
                  }}
                />
              </div>
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
                disabled={!title.trim() || !date || isSubmitting}
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
                    <CalendarIcon2 className="h-4 w-4" />
                    צור פגישה
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

export default QuickAddMeeting;
