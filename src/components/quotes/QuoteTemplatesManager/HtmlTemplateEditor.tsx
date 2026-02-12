// עורך HTML ויזואלי מתקדם לתבניות הצעות מחיר
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  X,
  Save,
  Download,
  FileCode,
  Mail,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  GripVertical,
  Image,
  Palette,
  Type,
  CreditCard,
  FileText,
  Settings,
  Upload,
  Copy,
  RotateCcw,
  User,
  MapPin,
  Search,
  Check,
  Send,
  File,
  Eye,
  Columns,
  Menu,
  MessageCircle,
  Sparkles,
  Layers,
  Box,
  QrCode,
  PenTool,
  Clock,
  History,
  Calculator,
  Smartphone,
  Calendar,
  Wrench,
  Edit,
  Bold,
  Italic,
  Underline,
  AlignRight,
  AlignCenter,
  AlignLeft,
  BookTemplate,
  Minimize2,
  Maximize2,
  Undo2,
  Redo2,
  Lock,
  Unlock,
  Share2,
  FileDown,
  GitBranch,
  ArrowLeftRight,
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
} from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/hooks/use-toast";
import { QuoteTemplate, TemplateStage, TemplateStageItem } from "./types";
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
import { useClients } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";
import {
  DesignTemplatesSelector,
  DigitalSignature,
  QRCodeGenerator,
  QuoteStatusTracker,
  ChangeHistory,
  SMSShareDialog,
  CalendarSyncDialog,
  AlternativePricing,
  AutoCalculator,
  PaymentLink,
  DESIGN_TEMPLATES,
  type QuoteStatus,
  type ChangeRecord,
  type PricingOption,
  type CalculationResult,
} from "./AdvancedFeatures";

interface HtmlTemplateEditorProps {
  open: boolean;
  onClose: () => void;
  template: QuoteTemplate;
  onSave: (template: Partial<QuoteTemplate>) => Promise<void>;
}

interface PaymentStep {
  id: string;
  name: string;
  percentage: number;
  description: string;
}
interface DesignSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: number;
  logoUrl: string;
  headerBackground: string;
  showLogo: boolean;
  borderRadius: number;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logoSize?: number;
  logoWidth?: number;
  logoHeight?: number;
  logoPosition?:
    | "inside-header"
    | "above-header"
    | "centered-above"
    | "full-width";
  showHeaderStrip?: boolean;
  headerStripHeight?: number;
  stripWidth?: number;
  logoCropData?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
interface TextBox {
  id: string;
  title: string;
  content: string;
  position:
    | "header"
    | "before-stages"
    | "after-stages"
    | "before-payments"
    | "after-payments"
    | "footer";
  style: "default" | "highlight" | "warning" | "info";
  customBg?: string;
  customBorder?: string;
  customTextColor?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlign?: "right" | "center" | "left";
  fontFamily?: string;
}

// Hebrew fonts available in text boxes
const HEBREW_FONTS = [
  { value: "Heebo", label: "Heebo" },
  { value: "Assistant", label: "Assistant" },
  { value: "Rubik", label: "Rubik" },
  { value: "Alef", label: "Alef" },
  { value: "David Libre", label: "David Libre" },
  { value: "Frank Ruhl Libre", label: "Frank Ruhl" },
  { value: "Varela Round", label: "Varela Round" },
  { value: "Noto Sans Hebrew", label: "Noto Sans" },
  { value: "Secular One", label: "Secular One" },
  { value: "Suez One", label: "Suez One" },
  { value: "Amatic SC", label: "Amatic SC" },
];
interface QuoteVersion {
  id: string;
  timestamp: string;
  label: string;
  data: {
    stages: TemplateStage[];
    paymentSteps: PaymentStep[];
    textBoxes: TextBox[];
    designSettings: DesignSettings;
    basePrice: number;
    upgrades?: any[];
    pricingTiers?: any[];
    projectDetails?: any;
  };
}
type PreviewDevice = "desktop" | "tablet" | "mobile";
interface ProjectDetails {
  clientId: string;
  clientName: string;
  gush: string;
  helka: string;
  migrash: string;
  taba: string;
  address: string;
  projectType: string;
  phone?: string;
}

// Client selector component with search
function ClientSelector({
  clients,
  selectedClient,
  onSelect,
  open,
  onOpenChange,
}: {
  clients: Array<{
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    gush?: string | null;
    helka?: string | null;
    migrash?: string | null;
    taba?: string | null;
    address?: string | null;
  }>;
  selectedClient: string;
  onSelect: (client: any) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()) ||
          c.phone?.includes(search) ||
          c.gush?.includes(search) ||
          c.address?.toLowerCase().includes(search.toLowerCase()),
      ),
    [clients, search],
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl z-[9999]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#B8860B]" />
            בחר לקוח ({clients.length})
          </DialogTitle>
        </DialogHeader>
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="חפש לפי שם, טלפון, גוש או כתובת..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
            dir="rtl"
          />
        </div>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                לא נמצאו לקוחות
                {clients.length === 0 && (
                  <p className="text-xs mt-2">טוען לקוחות...</p>
                )}
              </div>
            ) : (
              filtered.map((client) => (
                <div
                  key={client.id}
                  className={`p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${selectedClient === client.id ? "bg-[#DAA520]/10 border-2 border-[#DAA520]" : "border border-gray-200"}`}
                  onClick={() => {
                    onSelect(client);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {client.name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <span className="font-semibold text-lg">
                        {client.name}
                      </span>
                    </div>
                    {selectedClient === client.id && (
                      <Check className="h-5 w-5 text-[#B8860B]" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mr-10">
                    {client.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs">📞</span>
                        {client.phone}
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {client.address}
                      </div>
                    )}
                    {client.gush && (
                      <div>
                        <span className="text-gray-400">גוש:</span>{" "}
                        {client.gush}
                      </div>
                    )}
                    {client.helka && (
                      <div>
                        <span className="text-gray-400">חלקה:</span>{" "}
                        {client.helka}
                      </div>
                    )}
                    {client.migrash && (
                      <div>
                        <span className="text-gray-400">מגרש:</span>{" "}
                        {client.migrash}
                      </div>
                    )}
                    {client.taba && (
                      <div>
                        <span className="text-gray-400">תב"ע:</span>{" "}
                        {client.taba}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Email dialog component
function EmailDialog({
  open,
  onOpenChange,
  clients,
  onSend,
  templateName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Array<{ id: string; name: string; email?: string | null }>;
  onSend: (to: string, subject: string, message: string) => void;
  templateName: string;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState(`הצעת מחיר - ${templateName}`);
  const [message, setMessage] = useState(
    "שלום רב,\n\nמצורפת הצעת המחיר כמבוקש.\n\nבברכה",
  );
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [search, setSearch] = useState("");
  const clientsWithEmail = useMemo(
    () => clients.filter((c) => c.email),
    [clients],
  );
  const filtered = useMemo(
    () =>
      clientsWithEmail.filter(
        (c) =>
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()),
      ),
    [clientsWithEmail, search],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#B8860B]" />
            שליחת הצעת מחיר במייל
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>נמען</Label>
            <div className="flex gap-2">
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="הזן כתובת מייל או בחר מלקוחות"
                className="flex-1"
                dir="ltr"
              />
              <Popover
                open={showClientPicker}
                onOpenChange={setShowClientPicker}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end" dir="rtl">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="חפש לקוח..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-8"
                      dir="rtl"
                    />
                  </div>
                  <ScrollArea className="h-[200px]">
                    {filtered.length === 0 ? (
                      <div className="text-center py-4 text-sm text-gray-400">
                        אין לקוחות עם מייל
                      </div>
                    ) : (
                      <div className="p-1">
                        {filtered.map((client) => (
                          <div
                            key={client.id}
                            className="p-2 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                            onClick={() => {
                              setTo(client.email || "");
                              setShowClientPicker(false);
                            }}
                          >
                            <div>
                              <div className="font-medium text-sm">
                                {client.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {client.email}
                              </div>
                            </div>
                            <Mail className="h-3 w-3 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2">
            <Label>נושא</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label>תוכן ההודעה</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
              dir="rtl"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            onClick={() => {
              onSend(to, subject, message);
              onOpenChange(false);
            }}
            className="bg-green-600 hover:bg-green-700"
            disabled={!to}
          >
            <Send className="h-4 w-4 ml-2" />
            שלח
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Field with quick-select options + manual text
function FieldWithOptions({
  fieldKey,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  fieldKey: string;
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const storageKey = `quote_field_options_${fieldKey}`;
  const [options, setOptions] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });
  const [newOption, setNewOption] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showAddPopover, setShowAddPopover] = useState(false);
  const newOptionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(options));
  }, [options, storageKey]);
  useEffect(() => {
    if (showAddPopover && newOptionRef.current) newOptionRef.current.focus();
  }, [showAddPopover]);

  const addOption = () => {
    const trimmed = newOption.trim();
    if (trimmed && !options.includes(trimmed)) {
      setOptions((prev) => [...prev, trimmed]);
      setNewOption("");
    }
  };

  const removeOption = (opt: string) =>
    setOptions((prev) => prev.filter((o) => o !== opt));

  return (
    <div className="space-y-1">
      <Label className="text-sm text-gray-600 flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Label>
      <div className="relative flex items-center gap-1">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            dir="rtl"
            className="pr-3 pl-8"
          />
          {options.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#B8860B] transition-colors"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showOptions ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>

        {/* Add options popover */}
        <Popover open={showAddPopover} onOpenChange={setShowAddPopover}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-dashed border-gray-300 hover:border-[#B8860B] hover:bg-[#B8860B]/5 text-gray-400 hover:text-[#B8860B] transition-all"
              title={`הוסף אפשרויות ל${label}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" dir="rtl" align="start">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-[#B8860B]" />
                <span className="text-sm font-semibold">אפשרויות ל{label}</span>
              </div>

              {/* Add new option */}
              <div className="flex gap-1.5">
                <Input
                  ref={newOptionRef}
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addOption()}
                  placeholder="הוסף אפשרות חדשה..."
                  className="flex-1 h-8 text-sm"
                  dir="rtl"
                />
                <Button
                  size="sm"
                  className="h-8 px-2 bg-[#B8860B] hover:bg-[#DAA520]"
                  onClick={addOption}
                  disabled={!newOption.trim()}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Options list */}
              {options.length > 0 ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 group px-2 py-1.5 rounded-md hover:bg-gray-50"
                    >
                      <span className="flex-1 text-sm truncate">{opt}</span>
                      <button
                        onClick={() => removeOption(opt)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">
                  אין אפשרויות עדיין. הוסף אפשרויות כדי לבחור מהר.
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Dropdown options list */}
      {showOptions && options.length > 0 && (
        <div className="border rounded-lg bg-white shadow-lg overflow-hidden animate-in slide-in-from-top-1 duration-200">
          {options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChange(opt);
                setShowOptions(false);
              }}
              className={`w-full text-right px-3 py-2 text-sm hover:bg-[#B8860B]/10 transition-colors flex items-center justify-between ${value === opt ? "bg-[#B8860B]/5 text-[#B8860B] font-medium" : "text-gray-700"}`}
            >
              <span>{opt}</span>
              {value === opt && (
                <Check className="h-3.5 w-3.5 text-[#B8860B]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Project Details Editor
function ProjectDetailsEditor({
  details,
  onUpdate,
  clients,
  onOpenClientSelector,
}: {
  details: ProjectDetails;
  onUpdate: (details: ProjectDetails) => void;
  clients: any[];
  onOpenClientSelector: () => void;
}) {
  const fields = [
    { key: "clientName", label: "שם הלקוח", icon: User },
    { key: "gush", label: "גוש", icon: MapPin },
    { key: "helka", label: "חלקה", icon: MapPin },
    { key: "migrash", label: "מגרש", icon: MapPin },
    { key: "taba", label: 'תב"ע', icon: FileText },
    { key: "address", label: "כתובת/ישוב", icon: MapPin },
    { key: "projectType", label: "סוג הפרויקט", icon: FileText },
  ];
  return (
    <div className="bg-white rounded-xl border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-[#B8860B]" />
          פרטי הפרויקט והלקוח
        </h2>
        <Button variant="outline" size="sm" onClick={onOpenClientSelector}>
          <User className="h-4 w-4 ml-1" />
          בחר לקוח
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => (
          <FieldWithOptions
            key={field.key}
            fieldKey={field.key}
            label={field.label}
            icon={field.icon}
            value={(details as any)[field.key] || ""}
            onChange={(val) => onUpdate({ ...details, [field.key]: val })}
            placeholder={`הזן ${field.label}...`}
          />
        ))}
      </div>
    </div>
  );
}

function EditableItem({
  item,
  onUpdate,
  onDelete,
}: {
  item: TemplateStageItem;
  onUpdate: (item: TemplateStageItem) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [text, setText] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);
  const handleSave = () => {
    onUpdate({ ...item, text });
    setIsEditing(false);
  };

  const updateStyle = (updates: Partial<TemplateStageItem>) => {
    onUpdate({ ...item, ...updates });
  };

  const quickColors = [
    "#000000",
    "#374151",
    "#6b7280",
    "#1e40af",
    "#b91c1c",
    "#15803d",
    "#854d0e",
    "#7e22ce",
  ];

  if (isEditing)
    return (
      <div className="py-2 px-3 bg-yellow-50 border border-yellow-300 rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="flex-1 h-8 text-sm"
            dir="rtl"
            style={{
              fontFamily: item.fontFamily || "Heebo",
              fontWeight: item.isBold ? "bold" : "normal",
              fontStyle: item.isItalic ? "italic" : "normal",
              textDecoration: item.isUnderline ? "underline" : "none",
              textAlign: item.textAlign || "right",
              fontSize: item.fontSize ? `${item.fontSize}px` : undefined,
              color: item.fontColor || undefined,
            }}
          />
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {/* Formatting toolbar */}
        <div className="flex items-center gap-1 flex-wrap text-xs">
          <Label className="text-xs">גופן:</Label>
          <Select
            value={item.fontFamily || "Heebo"}
            onValueChange={(v) => updateStyle({ fontFamily: v })}
          >
            <SelectTrigger className="w-24 h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HEBREW_FONTS.map((f) => (
                <SelectItem
                  key={f.value}
                  value={f.value}
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <Label className="text-xs">גודל:</Label>
          <Select
            value={String(item.fontSize || 14)}
            onValueChange={(v) => updateStyle({ fontSize: parseInt(v) })}
          >
            <SelectTrigger className="w-14 h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 12, 14, 16, 18, 20, 24].map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                title="צבע טקסט"
              >
                <span
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: item.fontColor || "#000000" }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex gap-1">
                {quickColors.map((c) => (
                  <button
                    key={c}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    onClick={() =>
                      updateStyle({
                        fontColor: c === "#000000" ? undefined : c,
                      })
                    }
                  />
                ))}
                <Input
                  type="color"
                  value={item.fontColor || "#000000"}
                  onChange={(e) => updateStyle({ fontColor: e.target.value })}
                  className="w-7 h-6 p-0 border-0 cursor-pointer"
                />
              </div>
            </PopoverContent>
          </Popover>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <Button
            size="icon"
            variant={item.isBold ? "default" : "ghost"}
            className="h-6 w-6"
            onClick={() => updateStyle({ isBold: !item.isBold })}
          >
            <Bold className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant={item.isItalic ? "default" : "ghost"}
            className="h-6 w-6"
            onClick={() => updateStyle({ isItalic: !item.isItalic })}
          >
            <Italic className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant={item.isUnderline ? "default" : "ghost"}
            className="h-6 w-6"
            onClick={() => updateStyle({ isUnderline: !item.isUnderline })}
          >
            <Underline className="h-3 w-3" />
          </Button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <Button
            size="icon"
            variant={
              item.textAlign === "right" || !item.textAlign
                ? "default"
                : "ghost"
            }
            className="h-6 w-6"
            onClick={() => updateStyle({ textAlign: "right" })}
          >
            <AlignRight className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant={item.textAlign === "center" ? "default" : "ghost"}
            className="h-6 w-6"
            onClick={() => updateStyle({ textAlign: "center" })}
          >
            <AlignCenter className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant={item.textAlign === "left" ? "default" : "ghost"}
            className="h-6 w-6"
            onClick={() => updateStyle({ textAlign: "left" })}
          >
            <AlignLeft className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  return (
    <div className="flex items-center gap-2 py-2 group hover:bg-gray-50 rounded-lg px-1">
      <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
      <span className="text-[#DAA520] text-lg">✓</span>
      <span
        className="flex-1 cursor-pointer hover:text-[#B8860B]"
        onClick={() => setIsEditing(true)}
        style={{
          fontFamily: item.fontFamily || "Heebo",
          fontWeight: item.isBold ? "bold" : "normal",
          fontStyle: item.isItalic ? "italic" : "normal",
          textDecoration: item.isUnderline ? "underline" : "none",
          textAlign: item.textAlign || "right",
          fontSize: item.fontSize ? `${item.fontSize}px` : undefined,
          color: item.fontColor || "#374151",
        }}
      >
        {item.text}
      </span>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-red-500"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function StageEditor({
  stage,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  stage: TemplateStage;
  onUpdate: (stage: TemplateStage) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [stageName, setStageName] = useState(stage.name);
  const updateItem = (itemId: string, updatedItem: TemplateStageItem) => {
    onUpdate({
      ...stage,
      items: stage.items.map((item) =>
        item.id === itemId ? updatedItem : item,
      ),
    });
  };
  const deleteItem = (itemId: string) => {
    onUpdate({
      ...stage,
      items: stage.items.filter((item) => item.id !== itemId),
    });
  };
  const addItem = () => {
    onUpdate({
      ...stage,
      items: [...stage.items, { id: Date.now().toString(), text: "פריט חדש" }],
    });
  };
  const saveNameChange = () => {
    onUpdate({ ...stage, name: stageName });
    setIsEditingName(false);
  };
  const stageIcons = [
    "📋",
    "🔍",
    "📐",
    "✏️",
    "📁",
    "🏗️",
    "🔧",
    "✅",
    "📊",
    "🎯",
  ];
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 bg-gradient-to-l from-gray-50 to-white">
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-xl hover:scale-110 transition-transform cursor-pointer">
              {stage.icon || "📋"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" dir="rtl">
            <div className="grid grid-cols-5 gap-1">
              {stageIcons.map((icon) => (
                <button
                  key={icon}
                  className="p-2 hover:bg-gray-100 rounded text-xl"
                  onClick={() => onUpdate({ ...stage, icon })}
                >
                  {icon}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {isEditingName ? (
          <Input
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            onBlur={saveNameChange}
            onKeyDown={(e) => e.key === "Enter" && saveNameChange()}
            className="flex-1 h-8 font-semibold"
            dir="rtl"
          />
        ) : (
          <h3
            className="flex-1 font-semibold text-gray-800 hover:text-[#B8860B] cursor-pointer"
            onClick={() => setIsEditingName(true)}
          >
            {stage.name}
          </h3>
        )}
        <Badge variant="outline" className="text-[#B8860B] border-[#DAA520]">
          {stage.items.length} פריטים
        </Badge>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onMoveUp}
            disabled={isFirst}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onMoveDown}
            disabled={isLast}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onDuplicate}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-red-500"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-gray-100">
          <div className="p-4 space-y-1">
            {stage.items.map((item) => (
              <EditableItem
                key={item.id}
                item={item}
                onUpdate={(updatedItem) => updateItem(item.id, updatedItem)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </div>
          <div className="px-4 pb-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#B8860B] hover:bg-[#DAA520]/10 w-full justify-center"
              onClick={addItem}
            >
              <Plus className="h-4 w-4 ml-1" />
              הוסף פריט
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentStepEditor({
  step,
  onUpdate,
  onDelete,
}: {
  step: PaymentStep;
  onUpdate: (step: PaymentStep) => void;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#DAA520]/10 text-[#B8860B] font-bold">
          {step.percentage}%
        </div>
        <div className="flex-1">
          <Input
            value={step.name}
            onChange={(e) => onUpdate({ ...step, name: e.target.value })}
            className="font-medium border-0 p-0 h-auto focus-visible:ring-0"
            placeholder="שם שלב התשלום"
            dir="rtl"
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={step.percentage}
            onChange={(e) =>
              onUpdate({ ...step, percentage: parseInt(e.target.value) || 0 })
            }
            className="w-16 text-center"
            min={0}
            max={100}
          />
          <span className="text-gray-500">%</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-red-500"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t">
          <Textarea
            value={step.description}
            onChange={(e) => onUpdate({ ...step, description: e.target.value })}
            placeholder="תיאור שלב התשלום..."
            className="min-h-[60px]"
            dir="rtl"
          />
        </div>
      )}
    </div>
  );
}

const TEXT_BOX_TEMPLATES: {
  label: string;
  title: string;
  content: string;
  position: TextBox["position"];
  style: TextBox["style"];
}[] = [
  {
    label: "📋 תנאים כלליים",
    title: "תנאים כלליים",
    content:
      "1. ההצעה בתוקף ל-30 יום מיום הגשתה\n2. המחירים כוללים מע״מ כחוק\n3. תנאי תשלום בהתאם לאמור בהצעה",
    position: "footer",
    style: "default",
  },
  {
    label: "⚠️ הבהרות חשובות",
    title: "הבהרות",
    content:
      "העבודה אינה כוללת:\n- עבודות חשמל ואינסטלציה\n- אגרות והיטלים\n- ליווי ביצוע באתר",
    position: "after-stages",
    style: "warning",
  },
  {
    label: "✅ מה כלול",
    title: "כלול בהצעה",
    content:
      "• תכנון אדריכלי מלא\n• הגשה לרישוי\n• ליווי עד קבלת היתר\n• 3 סבבי תיקונים",
    position: "before-stages",
    style: "info",
  },
  {
    label: "🏗️ לוחות זמנים",
    title: "לוחות זמנים משוערים",
    content:
      "• תכנון ראשוני: 2-3 שבועות\n• הגשה לועדה: שבוע\n• טיפול בהערות: 1-2 שבועות\n• אישור סופי: בהתאם לועדה",
    position: "after-stages",
    style: "highlight",
  },
  {
    label: "💼 אחריות",
    title: "אחריות מקצועית",
    content:
      "המשרד מבוטח בביטוח אחריות מקצועית. האחריות חלה על התכנון בלבד ולא על הביצוע.",
    position: "footer",
    style: "default",
  },
  {
    label: "📞 יצירת קשר",
    title: "פרטי התקשרות",
    content:
      "לשאלות ובירורים ניתן לפנות:\nטלפון: \nאימייל: \nשעות פעילות: א-ה 9:00-18:00",
    position: "footer",
    style: "info",
  },
];

function TextBoxEditor({
  textBox,
  onUpdate,
  onDelete,
  onDuplicate,
  dragHandleProps,
}: {
  textBox: TextBox;
  onUpdate: (textBox: TextBox) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  dragHandleProps?: any;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const styleColors: Record<string, string> = {
    default: "bg-white border-gray-200",
    highlight: "bg-yellow-50 border-yellow-300",
    warning: "bg-red-50 border-red-300",
    info: "bg-blue-50 border-blue-300",
  };
  const positionLabels: Record<string, string> = {
    "before-stages": "📍 לפני שלבי העבודה",
    "after-stages": "📍 אחרי שלבי העבודה",
    "before-payments": "📍 לפני תשלומים",
    "after-payments": "📍 אחרי תשלומים",
    header: "📍 בראש ההצעה",
    footer: "📍 בתחתית ההצעה",
  };
  const quickColors = [
    "#ffffff",
    "#fef3c7",
    "#fee2e2",
    "#dbeafe",
    "#dcfce7",
    "#f3e8ff",
    "#fce7f3",
    "#e0f2fe",
  ];

  return (
    <div
      className={`rounded-lg border-2 p-3 ${styleColors[textBox.style]} transition-all hover:shadow-md`}
      style={{
        backgroundColor: textBox.customBg || undefined,
        borderColor: textBox.customBorder || undefined,
      }}
    >
      {/* Top bar: drag handle + title + controls */}
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <div
          {...(dragHandleProps || {})}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-black/5 touch-none"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        <Input
          value={textBox.title}
          onChange={(e) => onUpdate({ ...textBox, title: e.target.value })}
          className="font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent flex-1 text-sm"
          placeholder="כותרת הקטע"
          dir="rtl"
        />

        {/* Style selector */}
        <Select
          value={textBox.style}
          onValueChange={(v) =>
            onUpdate({ ...textBox, style: v as TextBox["style"] })
          }
        >
          <SelectTrigger className="w-20 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">רגיל</SelectItem>
            <SelectItem value="highlight">מודגש</SelectItem>
            <SelectItem value="warning">אזהרה</SelectItem>
            <SelectItem value="info">מידע</SelectItem>
          </SelectContent>
        </Select>

        {/* Position selector */}
        <Select
          value={textBox.position}
          onValueChange={(v) =>
            onUpdate({ ...textBox, position: v as TextBox["position"] })
          }
        >
          <SelectTrigger className="w-40 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="header">בראש ההצעה</SelectItem>
            <SelectItem value="before-stages">לפני שלבי העבודה</SelectItem>
            <SelectItem value="after-stages">אחרי שלבי העבודה</SelectItem>
            <SelectItem value="before-payments">לפני סדר תשלומים</SelectItem>
            <SelectItem value="after-payments">אחרי סדר תשלומים</SelectItem>
            <SelectItem value="footer">בתחתית ההצעה</SelectItem>
          </SelectContent>
        </Select>

        {/* Action buttons */}
        <div className="flex gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="צבעים מותאמים"
          >
            <Palette className="h-3 w-3" />
          </Button>
          {onDuplicate && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={onDuplicate}
              title="שכפל תיבה"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "הרחב" : "כווץ"}
          >
            {isCollapsed ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minimize2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-red-500"
            onClick={onDelete}
            title="מחק"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Position label */}
      <div className="text-xs text-gray-400 mt-1 mr-7">
        {positionLabels[textBox.position] || textBox.position}
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="mt-2 space-y-2">
          {/* Custom color picker */}
          {showColorPicker && (
            <div className="p-2 rounded-lg border bg-white/80 space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs w-16">רקע:</Label>
                <div className="flex gap-1">
                  {quickColors.map((c) => (
                    <button
                      key={c}
                      className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: c,
                        borderColor: textBox.customBg === c ? "#000" : "#ddd",
                      }}
                      onClick={() =>
                        onUpdate({
                          ...textBox,
                          customBg: c === "#ffffff" ? undefined : c,
                        })
                      }
                    />
                  ))}
                  <Input
                    type="color"
                    value={textBox.customBg || "#ffffff"}
                    onChange={(e) =>
                      onUpdate({ ...textBox, customBg: e.target.value })
                    }
                    className="w-6 h-5 p-0 border-0 cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs w-16">מסגרת:</Label>
                <div className="flex gap-1">
                  {[
                    "#e5e7eb",
                    "#fde68a",
                    "#fca5a5",
                    "#93c5fd",
                    "#86efac",
                    "#c4b5fd",
                    "#f9a8d4",
                    "#7dd3fc",
                  ].map((c) => (
                    <button
                      key={c}
                      className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: c,
                        borderColor:
                          textBox.customBorder === c ? "#000" : "#ddd",
                      }}
                      onClick={() =>
                        onUpdate({
                          ...textBox,
                          customBorder: c === "#e5e7eb" ? undefined : c,
                        })
                      }
                    />
                  ))}
                  <Input
                    type="color"
                    value={textBox.customBorder || "#e5e7eb"}
                    onChange={(e) =>
                      onUpdate({ ...textBox, customBorder: e.target.value })
                    }
                    className="w-6 h-5 p-0 border-0 cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs w-16">טקסט:</Label>
                <div className="flex gap-1">
                  {[
                    "#000000",
                    "#374151",
                    "#6b7280",
                    "#1e40af",
                    "#b91c1c",
                    "#15803d",
                    "#854d0e",
                    "#7e22ce",
                  ].map((c) => (
                    <button
                      key={c}
                      className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: c,
                        borderColor:
                          textBox.customTextColor === c ? "#fff" : "#ddd",
                      }}
                      onClick={() =>
                        onUpdate({
                          ...textBox,
                          customTextColor: c === "#000000" ? undefined : c,
                        })
                      }
                    />
                  ))}
                  <Input
                    type="color"
                    value={textBox.customTextColor || "#000000"}
                    onChange={(e) =>
                      onUpdate({ ...textBox, customTextColor: e.target.value })
                    }
                    className="w-6 h-5 p-0 border-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Formatting toolbar */}
          <div className="flex items-center gap-1 mr-7 flex-wrap">
            {/* Font selector */}
            <Label className="text-xs">גופן:</Label>
            <Select
              value={textBox.fontFamily || "Heebo"}
              onValueChange={(v) => onUpdate({ ...textBox, fontFamily: v })}
            >
              <SelectTrigger className="w-28 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEBREW_FONTS.map((f) => (
                  <SelectItem
                    key={f.value}
                    value={f.value}
                    style={{ fontFamily: f.value }}
                  >
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <Button
              size="icon"
              variant={textBox.isBold ? "default" : "ghost"}
              className="h-6 w-6"
              onClick={() => onUpdate({ ...textBox, isBold: !textBox.isBold })}
            >
              <Bold className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant={textBox.isItalic ? "default" : "ghost"}
              className="h-6 w-6"
              onClick={() =>
                onUpdate({ ...textBox, isItalic: !textBox.isItalic })
              }
            >
              <Italic className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant={textBox.isUnderline ? "default" : "ghost"}
              className="h-6 w-6"
              onClick={() =>
                onUpdate({ ...textBox, isUnderline: !textBox.isUnderline })
              }
            >
              <Underline className="h-3 w-3" />
            </Button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <Button
              size="icon"
              variant={
                textBox.textAlign === "right" || !textBox.textAlign
                  ? "default"
                  : "ghost"
              }
              className="h-6 w-6"
              onClick={() => onUpdate({ ...textBox, textAlign: "right" })}
            >
              <AlignRight className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant={textBox.textAlign === "center" ? "default" : "ghost"}
              className="h-6 w-6"
              onClick={() => onUpdate({ ...textBox, textAlign: "center" })}
            >
              <AlignCenter className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant={textBox.textAlign === "left" ? "default" : "ghost"}
              className="h-6 w-6"
              onClick={() => onUpdate({ ...textBox, textAlign: "left" })}
            >
              <AlignLeft className="h-3 w-3" />
            </Button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <Label className="text-xs">גודל:</Label>
            <Select
              value={String(textBox.fontSize || 14)}
              onValueChange={(v) =>
                onUpdate({ ...textBox, fontSize: parseInt(v) })
              }
            >
              <SelectTrigger className="w-16 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 12, 14, 16, 18, 20, 24].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Textarea with custom styles applied */}
          <Textarea
            value={textBox.content}
            onChange={(e) => onUpdate({ ...textBox, content: e.target.value })}
            placeholder="תוכן הקטע..."
            className="min-h-[80px] bg-transparent border-0 focus-visible:ring-0 p-0 mr-7"
            dir="rtl"
            style={{
              fontFamily: textBox.fontFamily || "Heebo",
              fontWeight: textBox.isBold ? "bold" : "normal",
              fontStyle: textBox.isItalic ? "italic" : "normal",
              textDecoration: textBox.isUnderline ? "underline" : "none",
              textAlign: textBox.textAlign || "right",
              fontSize: textBox.fontSize ? `${textBox.fontSize}px` : undefined,
              color: textBox.customTextColor || undefined,
            }}
          />
        </div>
      )}
    </div>
  );
}

// Sortable wrapper for drag & drop
function SortableTextBox({
  textBox,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  textBox: TextBox;
  onUpdate: (textBox: TextBox) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: textBox.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TextBoxEditor
        textBox={textBox}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        dragHandleProps={listeners}
      />
    </div>
  );
}

// Sortable section block for the block editor
function SortableSection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  const sectionLabels: Record<string, string> = {
    stages: "📋 שלבי עבודה",
    payments: "💳 תשלומים",
    textboxes: "📝 תיבות טקסט",
    upgrades: "⬆️ שידרוגים",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative group"
    >
      <div
        {...listeners}
        className="absolute -right-1 top-2 cursor-grab active:cursor-grabbing p-1 rounded bg-white shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity z-10 touch-none"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <Badge className="absolute -right-1 -top-2 text-xs bg-white border shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        {sectionLabels[id] || id}
      </Badge>
      {children}
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  const presetColors = [
    "#B8860B",
    "#DAA520",
    "#F4C430",
    "#FFD700",
    "#1e40af",
    "#3b82f6",
    "#06b6d4",
    "#14b8a6",
    "#16a34a",
    "#22c55e",
    "#84cc16",
    "#eab308",
    "#f97316",
    "#ef4444",
    "#ec4899",
    "#a855f7",
    "#6b7280",
    "#374151",
    "#1f2937",
    "#000000",
  ];
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-10 h-10 rounded-lg border-2 border-gray-200 shadow-sm"
              style={{ backgroundColor: value }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <div className="grid grid-cols-5 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded-md border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: color,
                    borderColor: value === color ? "#000" : "transparent",
                  }}
                  onClick={() => onChange(color)}
                />
              ))}
            </div>
            <div className="mt-3 pt-3 border-t">
              <Input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 cursor-pointer"
              />
            </div>
          </PopoverContent>
        </Popover>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export function HtmlTemplateEditor({
  open,
  onClose,
  template,
  onSave,
}: HtmlTemplateEditorProps) {
  const { toast } = useToast();
  const { clients } = useClients();
  const [editedTemplate, setEditedTemplate] = useState<QuoteTemplate>(template);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("מתקדם");
  const [activeTab, setActiveTab] = useState("project");
  const [paymentSteps, setPaymentSteps] = useState<PaymentStep[]>(() => {
    const saved = template.payment_schedule;
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved.map((s: any) => ({
        id: s.id || Date.now().toString(),
        name: s.description || s.name || "",
        percentage: s.percentage || 0,
        description: s.description || "",
      }));
    }
    return [
      { id: "1", name: "מקדמה בחתימה", percentage: 30, description: "" },
      { id: "2", name: "הגשה לרישוי", percentage: 25, description: "" },
      { id: "3", name: 'אישור תב"ע', percentage: 25, description: "" },
      { id: "4", name: "היתר בנייה", percentage: 20, description: "" },
    ];
  });
  const [designSettings, setDesignSettings] = useState<DesignSettings>(() => {
    const ds = template.design_settings as any;
    if (ds && ds.primaryColor) return ds as DesignSettings;
    return {
      primaryColor: "#B8860B",
      secondaryColor: "#DAA520",
      accentColor: "#F4C430",
      fontFamily: "Heebo",
      fontSize: 16,
      logoUrl: "",
      headerBackground:
        "linear-gradient(135deg, #B8860B 0%, #DAA520 50%, #F4C430 100%)",
      showLogo: true,
      borderRadius: 12,
      companyName: "שם החברה",
      companyAddress: "כתובת החברה",
      companyPhone: "050-0000000",
      companyEmail: "email@company.com",
      logoSize: 120,
      logoPosition: "inside-header",
      showHeaderStrip: true,
      headerStripHeight: 150,
    };
  });
  const [textBoxes, setTextBoxes] = useState<TextBox[]>(() => {
    const saved = (template as any).text_boxes;
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return [];
  });
  const [upgrades, setUpgrades] = useState(() => {
    const saved = (template as any).upgrades;
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return [
      { id: "1", name: "יחידת דיור נוספת", price: 5000, enabled: true },
      { id: "2", name: "מרתף/חניה תת קרקעית", price: 6000, enabled: true },
    ];
  });
  const [pricingTiers, setPricingTiers] = useState(() => {
    const saved = (template as any).pricing_tiers;
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return [
      { id: "1", name: "בסיסי", price: 30000 },
      { id: "2", name: "מתקדם", price: 35000 },
      { id: "3", name: "פרימיום", price: 48000 },
    ];
  });
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>(() => {
    const saved = (template as any).project_details;
    if (saved && saved.clientId) return saved;
    return {
      clientId: "",
      clientName: "",
      gush: "",
      helka: "",
      migrash: "",
      taba: "",
      address: "",
      projectType: "",
    };
  });
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [interactiveEditMode, setInteractiveEditMode] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropFileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropRegion, setCropRegion] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 });
  const [cropImageDimensions, setCropImageDimensions] = useState({
    w: 0,
    h: 0,
  });
  const [isConvertingFile, setIsConvertingFile] = useState(false);

  // === Strip Maker State ===
  const stripMakerInputRef = useRef<HTMLInputElement>(null);
  const [stripSourceImage, setStripSourceImage] = useState<string | null>(null);
  const [stripSourceDimensions, setStripSourceDimensions] = useState({
    w: 0,
    h: 0,
  });
  const [stripTargetWidth, setStripTargetWidth] = useState(800);
  const [stripTargetHeight, setStripTargetHeight] = useState(150);
  const [stripOffsetX, setStripOffsetX] = useState(0);
  const [stripOffsetY, setStripOffsetY] = useState(0);
  const [stripScale, setStripScale] = useState(100);
  const [stripBgColor, setStripBgColor] = useState("#ffffff");
  const [stripFitMode, setStripFitMode] = useState<
    "cover" | "contain" | "stretch" | "manual"
  >("contain");
  const [isConvertingStrip, setIsConvertingStrip] = useState(false);

  // === Strip Maker Functions ===
  const handleStripFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsConvertingStrip(true);
      try {
        const dataUrl = await convertFileToImage(file);
        if (!dataUrl) {
          setIsConvertingStrip(false);
          return;
        }
        setStripSourceImage(dataUrl);
        setStripOffsetX(0);
        setStripOffsetY(0);
        setStripScale(100);
        const img = new window.Image();
        img.onload = () => {
          setStripSourceDimensions({ w: img.width, h: img.height });
          setIsConvertingStrip(false);
        };
        img.onerror = () => setIsConvertingStrip(false);
        img.src = dataUrl;
      } catch {
        setIsConvertingStrip(false);
      }
      if (e.target) e.target.value = "";
    },
    [convertFileToImage],
  );

  const generateStripImage = useCallback((): string | null => {
    if (!stripSourceImage) return null;
    const canvas = document.createElement("canvas");
    canvas.width = stripTargetWidth;
    canvas.height = stripTargetHeight;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = stripBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new window.Image();
    img.src = stripSourceImage;

    const scale = stripScale / 100;
    let drawW: number, drawH: number, drawX: number, drawY: number;

    if (stripFitMode === "stretch") {
      drawW = stripTargetWidth;
      drawH = stripTargetHeight;
      drawX = 0;
      drawY = 0;
    } else if (stripFitMode === "cover") {
      const ratio = Math.max(
        stripTargetWidth / img.width,
        stripTargetHeight / img.height,
      );
      drawW = img.width * ratio;
      drawH = img.height * ratio;
      drawX = (stripTargetWidth - drawW) / 2 + stripOffsetX;
      drawY = (stripTargetHeight - drawH) / 2 + stripOffsetY;
    } else if (stripFitMode === "contain") {
      const ratio = Math.min(
        stripTargetWidth / img.width,
        stripTargetHeight / img.height,
      );
      drawW = img.width * ratio * scale;
      drawH = img.height * ratio * scale;
      drawX = (stripTargetWidth - drawW) / 2 + stripOffsetX;
      drawY = (stripTargetHeight - drawH) / 2 + stripOffsetY;
    } else {
      // manual
      drawW = img.width * scale;
      drawH = img.height * scale;
      drawX = stripOffsetX;
      drawY = stripOffsetY;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    return canvas.toDataURL("image/png");
  }, [
    stripSourceImage,
    stripTargetWidth,
    stripTargetHeight,
    stripOffsetX,
    stripOffsetY,
    stripScale,
    stripBgColor,
    stripFitMode,
  ]);

  const applyStripAsLogo = useCallback(() => {
    const dataUrl = generateStripImage();
    if (dataUrl) {
      setDesignSettings((prev) => ({
        ...prev,
        logoUrl: dataUrl,
        logoPosition: "full-width" as const,
        logoWidth: undefined,
        logoHeight: undefined,
        headerStripHeight: undefined,
      }));
    }
  }, [generateStripImage]);

  // === Convert PDF / Word / HTML file to image data URL ===
  const convertFileToImage = useCallback(
    async (file: File): Promise<string> => {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      // PDF → render first page to canvas
      if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const scale = 3; // High quality
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        return canvas.toDataURL("image/png");
      }

      // Word (.docx) → convert to HTML → render to canvas
      if (
        fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileName.endsWith(".docx") ||
        fileName.endsWith(".doc")
      ) {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.default.convertToHtml(
          { arrayBuffer },
          {
            convertImage: mammoth.default.images.imgElement(function (
              image: any,
            ) {
              return image.read("base64").then(function (imageBuffer: string) {
                return {
                  src: "data:" + image.contentType + ";base64," + imageBuffer,
                };
              });
            }),
          },
        );
        // Render HTML to canvas via hidden iframe
        return await htmlStringToImage(result.value);
      }

      // HTML file → read and render to canvas
      if (
        fileType === "text/html" ||
        fileName.endsWith(".html") ||
        fileName.endsWith(".htm")
      ) {
        const text = await file.text();
        return await htmlStringToImage(text);
      }

      // Regular image - just read as data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    [],
  );

  // Helper: render HTML string to image via offscreen iframe
  const htmlStringToImage = useCallback(
    async (htmlContent: string): Promise<string> => {
      return new Promise((resolve) => {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.left = "-9999px";
        iframe.style.top = "-9999px";
        iframe.style.width = "800px";
        iframe.style.height = "600px";
        iframe.style.border = "none";
        document.body.appendChild(iframe);

        iframe.onload = () => {
          setTimeout(() => {
            try {
              const doc =
                iframe.contentDocument || iframe.contentWindow?.document;
              if (!doc) {
                document.body.removeChild(iframe);
                resolve("");
                return;
              }
              // Use canvas to capture
              const body = doc.body;
              const width = Math.max(body.scrollWidth, 800);
              const height = Math.max(body.scrollHeight, 100);

              const canvas = document.createElement("canvas");
              const scale = 2;
              canvas.width = width * scale;
              canvas.height = height * scale;
              const ctx = canvas.getContext("2d")!;
              ctx.scale(scale, scale);
              ctx.fillStyle = "white";
              ctx.fillRect(0, 0, width, height);

              // Serialize to SVG foreignObject for rendering
              const svgData = `
              <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <foreignObject width="100%" height="100%">
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    ${body.innerHTML}
                  </div>
                </foreignObject>
              </svg>`;
              const svgBlob = new Blob([svgData], {
                type: "image/svg+xml;charset=utf-8",
              });
              const url = URL.createObjectURL(svgBlob);
              const img = new window.Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                document.body.removeChild(iframe);
                resolve(canvas.toDataURL("image/png"));
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                document.body.removeChild(iframe);
                resolve("");
              };
              img.src = url;
            } catch {
              document.body.removeChild(iframe);
              resolve("");
            }
          }, 500); // Wait for content to render
        };

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(
            `<!DOCTYPE html><html><head><style>body{margin:0;padding:20px;font-family:Arial,sans-serif;}</style></head><body>${htmlContent}</body></html>`,
          );
          doc.close();
        }
      });
    },
    [],
  );

  // DnD sensors for text boxes
  const textBoxSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const handleTextBoxDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTextBoxes((prev) => {
        const oldIndex = prev.findIndex((t) => t.id === active.id);
        const newIndex = prev.findIndex((t) => t.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  // Extended clients data
  const [extendedClients, setExtendedClients] = useState<any[]>([]);
  useEffect(() => {
    if (!open) return;
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("id, name, email, phone, gush, helka, migrash, taba, address")
          .order("name");
        if (error) {
          console.error("Error fetching clients:", error);
          return;
        }
        console.log("Fetched clients:", data?.length || 0);
        if (data) setExtendedClients(data);
      } catch (e) {
        console.error("Failed to fetch clients:", e);
      }
    };
    fetchClients();
  }, [open]);

  // Use extendedClients if available, fallback to useClients hook data
  const allClients = useMemo(() => {
    if (extendedClients.length > 0) return extendedClients;
    if (clients && clients.length > 0)
      return clients.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        gush: c.gush || null,
        helka: c.helka || null,
        migrash: c.migrash || null,
        taba: c.taba || null,
        address: c.address || null,
      }));
    return [];
  }, [extendedClients, clients]);

  useEffect(() => {
    setEditedTemplate(template);
    // Sync dependent state from template
    const saved = template.payment_schedule;
    if (saved && Array.isArray(saved) && saved.length > 0) {
      setPaymentSteps(
        saved.map((s: any) => ({
          id: s.id || Date.now().toString(),
          name: s.description || s.name || "",
          percentage: s.percentage || 0,
          description: s.description || "",
        })),
      );
    }
    const ds = template.design_settings as any;
    if (ds && ds.primaryColor) setDesignSettings(ds as DesignSettings);
    const tb = (template as any).text_boxes;
    if (tb && Array.isArray(tb) && tb.length > 0) setTextBoxes(tb);
    const ug = (template as any).upgrades;
    if (ug && Array.isArray(ug) && ug.length > 0) setUpgrades(ug);
    const pt = (template as any).pricing_tiers;
    if (pt && Array.isArray(pt) && pt.length > 0) setPricingTiers(pt);
    const pd = (template as any).project_details;
    if (pd && pd.clientId) setProjectDetails(pd);
  }, [template]);

  const handleClientSelect = (client: any) => {
    setProjectDetails({
      clientId: client.id,
      clientName: client.name || "",
      gush: client.gush || "",
      helka: client.helka || "",
      migrash: client.migrash || "",
      taba: client.taba || "",
      address: client.address || "",
      projectType: projectDetails.projectType,
    });
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...editedTemplate,
        payment_schedule: paymentSteps.map((s) => ({
          id: s.id,
          percentage: s.percentage,
          description: s.description || s.name,
        })),
        design_settings: designSettings as any,
        text_boxes: textBoxes,
        upgrades: upgrades,
        project_details: projectDetails,
        base_price: editedTemplate.base_price || 0,
        pricing_tiers: pricingTiers,
      } as any);
      toast({ title: "נשמר בהצלחה ☁️", description: "כל הנתונים נשמרו בענן" });
    } catch (err: any) {
      console.error("Save error:", err);
      toast({
        title: "שגיאה בשמירה",
        description: err?.message || "לא ניתן לשמור",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    editedTemplate,
    paymentSteps,
    designSettings,
    textBoxes,
    upgrades,
    projectDetails,
    pricingTiers,
    onSave,
    toast,
  ]);

  const generateHtmlContent = useCallback(() => {
    const styleMap: Record<
      string,
      { bg: string; border: string; icon: string }
    > = {
      default: { bg: "#ffffff", border: "#e0e0e0", icon: "" },
      highlight: { bg: "#fefce8", border: "#facc15", icon: "💡" },
      warning: { bg: "#fef2f2", border: "#f87171", icon: "⚠️" },
      info: { bg: "#eff6ff", border: "#60a5fa", icon: "ℹ️" },
    };

    const renderTextBoxes = (position: string) => {
      const boxes = textBoxes.filter((tb) => tb.position === position);
      if (boxes.length === 0) return "";
      return boxes
        .map((tb) => {
          const s = styleMap[tb.style] || styleMap.default;
          const bgColor = tb.customBg || s.bg;
          const borderColor = tb.customBorder || s.border;
          const textColor = tb.customTextColor || "#444";
          const fontSize = tb.fontSize || 14;
          const fontFamily =
            tb.fontFamily || designSettings.fontFamily || "Heebo";
          const fontWeight = tb.isBold ? "font-weight: bold;" : "";
          const fontStyle = tb.isItalic ? "font-style: italic;" : "";
          const textDecor = tb.isUnderline ? "text-decoration: underline;" : "";
          const textAlign = `text-align: ${tb.textAlign || "right"};`;
          return `<div style="margin: 15px 0; padding: 15px; background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: ${designSettings.borderRadius}px;">
          ${tb.title ? `<h4 style="margin: 0 0 8px 0; color: ${designSettings.primaryColor}; font-family: ${fontFamily};">${s.icon} ${tb.title}</h4>` : ""}
          <div style="color: ${textColor}; white-space: pre-wrap; font-size: ${fontSize}px; font-family: ${fontFamily}; ${fontWeight} ${fontStyle} ${textDecor} ${textAlign}">${tb.content}</div>
        </div>`;
        })
        .join("");
    };

    const stages = editedTemplate.stages
      .map(
        (stage) => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: ${designSettings.borderRadius}px;">
        <h3 style="color: ${designSettings.primaryColor}; font-family: ${designSettings.fontFamily};">${stage.icon || "📋"} ${stage.name}</h3>
        <ul style="list-style: none; padding: 0;">
          ${stage.items
            .map((item) => {
              const itemFont =
                item.fontFamily || designSettings.fontFamily || "Heebo";
              const itemSize = item.fontSize || 14;
              const itemColor = item.fontColor || "#333";
              const itemBold = item.isBold ? "font-weight: bold;" : "";
              const itemItalic = item.isItalic ? "font-style: italic;" : "";
              const itemUnderline = item.isUnderline
                ? "text-decoration: underline;"
                : "";
              const itemAlign = item.textAlign
                ? `text-align: ${item.textAlign};`
                : "";
              return `<li style="padding: 5px 0; color: ${itemColor}; font-family: '${itemFont}', sans-serif; font-size: ${itemSize}px; ${itemBold} ${itemItalic} ${itemUnderline} ${itemAlign}">✓ ${item.text}</li>`;
            })
            .join("")}
        </ul>
      </div>
    `,
      )
      .join("");

    const payments = paymentSteps
      .map(
        (step) => `
      <tr><td style="padding: 10px; border-bottom: 1px solid #eee;">${step.name}</td><td style="padding: 10px; text-align: center;">${step.percentage}%</td><td style="padding: 10px; text-align: left;">₪${Math.round(((editedTemplate.base_price || 35000) * step.percentage) / 100).toLocaleString()}</td></tr>
    `,
      )
      .join("");

    return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&family=Assistant:wght@200;300;400;500;600;700;800&family=Rubik:wght@300;400;500;600;700&family=Alef:wght@400;700&family=David+Libre:wght@400;500;700&family=Frank+Ruhl+Libre:wght@300;400;500;700&family=Varela+Round&family=Noto+Sans+Hebrew:wght@300;400;500;600;700&family=Secular+One&family=Suez+One&family=Amatic+SC:wght@400;700&display=swap" rel="stylesheet">
  <title>${editedTemplate.name}</title>
  <style>
    body { font-family: '${designSettings.fontFamily}', sans-serif; font-size: ${designSettings.fontSize}px; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
    .header { background: ${designSettings.headerBackground}; color: white; padding: 40px; text-align: center; }
    .content { padding: 40px; }
    .project-details { background: #f9f9f9; padding: 20px; border-radius: ${designSettings.borderRadius}px; margin-bottom: 30px; }
    .project-details h2 { color: ${designSettings.primaryColor}; margin-top: 0; }
    .project-details table { width: 100%; }
    .project-details td { padding: 8px 0; }
    .project-details td:first-child { font-weight: 600; width: 120px; }
    table.payments { width: 100%; border-collapse: collapse; margin-top: 20px; }
    table.payments th { background: ${designSettings.primaryColor}; color: white; padding: 12px; text-align: right; }
    .footer { text-align: center; padding: 30px; background: #f9f9f9; color: #666; font-size: 14px; }
    .full-width-header { padding: 0 !important; overflow: hidden; background: transparent !important; margin: 0; }
    .full-width-header img { width: 100%; height: auto; display: block; object-fit: fill; object-position: center; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    ${
      designSettings.showLogo &&
      designSettings.logoUrl &&
      (designSettings.logoPosition === "above-header" ||
        designSettings.logoPosition === "centered-above")
        ? `
    <div style="padding: 20px; background: white; ${designSettings.logoPosition === "centered-above" ? "text-align: center;" : ""}">
      <img src="${designSettings.logoUrl}" alt="Logo" style="width: ${designSettings.logoWidth || designSettings.logoSize || 120}px; ${designSettings.logoHeight ? `height: ${designSettings.logoHeight}px; object-fit: contain;` : "height: auto;"}">
    </div>`
        : ""
    }
    ${
      designSettings.showHeaderStrip !== false
        ? `
    <div class="header${designSettings.logoPosition === "full-width" ? " full-width-header" : ""}">
      ${designSettings.showLogo && designSettings.logoUrl && designSettings.logoPosition === "full-width" ? `<img src="${designSettings.logoUrl}" alt="Logo">` : ""}
      ${designSettings.showLogo && designSettings.logoUrl && (!designSettings.logoPosition || designSettings.logoPosition === "inside-header") ? `<img src="${designSettings.logoUrl}" alt="Logo" style="width: ${designSettings.logoWidth || designSettings.logoSize || 120}px; ${designSettings.logoHeight ? `height: ${designSettings.logoHeight}px; object-fit: contain;` : "height: auto;"} margin-bottom: 15px;">` : ""}
      ${
        designSettings.logoPosition !== "full-width"
          ? `<h1 style="margin: 0; font-size: 32px;">${editedTemplate.name}</h1>
      <p style="opacity: 0.9; margin: 10px 0 0;">${editedTemplate.description || ""}</p>`
          : ""
      }
    </div>`
        : `
    <div style="padding: 40px; text-align: center; border-bottom: 2px solid ${designSettings.primaryColor};">
      ${designSettings.showLogo && designSettings.logoUrl && designSettings.logoPosition !== "full-width" ? `<img src="${designSettings.logoUrl}" alt="Logo" style="width: ${designSettings.logoWidth || designSettings.logoSize || 120}px; ${designSettings.logoHeight ? `height: ${designSettings.logoHeight}px; object-fit: contain;` : "height: auto;"} margin-bottom: 15px;">` : ""}
      ${
        designSettings.logoPosition !== "full-width"
          ? `<h1 style="margin: 0; font-size: 32px; color: ${designSettings.primaryColor};">${editedTemplate.name}</h1>
      <p style="opacity: 0.7; margin: 10px 0 0;">${editedTemplate.description || ""}</p>`
          : ""
      }
    </div>`
    }
    <div class="content">
      ${renderTextBoxes("header")}
      
      ${
        projectDetails.clientName
          ? `
      <div class="project-details">
        <h2>פרטי הפרויקט</h2>
        <table>
          ${projectDetails.clientName ? `<tr><td>לקוח:</td><td>${projectDetails.clientName}</td></tr>` : ""}
          ${projectDetails.address ? `<tr><td>כתובת:</td><td>${projectDetails.address}</td></tr>` : ""}
          ${projectDetails.gush ? `<tr><td>גוש:</td><td>${projectDetails.gush}</td></tr>` : ""}
          ${projectDetails.helka ? `<tr><td>חלקה:</td><td>${projectDetails.helka}</td></tr>` : ""}
          ${projectDetails.migrash ? `<tr><td>מגרש:</td><td>${projectDetails.migrash}</td></tr>` : ""}
          ${projectDetails.taba ? `<tr><td>תב"ע:</td><td>${projectDetails.taba}</td></tr>` : ""}
          ${projectDetails.projectType ? `<tr><td>סוג פרויקט:</td><td>${projectDetails.projectType}</td></tr>` : ""}
        </table>
      </div>`
          : ""
      }
      
      ${renderTextBoxes("before-stages")}
      
      <h2 style="color: ${designSettings.primaryColor};">שלבי העבודה</h2>
      ${stages}
      
      ${renderTextBoxes("after-stages")}
      
      ${renderTextBoxes("before-payments")}
      
      <h2 style="color: ${designSettings.primaryColor}; margin-top: 40px;">סדר תשלומים</h2>
      <table class="payments">
        <thead><tr><th>שלב</th><th>אחוז</th><th>סכום</th></tr></thead>
        <tbody>${payments}</tbody>
        <tfoot><tr style="font-weight: bold; background: #f0f0f0;"><td style="padding: 12px;">סה"כ</td><td style="padding: 12px; text-align: center;">100%</td><td style="padding: 12px; text-align: left;">₪${(editedTemplate.base_price || 35000).toLocaleString()}</td></tr></tfoot>
      </table>
      
      ${renderTextBoxes("after-payments")}
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">* המחירים אינם כוללים מע"מ. תוקף ההצעה: ${editedTemplate.validity_days || 30} יום.</p>
      
      ${renderTextBoxes("footer")}
    </div>
    <div class="footer">
      <strong>${designSettings.companyName}</strong><br>
      ${designSettings.companyAddress} | ${designSettings.companyPhone} | ${designSettings.companyEmail}
    </div>
  </div>
</body>
</html>`;
  }, [editedTemplate, designSettings, paymentSteps, projectDetails, textBoxes]);

  const handleExportWord = () => {
    const html = generateHtmlContent();
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${editedTemplate.name || "הצעת-מחיר"}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "הקובץ הורד", description: "קובץ Word נוצר בהצלחה" });
  };

  const handleExportPdf = () => {
    const html = generateHtmlContent();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    toast({ title: "מייצא PDF", description: "חלון הדפסה נפתח" });
  };

  const handleExportHtml = () => {
    const html = generateHtmlContent();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${editedTemplate.name || "הצעת-מחיר"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "יוצא HTML", description: "הקובץ הורד" });
  };

  const handleSendEmail = async (
    to: string,
    subject: string,
    message: string,
  ) => {
    try {
      // Try to send via Supabase edge function
      const html = generateHtmlContent();
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to,
          subject,
          html: `<div dir="rtl">${message.replace(/\n/g, "<br>")}</div><hr><br>${html}`,
        },
      });
      if (error) throw error;
      toast({ title: "נשלח בהצלחה", description: `הצעת המחיר נשלחה ל-${to}` });
    } catch (err) {
      // Fallback to mailto
      const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.open(mailtoUrl, "_blank");
      toast({
        title: "פתיחת אפליקציית מייל",
        description: "המייל מוכן לשליחה",
      });
    }
  };

  const updateStage = (stageId: string, updatedStage: TemplateStage) =>
    setEditedTemplate({
      ...editedTemplate,
      stages: editedTemplate.stages.map((stage) =>
        stage.id === stageId ? updatedStage : stage,
      ),
    });
  const deleteStage = (stageId: string) =>
    setEditedTemplate({
      ...editedTemplate,
      stages: editedTemplate.stages.filter((stage) => stage.id !== stageId),
    });
  const duplicateStage = (stageId: string) => {
    const idx = editedTemplate.stages.findIndex((s) => s.id === stageId);
    if (idx === -1) return;
    const orig = editedTemplate.stages[idx];
    const dup = {
      ...orig,
      id: Date.now().toString(),
      name: `${orig.name} (העתק)`,
      items: orig.items.map((item) => ({
        ...item,
        id: Date.now().toString() + Math.random(),
      })),
    };
    const newStages = [...editedTemplate.stages];
    newStages.splice(idx + 1, 0, dup);
    setEditedTemplate({ ...editedTemplate, stages: newStages });
  };
  const moveStage = (stageId: string, dir: "up" | "down") => {
    const idx = editedTemplate.stages.findIndex((s) => s.id === stageId);
    if (idx === -1) return;
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= editedTemplate.stages.length) return;
    const ns = [...editedTemplate.stages];
    [ns[idx], ns[newIdx]] = [ns[newIdx], ns[idx]];
    setEditedTemplate({ ...editedTemplate, stages: ns });
  };
  const addStage = () =>
    setEditedTemplate({
      ...editedTemplate,
      stages: [
        ...editedTemplate.stages,
        { id: Date.now().toString(), name: "שלב חדש", icon: "📋", items: [] },
      ],
    });
  const addPaymentStep = () =>
    setPaymentSteps([
      ...paymentSteps,
      {
        id: Date.now().toString(),
        name: "שלב תשלום חדש",
        percentage: 0,
        description: "",
      },
    ]);
  const addTextBox = () =>
    setTextBoxes([
      ...textBoxes,
      {
        id: Date.now().toString(),
        title: "כותרת חדשה",
        content: "",
        position: "after-stages",
        style: "default",
      },
    ]);
  const addUpgrade = () =>
    setUpgrades([
      ...upgrades,
      {
        id: Date.now().toString(),
        name: "שידורג חדש",
        price: 0,
        enabled: true,
      },
    ]);

  // === Logo Crop Tool Functions ===
  const handleCropFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsConvertingFile(true);
      try {
        const dataUrl = await convertFileToImage(file);
        if (!dataUrl) {
          setIsConvertingFile(false);
          return;
        }
        setCropImageSrc(dataUrl);
        setCropRegion({ x: 0, y: 0, w: 100, h: 100 });
        setCropZoom(1);
        setCropRotation(0);
        // Get image dimensions
        const img = new window.Image();
        img.onload = () => {
          setCropImageDimensions({ w: img.width, h: img.height });
          setIsConvertingFile(false);
        };
        img.onerror = () => setIsConvertingFile(false);
        img.src = dataUrl;
      } catch (err) {
        console.error("[CROP UPLOAD] Error converting file:", err);
        setIsConvertingFile(false);
      }
      // Reset input
      if (e.target) e.target.value = "";
    },
    [convertFileToImage],
  );

  const loadCurrentLogoForCrop = useCallback(() => {
    if (designSettings.logoUrl) {
      setCropImageSrc(designSettings.logoUrl);
      setCropRegion({ x: 0, y: 0, w: 100, h: 100 });
      setCropZoom(1);
      setCropRotation(0);
      const img = new window.Image();
      img.onload = () => {
        setCropImageDimensions({ w: img.width, h: img.height });
      };
      img.src = designSettings.logoUrl;
    }
  }, [designSettings.logoUrl]);

  const applyCrop = useCallback(() => {
    if (!cropImageSrc) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Calculate actual crop region from percentages
      const srcX = (cropRegion.x / 100) * img.width;
      const srcY = (cropRegion.y / 100) * img.height;
      const srcW = (cropRegion.w / 100) * img.width;
      const srcH = (cropRegion.h / 100) * img.height;

      // Handle rotation
      const radians = (cropRotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      const rotatedW = srcW * cos + srcH * sin;
      const rotatedH = srcW * sin + srcH * cos;

      canvas.width = Math.round(rotatedW * cropZoom);
      canvas.height = Math.round(rotatedH * cropZoom);

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.scale(cropZoom, cropZoom);
      ctx.drawImage(
        img,
        srcX,
        srcY,
        srcW,
        srcH,
        -srcW / 2,
        -srcH / 2,
        srcW,
        srcH,
      );

      const croppedDataUrl = canvas.toDataURL("image/png");
      setDesignSettings((prev) => ({
        ...prev,
        logoUrl: croppedDataUrl,
        logoCropData: {
          x: cropRegion.x,
          y: cropRegion.y,
          width: cropRegion.w,
          height: cropRegion.h,
        },
      }));

      // Reset crop tool
      setCropImageSrc(null);
      setCropRegion({ x: 0, y: 0, w: 100, h: 100 });
      setCropZoom(1);
      setCropRotation(0);
    };
    img.src = cropImageSrc;
  }, [cropImageSrc, cropRegion, cropZoom, cropRotation]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log(
        "[LOGO UPLOAD] File selected:",
        file.name,
        "Size:",
        file.size,
        "Type:",
        file.type,
      );
      setIsConvertingFile(true);
      try {
        const dataUrl = await convertFileToImage(file);
        if (!dataUrl) {
          console.error("[LOGO UPLOAD] Failed to convert file");
          setIsConvertingFile(false);
          return;
        }
        console.log("[LOGO UPLOAD] Data URL created, length:", dataUrl.length);

        // Get image dimensions
        const img = new window.Image();
        img.onload = () => {
          console.log(
            "[LOGO UPLOAD] Image loaded - Width:",
            img.width,
            "Height:",
            img.height,
          );

          // Auto-adjust for full-width mode - let the logo dictate the size
          if (designSettings.logoPosition === "full-width") {
            setDesignSettings((prev) => ({
              ...prev,
              logoUrl: dataUrl,
              logoWidth: undefined,
              logoHeight: undefined,
              headerStripHeight: undefined,
            }));
          } else {
            setDesignSettings((prev) => ({
              ...prev,
              logoUrl: dataUrl,
            }));
          }
          setIsConvertingFile(false);
        };
        img.onerror = () => setIsConvertingFile(false);
        img.src = dataUrl;
      } catch (err) {
        console.error("[LOGO UPLOAD] Error converting file:", err);
        setIsConvertingFile(false);
      }
      // Reset input
      if (e.target) e.target.value = "";
    }
  };

  const totalPaymentPercentage = paymentSteps.reduce(
    (sum, s) => sum + s.percentage,
    0,
  );
  const basePrice = editedTemplate.base_price || 35000;

  // Extended font options with more Hebrew fonts
  const fontOptions = [
    { value: "Heebo", label: "Heebo - מודרני" },
    { value: "Assistant", label: "Assistant - נקי" },
    { value: "Rubik", label: "Rubik - עגול" },
    { value: "Varela Round", label: "Varela Round - מעוגל" },
    { value: "Open Sans Hebrew", label: "Open Sans - קלאסי" },
    { value: "Alef", label: "Alef - מסורתי" },
    { value: "Frank Ruhl Libre", label: "Frank Ruhl - עיתונאי" },
    { value: "David Libre", label: "David - רשמי" },
    { value: "Secular One", label: "Secular One - בולט" },
    { value: "Suez One", label: "Suez One - יוקרתי" },
  ];

  // Preset color themes
  const colorThemes = [
    {
      name: "כחול מקצועי",
      primary: "#1e40af",
      secondary: "#3b82f6",
      accent: "#60a5fa",
      headerBg: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    },
    {
      name: "זהב אלגנטי",
      primary: "#B8860B",
      secondary: "#DAA520",
      accent: "#F4C430",
      headerBg:
        "linear-gradient(135deg, #B8860B 0%, #DAA520 50%, #F4C430 100%)",
    },
    {
      name: "ירוק טבע",
      primary: "#059669",
      secondary: "#10b981",
      accent: "#34d399",
      headerBg: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    },
    {
      name: "חום אדמה",
      primary: "#92400e",
      secondary: "#b45309",
      accent: "#d97706",
      headerBg: "linear-gradient(135deg, #92400e 0%, #b45309 100%)",
    },
    {
      name: "סגול מלכותי",
      primary: "#7c3aed",
      secondary: "#8b5cf6",
      accent: "#a78bfa",
      headerBg: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
    },
    {
      name: "אדום נועז",
      primary: "#dc2626",
      secondary: "#ef4444",
      accent: "#f87171",
      headerBg: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
    },
    {
      name: "אפור מינימלי",
      primary: "#374151",
      secondary: "#4b5563",
      accent: "#6b7280",
      headerBg: "linear-gradient(135deg, #374151 0%, #4b5563 100%)",
    },
    {
      name: "טורקיז רענן",
      primary: "#0891b2",
      secondary: "#06b6d4",
      accent: "#22d3ee",
      headerBg: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
    },
  ];

  // 3D effects state
  const [effects3D, setEffects3D] = useState({
    elevation: 2,
    shadowIntensity: 30,
    useGradient: true,
    gradientAngle: 135,
  });

  // AI Logo generation state
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [showAILogoDialog, setShowAILogoDialog] = useState(false);

  // Advanced features state
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>("draft");
  const [changeHistory, setChangeHistory] = useState<ChangeRecord[]>([]);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [pricingOptions, setPricingOptions] = useState<PricingOption[]>([
    {
      id: "basic",
      name: "בסיסי",
      price: 0,
      description: "ללא הנחה",
      features: [],
      isRecommended: false,
    },
  ]);
  const [selectedPricingOption, setSelectedPricingOption] = useState("basic");
  const [showSMSDialog, setShowSMSDialog] = useState(false);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [calculationResult, setCalculationResult] =
    useState<CalculationResult | null>(null);

  // Versioning system - cloud-based
  const [quoteVersions, setQuoteVersions] = useState<QuoteVersion[]>([]);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [comparingVersion, setComparingVersion] = useState<QuoteVersion | null>(
    null,
  );
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  // Load versions from cloud on open
  useEffect(() => {
    if (!open || !template.id) return;
    const loadVersions = async () => {
      setIsLoadingVersions(true);
      try {
        const { data, error } = await (supabase as any)
          .from("quote_template_versions")
          .select("*")
          .eq("template_id", template.id)
          .order("version_number", { ascending: false })
          .limit(20);
        if (error) {
          console.error("Error loading versions:", error);
          return;
        }
        if (data && data.length > 0) {
          setQuoteVersions(
            data.map((v: any) => ({
              id: v.id,
              timestamp: v.created_at,
              label: v.label || `גרסה ${v.version_number}`,
              data: v.snapshot || {},
            })),
          );
        }
      } catch (e) {
        console.error("Failed to load versions:", e);
      } finally {
        setIsLoadingVersions(false);
      }
    };
    loadVersions();
  }, [open, template.id]);

  // Preview device
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");

  // Draggable sections (block editor order)
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    "stages",
    "payments",
    "textboxes",
    "upgrades",
  ]);
  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSectionOrder((prev) => {
        const oldIdx = prev.indexOf(String(active.id));
        const newIdx = prev.indexOf(String(over.id));
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }, []);

  // Enhanced signature
  const [clientSignatureData, setClientSignatureData] = useState<string | null>(
    null,
  );
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);

  // Track changes
  const addChangeRecord = (
    field: string,
    oldValue: string,
    newValue: string,
  ) => {
    const record: ChangeRecord = {
      id: Date.now().toString(),
      timestamp: new Date(),
      field,
      oldValue,
      newValue,
      user: "משתמש נוכחי",
      action: "edit",
    };
    setChangeHistory((prev) => [record, ...prev].slice(0, 50)); // Keep last 50 changes
  };

  // Calculate quote total
  useEffect(() => {
    const subtotal = editedTemplate.stages.reduce(
      (sum, stage) =>
        sum +
        stage.items.reduce(
          (itemSum, item) => itemSum + (parseFloat((item as any).price) || 0),
          0,
        ),
      0,
    );
    const selectedOption = pricingOptions.find(
      (o) => o.id === selectedPricingOption,
    );
    const discount = (selectedOption as any)?.discount || 0;
    const afterDiscount = subtotal * (1 - discount / 100);
    const vatRate = editedTemplate.vat_rate || 17;
    const vat = afterDiscount * (vatRate / 100);
    const total = afterDiscount + vat;

    setCalculationResult({
      subtotal,
      discount,
      afterDiscount,
      vat,
      vatRate,
      total,
    });
  }, [
    editedTemplate.stages,
    selectedPricingOption,
    pricingOptions,
    editedTemplate.vat_rate,
  ]);

  const applyColorTheme = (theme: (typeof colorThemes)[0]) => {
    setDesignSettings({
      ...designSettings,
      primaryColor: theme.primary,
      secondaryColor: theme.secondary,
      accentColor: theme.accent,
      headerBackground: theme.headerBg,
    });
    toast({
      title: "ערכת צבעים הוחלה",
      description: `נבחרה ערכת "${theme.name}"`,
    });
  };

  // === Versioning - Cloud Save ===
  const saveVersion = async (label?: string) => {
    if (!editedTemplate.id) {
      toast({
        title: "שגיאה",
        description: "יש לשמור את ההצעה קודם לפני שמירת גרסה",
        variant: "destructive",
      });
      return;
    }
    setIsSavingVersion(true);
    try {
      // First save the current state to cloud
      await handleSave();

      const snapshot = {
        stages: JSON.parse(JSON.stringify(editedTemplate.stages)),
        paymentSteps: JSON.parse(JSON.stringify(paymentSteps)),
        textBoxes: JSON.parse(JSON.stringify(textBoxes)),
        designSettings: { ...designSettings },
        basePrice: editedTemplate.base_price || 35000,
        upgrades: JSON.parse(JSON.stringify(upgrades)),
        pricingTiers: JSON.parse(JSON.stringify(pricingTiers)),
        projectDetails: { ...projectDetails },
      };

      // Get the next version number
      const { data: maxData } = await (supabase as any)
        .from("quote_template_versions")
        .select("version_number")
        .eq("template_id", editedTemplate.id)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextNum =
        (maxData && maxData.length > 0 ? maxData[0].version_number : 0) + 1;
      const versionLabel = label || `גרסה ${nextNum}`;

      const { data: inserted, error } = await (supabase as any)
        .from("quote_template_versions")
        .insert([
          {
            template_id: editedTemplate.id,
            version_number: nextNum,
            label: versionLabel,
            snapshot: snapshot,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const newVersion: QuoteVersion = {
        id: inserted.id,
        timestamp: inserted.created_at,
        label: versionLabel,
        data: snapshot,
      };
      setQuoteVersions((prev) => [newVersion, ...prev].slice(0, 20));
      toast({ title: "גרסה נשמרה בענן ☁️", description: versionLabel });
    } catch (err: any) {
      console.error("Save version error:", err);
      toast({
        title: "שגיאה בשמירת גרסה",
        description: err?.message || "לא ניתן לשמור גרסה",
        variant: "destructive",
      });
    } finally {
      setIsSavingVersion(false);
    }
  };

  const restoreVersion = (version: QuoteVersion) => {
    if (version.data.stages)
      setEditedTemplate((prev) => ({
        ...prev,
        stages: version.data.stages,
        base_price: version.data.basePrice || prev.base_price,
      }));
    if (version.data.paymentSteps) setPaymentSteps(version.data.paymentSteps);
    if (version.data.textBoxes) setTextBoxes(version.data.textBoxes);
    if (version.data.designSettings)
      setDesignSettings(version.data.designSettings);
    if (version.data.upgrades)
      (window as any).__upgrades = version.data.upgrades;
    if (version.data.pricingTiers)
      (window as any).__pricingTiers = version.data.pricingTiers;
    if (version.data.projectDetails)
      setProjectDetails(version.data.projectDetails);
    toast({ title: "גרסה שוחזרה", description: version.label });
    setShowVersionDialog(false);
  };

  const deleteVersion = async (versionId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("quote_template_versions")
        .delete()
        .eq("id", versionId);
      if (error) throw error;
      setQuoteVersions((prev) => prev.filter((v) => v.id !== versionId));
      toast({ title: "גרסה נמחקה" });
    } catch {
      toast({ title: "שגיאה במחיקת גרסה", variant: "destructive" });
    }
  };

  // === Enhanced Export: WhatsApp file ===
  const handleShareWhatsAppFile = async () => {
    try {
      const html = generateHtmlContent();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const file = new Blob([blob], { type: "text/html" }) as any;
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: editedTemplate.name,
          text: `הצעת מחיר: ${editedTemplate.name}`,
        });
        toast({ title: "נשלח", description: "הקובץ שותף בהצלחה" });
      } else {
        // Fallback: download + open WhatsApp
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "הקובץ הורד", description: "שתף את הקובץ דרך וואטסאפ" });
      }
    } catch (err) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשתף",
        variant: "destructive",
      });
    }
  };

  // === Export Excel summary ===
  const handleExportExcel = () => {
    const rows = [
      ["הצעת מחיר", editedTemplate.name],
      ["לקוח", projectDetails.clientName],
      ["תאריך", new Date().toLocaleDateString("he-IL")],
      [""],
      ["שלבי עבודה", "פריטים"],
      ...editedTemplate.stages.map((s) => [
        s.name,
        s.items.map((i) => i.text).join(", "),
      ]),
      [""],
      ["סדר תשלומים", "אחוז", "סכום"],
      ...paymentSteps.map((s) => [
        s.name,
        `${s.percentage}%`,
        `₪${Math.round((basePrice * s.percentage) / 100).toLocaleString()}`,
      ]),
      [""],
      ['סה"כ לפני מע"מ', "", `₪${basePrice.toLocaleString()}`],
      [
        'מע"מ',
        `${editedTemplate.vat_rate || 17}%`,
        `₪${Math.round((basePrice * (editedTemplate.vat_rate || 17)) / 100).toLocaleString()}`,
      ],
      [
        'סה"כ כולל מע"מ',
        "",
        `₪${Math.round(basePrice * (1 + (editedTemplate.vat_rate || 17) / 100)).toLocaleString()}`,
      ],
    ];
    const csv = "\ufeff" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${editedTemplate.name || "הצעת-מחיר"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "יוצא Excel", description: "קובץ CSV נוצר בהצלחה" });
  };

  // === Signed PDF export ===
  const handleExportSignedPdf = () => {
    const html = generateHtmlContent();
    const signatureHtml = signatureData
      ? `
      <div style="margin-top: 40px; padding: 20px; border-top: 2px solid #eee;">
        <h3 style="color: ${designSettings.primaryColor};">חתימה דיגיטלית</h3>
        <img src="${signatureData}" style="max-width: 300px; max-height: 100px;" />
        <p style="color: #888; font-size: 12px;">חתום ביום ${new Date().toLocaleDateString("he-IL")} בשעה ${new Date().toLocaleTimeString("he-IL")}</p>
      </div>
    `
      : "";
    const clientSigHtml = clientSignatureData
      ? `
      <div style="margin-top: 20px; padding: 20px; border-top: 1px solid #eee;">
        <h3 style="color: ${designSettings.primaryColor};">חתימת לקוח</h3>
        <img src="${clientSignatureData}" style="max-width: 300px; max-height: 100px;" />
        <p style="color: #888; font-size: 12px;">חתם: ${projectDetails.clientName || "לקוח"}</p>
      </div>
    `
      : "";
    const fullHtml = html.replace(
      "</body>",
      `${signatureHtml}${clientSigHtml}</body>`,
    );
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    toast({ title: "PDF חתום", description: "חלון הדפסה נפתח עם חתימות" });
  };

  const generateAILogo = async (
    companyName: string,
    style: string,
    color: string,
  ) => {
    setIsGeneratingLogo(true);
    try {
      // Generate SVG-based logo as fallback
      const firstLetter = companyName.charAt(0).toUpperCase();
      const styles: Record<string, string> = {
        modern: `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${color}"/><stop offset="100%" style="stop-color:${color}88"/></linearGradient></defs><rect width="120" height="120" rx="24" fill="url(#grad)"/><text x="60" y="78" font-family="Heebo" font-size="60" font-weight="bold" fill="white" text-anchor="middle">${firstLetter}</text></svg>`,
        classic: `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="55" fill="${color}" stroke="${color}" stroke-width="3"/><circle cx="60" cy="60" r="45" fill="white"/><text x="60" y="78" font-family="David Libre" font-size="50" font-weight="bold" fill="${color}" text-anchor="middle">${firstLetter}</text></svg>`,
        creative: `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><polygon points="60,5 110,90 10,90" fill="${color}"/><text x="60" y="80" font-family="Rubik" font-size="40" font-weight="bold" fill="white" text-anchor="middle">${firstLetter}</text></svg>`,
        professional: `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="${color}"/><rect x="10" y="10" width="100" height="100" fill="white"/><text x="60" y="78" font-family="Assistant" font-size="55" font-weight="bold" fill="${color}" text-anchor="middle">${firstLetter}</text></svg>`,
      };
      const svg = styles[style] || styles["modern"];
      const dataUrl =
        "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
      setDesignSettings({ ...designSettings, logoUrl: dataUrl });
      toast({ title: "לוגו נוצר", description: "הלוגו נוצר בהצלחה" });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור לוגו",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLogo(false);
      setShowAILogoDialog(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        hideClose
        dir="rtl"
        className="flex flex-col gap-0 overflow-hidden border-0 p-0"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          maxWidth: "none",
          zIndex: 300,
        }}
      >
        {/* Client Selector Dialog */}
        <ClientSelector
          clients={allClients}
          selectedClient={projectDetails.clientId}
          onSelect={handleClientSelect}
          open={showClientSelector}
          onOpenChange={setShowClientSelector}
        />

        {/* Email Dialog */}
        <EmailDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          clients={allClients}
          onSend={handleSendEmail}
          templateName={editedTemplate.name}
        />

        {/* Gold Header */}
        {/* Logo Above Header */}
        {designSettings.showLogo &&
          designSettings.logoUrl &&
          (designSettings.logoPosition === "above-header" ||
            designSettings.logoPosition === "centered-above") && (
            <div
              className={`p-4 bg-white ${designSettings.logoPosition === "centered-above" ? "text-center" : ""}`}
            >
              <div
                className="relative group inline-block"
                style={{
                  width:
                    designSettings.logoWidth || designSettings.logoSize || 120,
                  height: designSettings.logoHeight || "auto",
                  cursor: "pointer",
                }}
                onClick={() => logoInputRef.current?.click()}
              >
                <img
                  src={designSettings.logoUrl}
                  alt="Logo"
                  style={{
                    width: "100%",
                    height: designSettings.logoHeight ? "100%" : "auto",
                    objectFit: designSettings.logoHeight
                      ? "contain"
                      : undefined,
                  }}
                />
                {/* Corner resize handle - maintains aspect ratio */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startWidth =
                      designSettings.logoWidth ||
                      designSettings.logoSize ||
                      120;
                    const parentEl = e.currentTarget.parentElement;
                    const startHeight =
                      designSettings.logoHeight || parentEl?.offsetHeight || 80;
                    const ratio = startHeight / startWidth;
                    const onMouseMove = (ev: MouseEvent) => {
                      const deltaX = ev.clientX - startX;
                      const newWidth = Math.min(
                        Math.max(startWidth + deltaX, 40),
                        500,
                      );
                      const newHeight = Math.round(newWidth * ratio);
                      setDesignSettings((prev) => ({
                        ...prev,
                        logoWidth: newWidth,
                        logoHeight: newHeight,
                        logoSize: newWidth,
                      }));
                    };
                    const onMouseUp = () => {
                      document.removeEventListener("mousemove", onMouseMove);
                      document.removeEventListener("mouseup", onMouseUp);
                    };
                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                  }}
                >
                  <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-gray-400 hover:border-blue-500 rounded-br-sm" />
                </div>
                {/* Right edge resize handle - maintains aspect ratio */}
                <div
                  className="absolute top-0 right-0 w-2 h-full cursor-ew-resize bg-transparent hover:bg-blue-500/30 transition-colors z-10 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startWidth =
                      designSettings.logoWidth ||
                      designSettings.logoSize ||
                      120;
                    const parentEl = e.currentTarget.parentElement;
                    const startHeight =
                      designSettings.logoHeight || parentEl?.offsetHeight || 80;
                    const ratio = startHeight / startWidth;
                    const onMouseMove = (ev: MouseEvent) => {
                      const delta = ev.clientX - startX;
                      const newWidth = Math.min(
                        Math.max(startWidth + delta, 40),
                        500,
                      );
                      const newHeight = Math.round(newWidth * ratio);
                      setDesignSettings((prev) => ({
                        ...prev,
                        logoWidth: newWidth,
                        logoHeight: newHeight,
                        logoSize: newWidth,
                      }));
                    };
                    const onMouseUp = () => {
                      document.removeEventListener("mousemove", onMouseMove);
                      document.removeEventListener("mouseup", onMouseUp);
                    };
                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                  }}
                />
              </div>
            </div>
          )}

        <div
          className={`shrink-0 text-white ${designSettings.logoPosition === "full-width" ? "p-0 overflow-hidden relative" : "p-6"} ${designSettings.showHeaderStrip === false && designSettings.logoPosition !== "full-width" ? "bg-white border-b-2" : ""}`}
          style={{
            background:
              designSettings.logoPosition === "full-width"
                ? "transparent"
                : designSettings.showHeaderStrip !== false
                  ? designSettings.headerBackground
                  : "white",
            borderColor:
              designSettings.logoPosition !== "full-width"
                ? designSettings.primaryColor
                : undefined,
          }}
        >
          {/* Full Width Logo - Inside header, spanning full width */}
          {designSettings.showLogo &&
            designSettings.logoUrl &&
            designSettings.logoPosition === "full-width" && (
              <div
                className="relative group"
                style={{
                  width: "100%",
                  margin: "0 auto",
                  cursor: "pointer",
                }}
                onClick={() => logoInputRef.current?.click()}
              >
                <img
                  src={designSettings.logoUrl}
                  alt="Logo"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <div className="bg-white/80 text-black text-xs px-2 py-1 rounded shadow">
                    לחץ להחלפה
                  </div>
                </div>
              </div>
            )}
          {/* Regular header content - only show when not full-width logo */}
          {designSettings.logoPosition !== "full-width" && (
            <div className="flex justify-between items-start max-w-6xl mx-auto">
              <div className="flex items-center gap-4">
                {designSettings.showLogo &&
                  (!designSettings.logoPosition ||
                    designSettings.logoPosition === "inside-header") && (
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {designSettings.logoUrl ? (
                        <div
                          className="relative"
                          style={{
                            width:
                              designSettings.logoWidth ||
                              designSettings.logoSize ||
                              120,
                            height: designSettings.logoHeight || "auto",
                          }}
                        >
                          <img
                            src={designSettings.logoUrl}
                            alt="Logo"
                            style={{
                              width: "100%",
                              height: designSettings.logoHeight
                                ? "100%"
                                : "auto",
                              objectFit: designSettings.logoHeight
                                ? "contain"
                                : undefined,
                            }}
                            className="object-contain"
                          />
                          {/* Corner resize handle for regular logo - maintains aspect ratio */}
                          <div
                            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const startX = e.clientX;
                              const startWidth =
                                designSettings.logoWidth ||
                                designSettings.logoSize ||
                                120;
                              const parentEl = e.currentTarget.parentElement;
                              const startHeight =
                                designSettings.logoHeight ||
                                parentEl?.offsetHeight ||
                                80;
                              const ratio = startHeight / startWidth;
                              const onMouseMove = (ev: MouseEvent) => {
                                const deltaX = ev.clientX - startX;
                                const newWidth = Math.min(
                                  Math.max(startWidth + deltaX, 40),
                                  500,
                                );
                                const newHeight = Math.round(newWidth * ratio);
                                setDesignSettings((prev) => ({
                                  ...prev,
                                  logoWidth: newWidth,
                                  logoHeight: newHeight,
                                  logoSize: newWidth,
                                }));
                              };
                              const onMouseUp = () => {
                                document.removeEventListener(
                                  "mousemove",
                                  onMouseMove,
                                );
                                document.removeEventListener(
                                  "mouseup",
                                  onMouseUp,
                                );
                              };
                              document.addEventListener(
                                "mousemove",
                                onMouseMove,
                              );
                              document.addEventListener("mouseup", onMouseUp);
                            }}
                          >
                            <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-white/60 hover:border-blue-400 rounded-br-sm" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                          <Image className="h-8 w-8 text-white/60" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg pointer-events-none">
                        <Upload className="h-6 w-6" />
                      </div>
                    </div>
                  )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <div className="flex-1">
                  <Input
                    value={editedTemplate.name}
                    onChange={(e) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        name: e.target.value,
                      })
                    }
                    className="text-2xl font-bold bg-transparent border-0 text-white placeholder:text-white/60 p-0 h-auto focus-visible:ring-0"
                    placeholder="כותרת ההצעה"
                    dir="rtl"
                  />
                  <Input
                    value={editedTemplate.description || ""}
                    onChange={(e) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        description: e.target.value,
                      })
                    }
                    className="text-sm opacity-90 bg-transparent border-0 text-white placeholder:text-white/60 p-0 h-auto focus-visible:ring-0 mt-1"
                    placeholder="תיאור ההצעה"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base opacity-80">₪</span>
                    <Input
                      type="number"
                      value={editedTemplate.base_price || 35000}
                      onChange={(e) =>
                        setEditedTemplate({
                          ...editedTemplate,
                          base_price: parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-3xl font-bold bg-transparent border-0 text-white p-0 h-auto focus-visible:ring-0 w-32 text-left"
                    />
                    <span className="text-base opacity-80">+ מע״מ</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="border-b bg-white px-6">
            <TabsList className="h-12 bg-transparent gap-2">
              <TabsTrigger
                value="project"
                className="data-[state=active]:bg-[#DAA520]/10 data-[state=active]:text-[#B8860B]"
              >
                <User className="h-4 w-4 ml-2" />
                פרטי פרויקט
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="data-[state=active]:bg-[#DAA520]/10 data-[state=active]:text-[#B8860B]"
              >
                <FileText className="h-4 w-4 ml-2" />
                תוכן
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="data-[state=active]:bg-[#DAA520]/10 data-[state=active]:text-[#B8860B]"
              >
                <CreditCard className="h-4 w-4 ml-2" />
                תשלומים
              </TabsTrigger>
              <TabsTrigger
                value="design"
                className="data-[state=active]:bg-[#DAA520]/10 data-[state=active]:text-[#B8860B]"
              >
                <Palette className="h-4 w-4 ml-2" />
                עיצוב
              </TabsTrigger>
              <TabsTrigger
                value="logo-strip"
                className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
              >
                <Crop className="h-4 w-4 ml-2" />
                לוגו וסטריפ
              </TabsTrigger>
              <TabsTrigger
                value="strip-maker"
                className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700"
              >
                <Layers className="h-4 w-4 ml-2" />
                מכין סטריפים
              </TabsTrigger>
              <TabsTrigger
                value="text-boxes"
                className="data-[state=active]:bg-[#DAA520]/10 data-[state=active]:text-[#B8860B]"
              >
                <Type className="h-4 w-4 ml-2" />
                תיבות טקסט
              </TabsTrigger>
              <TabsTrigger
                value="tools"
                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
              >
                <Wrench className="h-4 w-4 ml-2" />
                כלים מתקדמים
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-[#DAA520]/10 data-[state=active]:text-[#B8860B]"
              >
                <Settings className="h-4 w-4 ml-2" />
                הגדרות
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
              >
                <Eye className="h-4 w-4 ml-2" />
                תצוגה מקדימה
              </TabsTrigger>
              <TabsTrigger
                value="split"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                <Columns className="h-4 w-4 ml-2" />
                עריכה + תצוגה
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Project Details Tab */}
          <TabsContent value="project" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <ProjectDetailsEditor
                  details={projectDetails}
                  onUpdate={setProjectDetails}
                  clients={allClients}
                  onOpenClientSelector={() => setShowClientSelector(true)}
                />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">💡 טיפ</h3>
                  <p className="text-sm text-blue-700">
                    לחץ על "בחר לקוח" כדי למלא את הפרטים אוטומטית מנתוני הלקוח
                    במערכת. תוכל גם להזין את הפרטים ידנית.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {/* סיכום הצעה */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">📊</span>סיכום הצעה
                  </h2>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-600">
                        בחר חבילה:
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPricingTiers([
                            ...pricingTiers,
                            {
                              id: Date.now().toString(),
                              name: "חבילה חדשה",
                              price: 0,
                            },
                          ])
                        }
                      >
                        <Plus className="h-3 w-3 ml-1" />
                        הוסף חבילה
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {pricingTiers.map((tier) => (
                        <div
                          key={tier.id}
                          className={`p-4 rounded-lg border-2 transition-all relative group cursor-pointer ${selectedTier === tier.name ? "border-[#DAA520] bg-[#DAA520]/5" : "border-gray-200 hover:border-gray-300"}`}
                          onClick={() => setSelectedTier(tier.name)}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-1 left-1 h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPricingTiers(
                                pricingTiers.filter((t) => t.id !== tier.id),
                              );
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Input
                            value={tier.name}
                            onChange={(e) =>
                              setPricingTiers(
                                pricingTiers.map((t) =>
                                  t.id === tier.id
                                    ? { ...t, name: e.target.value }
                                    : t,
                                ),
                              )
                            }
                            className="font-semibold border-0 p-0 h-auto text-center focus-visible:ring-0 bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                            dir="rtl"
                          />
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-[#B8860B]">₪</span>
                            <Input
                              type="number"
                              value={tier.price}
                              onChange={(e) =>
                                setPricingTiers(
                                  pricingTiers.map((t) =>
                                    t.id === tier.id
                                      ? {
                                          ...t,
                                          price: parseInt(e.target.value) || 0,
                                        }
                                      : t,
                                  ),
                                )
                              }
                              className="font-bold text-lg text-[#B8860B] border-0 p-0 h-auto text-center focus-visible:ring-0 bg-transparent w-24"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Upgrades */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-600">
                        שידורגים אופציונליים:
                      </label>
                      <Button size="sm" variant="outline" onClick={addUpgrade}>
                        <Plus className="h-3 w-3 ml-1" />
                        הוסף שידורג
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {upgrades.map((upgrade) => (
                        <div
                          key={upgrade.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 group"
                        >
                          <input
                            type="checkbox"
                            checked={upgrade.enabled}
                            onChange={(e) =>
                              setUpgrades(
                                upgrades.map((u) =>
                                  u.id === upgrade.id
                                    ? { ...u, enabled: e.target.checked }
                                    : u,
                                ),
                              )
                            }
                            className="rounded border-gray-300 text-[#DAA520]"
                          />
                          <Input
                            value={upgrade.name}
                            onChange={(e) =>
                              setUpgrades(
                                upgrades.map((u) =>
                                  u.id === upgrade.id
                                    ? { ...u, name: e.target.value }
                                    : u,
                                ),
                              )
                            }
                            className="flex-1 border-0 p-0 h-auto focus-visible:ring-0"
                            dir="rtl"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-[#B8860B]">₪</span>
                            <Input
                              type="number"
                              value={upgrade.price}
                              onChange={(e) =>
                                setUpgrades(
                                  upgrades.map((u) =>
                                    u.id === upgrade.id
                                      ? {
                                          ...u,
                                          price: parseInt(e.target.value) || 0,
                                        }
                                      : u,
                                  ),
                                )
                              }
                              className="w-20 text-[#B8860B] font-semibold border-0 p-0 h-auto focus-visible:ring-0"
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500"
                            onClick={() =>
                              setUpgrades(
                                upgrades.filter((u) => u.id !== upgrade.id),
                              )
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Text boxes before stages */}
                {textBoxes
                  .filter((tb) => tb.position === "before-stages")
                  .map((tb) => (
                    <TextBoxEditor
                      key={tb.id}
                      textBox={tb}
                      onUpdate={(updated) =>
                        setTextBoxes(
                          textBoxes.map((t) => (t.id === tb.id ? updated : t)),
                        )
                      }
                      onDelete={() =>
                        setTextBoxes(textBoxes.filter((t) => t.id !== tb.id))
                      }
                    />
                  ))}
                {/* Stages */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">שלבי העבודה</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#DAA520] text-[#B8860B]"
                      onClick={addStage}
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      הוסף שלב
                    </Button>
                  </div>
                  {editedTemplate.stages.map((stage, index) => (
                    <StageEditor
                      key={stage.id}
                      stage={stage}
                      onUpdate={(updated) => updateStage(stage.id, updated)}
                      onDelete={() => deleteStage(stage.id)}
                      onDuplicate={() => duplicateStage(stage.id)}
                      onMoveUp={() => moveStage(stage.id, "up")}
                      onMoveDown={() => moveStage(stage.id, "down")}
                      isFirst={index === 0}
                      isLast={index === editedTemplate.stages.length - 1}
                    />
                  ))}
                </div>
                {/* Text boxes after stages */}
                {textBoxes
                  .filter((tb) => tb.position === "after-stages")
                  .map((tb) => (
                    <TextBoxEditor
                      key={tb.id}
                      textBox={tb}
                      onUpdate={(updated) =>
                        setTextBoxes(
                          textBoxes.map((t) => (t.id === tb.id ? updated : t)),
                        )
                      }
                      onDelete={() =>
                        setTextBoxes(textBoxes.filter((t) => t.id !== tb.id))
                      }
                    />
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <CreditCard className="h-6 w-6 text-[#B8860B]" />
                      סדר תשלומים
                    </h2>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          totalPaymentPercentage === 100
                            ? "default"
                            : "destructive"
                        }
                        className={
                          totalPaymentPercentage === 100 ? "bg-green-500" : ""
                        }
                      >
                        סה"כ: {totalPaymentPercentage}%
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addPaymentStep}
                      >
                        <Plus className="h-4 w-4 ml-1" />
                        הוסף שלב
                      </Button>
                    </div>
                  </div>
                  {totalPaymentPercentage !== 100 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                      ⚠️ סכום האחוזים צריך להיות 100%. כרגע:{" "}
                      {totalPaymentPercentage}%
                    </div>
                  )}
                  <div className="space-y-3">
                    {paymentSteps.map((step) => (
                      <PaymentStepEditor
                        key={step.id}
                        step={step}
                        onUpdate={(updated) =>
                          setPaymentSteps(
                            paymentSteps.map((s) =>
                              s.id === step.id ? updated : s,
                            ),
                          )
                        }
                        onDelete={() =>
                          setPaymentSteps(
                            paymentSteps.filter((s) => s.id !== step.id),
                          )
                        }
                      />
                    ))}
                  </div>
                  {/* Summary */}
                  <div className="mt-6 pt-4 border-t">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">סיכום תשלומים</h3>
                      <div className="space-y-2 text-sm">
                        {paymentSteps.map((step) => (
                          <div key={step.id} className="flex justify-between">
                            <span>
                              {step.name} ({step.percentage}%)
                            </span>
                            <span className="font-semibold">
                              ₪
                              {Math.round(
                                (basePrice * step.percentage) / 100,
                              ).toLocaleString()}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t font-bold text-lg">
                          <span>סה"כ</span>
                          <span>₪{basePrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {/* Logo with AI Generation */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Image className="h-6 w-6 text-[#B8860B]" />
                    לוגו
                  </h2>
                  <div className="flex items-start gap-6">
                    <div
                      className="relative w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#DAA520] transition-colors"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {isConvertingFile ? (
                        <div className="text-center text-gray-400">
                          <div className="h-8 w-8 mx-auto mb-2 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs">ממיר קובץ...</span>
                        </div>
                      ) : designSettings.logoUrl ? (
                        <img
                          src={designSettings.logoUrl}
                          alt="Logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <span className="text-xs">העלה לוגו</span>
                          <span className="text-[10px] block text-gray-300 mt-1">
                            PDF, Word, HTML, תמונה
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={designSettings.showLogo}
                          onCheckedChange={(checked) =>
                            setDesignSettings({
                              ...designSettings,
                              showLogo: checked,
                            })
                          }
                        />
                        <Label>הצג לוגו בהצעה</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAILogoDialog(true)}
                        >
                          <Sparkles className="h-4 w-4 ml-1" />
                          צור לוגו עם AI
                        </Button>
                        {designSettings.logoUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDesignSettings({
                                ...designSettings,
                                logoUrl: "",
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            הסר
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Logo Settings */}
                  {designSettings.logoUrl && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                      <h3 className="font-semibold text-sm">הגדרות לוגו</h3>

                      {/* Logo Size */}
                      <div>
                        <Label className="text-sm text-gray-600">
                          גודל לוגו: {designSettings.logoSize || 120}px
                        </Label>
                        <Slider
                          value={[designSettings.logoSize || 120]}
                          onValueChange={([v]) =>
                            setDesignSettings({
                              ...designSettings,
                              logoSize: v,
                            })
                          }
                          min={60}
                          max={400}
                          step={10}
                          className="mt-2"
                        />
                      </div>

                      {/* Logo Position */}
                      <div>
                        <Label className="text-sm text-gray-600">
                          מיקום לוגו
                        </Label>
                        <select
                          value={designSettings.logoPosition || "inside-header"}
                          onChange={(e) =>
                            setDesignSettings({
                              ...designSettings,
                              logoPosition: e.target.value as any,
                            })
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                        >
                          <option value="inside-header">בתוך הסטריפ</option>
                          <option value="above-header">מעל הסטריפ</option>
                          <option value="centered-above">
                            ממורכז מעל הסטריפ
                          </option>
                          <option value="full-width">רוחב מלא בסטריפ</option>
                        </select>
                      </div>

                      {/* Header Strip Height - only for full-width mode */}
                      {designSettings.logoPosition === "full-width" && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm text-gray-600">
                              גובה סטריפ:{" "}
                              {designSettings.headerStripHeight || 150}px
                            </Label>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                // Auto-fit based on logo
                                if (designSettings.logoUrl) {
                                  const img = new window.Image();
                                  img.onload = () => {
                                    const containerWidth = 800;
                                    const aspectRatio = img.height / img.width;
                                    const calculatedHeight = Math.round(
                                      containerWidth * aspectRatio,
                                    );
                                    console.log(
                                      "[AUTO-FIT] Calculated height:",
                                      calculatedHeight,
                                    );
                                    setDesignSettings((prev) => ({
                                      ...prev,
                                      headerStripHeight: Math.min(
                                        Math.max(calculatedHeight, 80),
                                        250,
                                      ),
                                    }));
                                  };
                                  img.src = designSettings.logoUrl;
                                }
                              }}
                            >
                              <Maximize2 className="h-3 w-3 ml-1" />
                              התאם אוטומטית
                            </Button>
                          </div>
                          <Slider
                            value={[designSettings.headerStripHeight || 150]}
                            onValueChange={([v]) =>
                              setDesignSettings({
                                ...designSettings,
                                headerStripHeight: v,
                              })
                            }
                            min={80}
                            max={250}
                            step={10}
                            className="mt-2"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Header Strip Toggle */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={designSettings.showHeaderStrip !== false}
                        onCheckedChange={(checked) =>
                          setDesignSettings({
                            ...designSettings,
                            showHeaderStrip: checked,
                          })
                        }
                      />
                      <Label>הצג סטריפ כותרת צבעוני</Label>
                    </div>
                    {designSettings.showHeaderStrip === false && (
                      <p className="text-xs text-gray-500 mt-2">
                        הכותרת תוצג ללא רקע צבעוני, רק עם קו תחתון
                      </p>
                    )}
                  </div>
                </div>

                {/* Color Themes */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-[#B8860B]" />
                    ערכות צבעים מוכנות
                  </h2>
                  <div className="grid grid-cols-4 gap-3">
                    {colorThemes.map((theme) => (
                      <button
                        key={theme.name}
                        className="p-3 rounded-lg border-2 hover:scale-105 transition-all text-center"
                        style={{
                          borderColor:
                            designSettings.primaryColor === theme.primary
                              ? theme.primary
                              : "transparent",
                          background: `linear-gradient(135deg, ${theme.primary}20, ${theme.secondary}20)`,
                        }}
                        onClick={() => applyColorTheme(theme)}
                      >
                        <div className="flex justify-center gap-1 mb-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: theme.secondary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: theme.accent }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {theme.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Palette className="h-6 w-6 text-[#B8860B]" />
                    צבעים מותאמים
                  </h2>
                  <div className="grid grid-cols-3 gap-6">
                    <ColorPicker
                      label="צבע ראשי"
                      value={designSettings.primaryColor}
                      onChange={(color) =>
                        setDesignSettings({
                          ...designSettings,
                          primaryColor: color,
                        })
                      }
                    />
                    <ColorPicker
                      label="צבע משני"
                      value={designSettings.secondaryColor}
                      onChange={(color) =>
                        setDesignSettings({
                          ...designSettings,
                          secondaryColor: color,
                        })
                      }
                    />
                    <ColorPicker
                      label="צבע הדגשה"
                      value={designSettings.accentColor}
                      onChange={(color) =>
                        setDesignSettings({
                          ...designSettings,
                          accentColor: color,
                        })
                      }
                    />
                  </div>
                  <div className="mt-6 pt-4 border-t">
                    <Label className="mb-2 block">רקע הכותרת</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        "linear-gradient(135deg, #B8860B 0%, #DAA520 50%, #F4C430 100%)",
                        "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                        "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
                        "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                        "#B8860B",
                        "#1e40af",
                        "#16a34a",
                        "#374151",
                      ].map((bg, i) => (
                        <button
                          key={i}
                          className={`h-12 rounded-lg border-2 transition-all ${designSettings.headerBackground === bg ? "border-black scale-105" : "border-transparent"}`}
                          style={{ background: bg }}
                          onClick={() =>
                            setDesignSettings({
                              ...designSettings,
                              headerBackground: bg,
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3D Effects */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Box className="h-6 w-6 text-[#B8860B]" />
                    אפקטי תלת מימד
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>הגבהה (Elevation): {effects3D.elevation}</Label>
                      <Slider
                        value={[effects3D.elevation]}
                        onValueChange={([v]) =>
                          setEffects3D({ ...effects3D, elevation: v })
                        }
                        min={0}
                        max={5}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>עוצמת צל: {effects3D.shadowIntensity}%</Label>
                      <Slider
                        value={[effects3D.shadowIntensity]}
                        onValueChange={([v]) =>
                          setEffects3D({ ...effects3D, shadowIntensity: v })
                        }
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={effects3D.useGradient}
                        onCheckedChange={(checked) =>
                          setEffects3D({ ...effects3D, useGradient: checked })
                        }
                      />
                      <Label>השתמש בשיפוע (גרדיאנט)</Label>
                    </div>
                    {effects3D.useGradient && (
                      <div className="space-y-2">
                        <Label>זווית שיפוע: {effects3D.gradientAngle}°</Label>
                        <Slider
                          value={[effects3D.gradientAngle]}
                          onValueChange={([v]) =>
                            setEffects3D({ ...effects3D, gradientAngle: v })
                          }
                          min={0}
                          max={360}
                          step={15}
                        />
                      </div>
                    )}
                    {/* Preview */}
                    <div className="p-4 rounded-lg bg-gray-100">
                      <Label className="mb-2 block text-sm">
                        תצוגה מקדימה:
                      </Label>
                      <div
                        className="h-20 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{
                          background: effects3D.useGradient
                            ? `linear-gradient(${effects3D.gradientAngle}deg, ${designSettings.primaryColor}, ${designSettings.secondaryColor})`
                            : designSettings.primaryColor,
                          boxShadow: `0 ${effects3D.elevation * 4}px ${effects3D.elevation * 8}px rgba(0,0,0,${(effects3D.shadowIntensity / 100) * 0.5})`,
                        }}
                      >
                        דוגמה לאפקט 3D
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Type className="h-6 w-6 text-[#B8860B]" />
                    טיפוגרפיה
                  </h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>גופן (10 גופנים בעברית)</Label>
                      <Select
                        value={designSettings.fontFamily}
                        onValueChange={(v) =>
                          setDesignSettings({
                            ...designSettings,
                            fontFamily: v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem
                              key={font.value}
                              value={font.value}
                              style={{ fontFamily: font.value }}
                            >
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        גודל גופן בסיסי: {designSettings.fontSize}px
                      </Label>
                      <Slider
                        value={[designSettings.fontSize]}
                        onValueChange={([v]) =>
                          setDesignSettings({ ...designSettings, fontSize: v })
                        }
                        min={12}
                        max={24}
                        step={1}
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label>עיגול פינות: {designSettings.borderRadius}px</Label>
                    <Slider
                      value={[designSettings.borderRadius]}
                      onValueChange={([v]) =>
                        setDesignSettings({
                          ...designSettings,
                          borderRadius: v,
                        })
                      }
                      min={0}
                      max={32}
                      step={2}
                    />
                  </div>
                  {/* Font Preview */}
                  <div className="mt-4 p-4 rounded-lg bg-gray-100">
                    <p
                      className="text-lg"
                      style={{ fontFamily: designSettings.fontFamily }}
                    >
                      זוהי טקסט לדוגמה בגופן שנבחר
                    </p>
                    <p
                      className="text-sm text-gray-500"
                      style={{ fontFamily: designSettings.fontFamily }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Logo & Strip Tab */}
          <TabsContent
            value="logo-strip"
            className="flex-1 m-0 overflow-hidden"
          >
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {/* Logo Crop / Adjust Section */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Crop className="h-6 w-6 text-orange-600" />
                    חיתוך והתאמת לוגו
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    העלה קובץ תמונה (מ-PDF, Word, צילום מסך) וחתוך את החלק הרצוי
                    ללוגו
                  </p>

                  {/* Upload for crop */}
                  <div className="flex gap-3 mb-4 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => cropFileInputRef.current?.click()}
                      disabled={isConvertingFile}
                    >
                      {isConvertingFile ? (
                        <div className="h-4 w-4 ml-2 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 ml-2" />
                      )}
                      {isConvertingFile ? "ממיר קובץ..." : "העלה קובץ לחיתוך"}
                    </Button>
                    {designSettings.logoUrl && !cropImageSrc && (
                      <Button
                        variant="outline"
                        onClick={loadCurrentLogoForCrop}
                      >
                        <Image className="h-4 w-4 ml-2" />
                        ערוך לוגו נוכחי
                      </Button>
                    )}
                    <input
                      ref={cropFileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={handleCropFileUpload}
                    />
                  </div>

                  {/* Crop Canvas Area */}
                  {cropImageSrc ? (
                    <div className="space-y-4">
                      {/* Crop Controls */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <ZoomOut className="h-4 w-4 text-gray-500" />
                          <Slider
                            value={[cropZoom * 100]}
                            onValueChange={([v]) => setCropZoom(v / 100)}
                            min={50}
                            max={300}
                            step={10}
                            className="w-32"
                          />
                          <ZoomIn className="h-4 w-4 text-gray-500" />
                          <span className="text-xs text-gray-500 min-w-[40px]">
                            {Math.round(cropZoom * 100)}%
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCropRotation((r) => (r + 90) % 360)}
                        >
                          <RotateCw className="h-4 w-4 ml-1" />
                          סיבוב
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCropRegion({ x: 0, y: 0, w: 100, h: 100 })
                          }
                        >
                          <Maximize2 className="h-4 w-4 ml-1" />
                          אפס חיתוך
                        </Button>
                      </div>

                      {/* Visual Crop Area */}
                      <div
                        className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3C%2Fsvg%3E')]"
                        style={{ maxHeight: "400px", maxWidth: "100%" }}
                      >
                        <div
                          style={{
                            transform: `scale(${cropZoom}) rotate(${cropRotation}deg)`,
                            transformOrigin: "center center",
                            transition: "transform 0.2s ease",
                          }}
                        >
                          <img
                            src={cropImageSrc}
                            alt="Crop source"
                            className="max-w-full block mx-auto"
                            style={{ maxHeight: "350px" }}
                            draggable={false}
                          />
                        </div>
                        {/* Crop overlay */}
                        <div
                          className="absolute inset-0"
                          style={{ pointerEvents: "none" }}
                        >
                          {/* Dark overlay outside crop region */}
                          <div className="absolute inset-0 bg-black/40" />
                          {/* Clear crop window */}
                          <div
                            className="absolute border-2 border-white shadow-lg"
                            style={{
                              left: `${cropRegion.x}%`,
                              top: `${cropRegion.y}%`,
                              width: `${cropRegion.w}%`,
                              height: `${cropRegion.h}%`,
                              backgroundColor: "transparent",
                              boxShadow: `0 0 0 9999px rgba(0,0,0,0.4)`,
                              pointerEvents: "auto",
                              cursor: "move",
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setIsDraggingCrop(true);
                              setCropDragStart({ x: e.clientX, y: e.clientY });
                            }}
                          >
                            {/* Grid lines */}
                            <div className="absolute inset-0 pointer-events-none">
                              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/50" />
                              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/50" />
                              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/50" />
                              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/50" />
                            </div>
                            {/* Corner handles */}
                            {[
                              "top-left",
                              "top-right",
                              "bottom-left",
                              "bottom-right",
                            ].map((corner) => (
                              <div
                                key={corner}
                                className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm"
                                style={{
                                  ...(corner.includes("top")
                                    ? { top: -5 }
                                    : { bottom: -5 }),
                                  ...(corner.includes("left")
                                    ? { left: -5 }
                                    : { right: -5 }),
                                  cursor:
                                    corner === "top-left" ||
                                    corner === "bottom-right"
                                      ? "nwse-resize"
                                      : "nesw-resize",
                                  pointerEvents: "auto",
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const startX = e.clientX;
                                  const startY = e.clientY;
                                  const startRegion = { ...cropRegion };
                                  const parent =
                                    e.currentTarget.closest(".relative")!;
                                  const rect = parent.getBoundingClientRect();

                                  const onMove = (ev: MouseEvent) => {
                                    const dx =
                                      ((ev.clientX - startX) / rect.width) *
                                      100;
                                    const dy =
                                      ((ev.clientY - startY) / rect.height) *
                                      100;
                                    const nr = { ...startRegion };

                                    if (corner.includes("left")) {
                                      nr.x = Math.max(
                                        0,
                                        Math.min(
                                          startRegion.x + dx,
                                          startRegion.x + startRegion.w - 5,
                                        ),
                                      );
                                      nr.w =
                                        startRegion.w - (nr.x - startRegion.x);
                                    }
                                    if (corner.includes("right")) {
                                      nr.w = Math.max(
                                        5,
                                        Math.min(
                                          startRegion.w + dx,
                                          100 - startRegion.x,
                                        ),
                                      );
                                    }
                                    if (corner.includes("top")) {
                                      nr.y = Math.max(
                                        0,
                                        Math.min(
                                          startRegion.y + dy,
                                          startRegion.y + startRegion.h - 5,
                                        ),
                                      );
                                      nr.h =
                                        startRegion.h - (nr.y - startRegion.y);
                                    }
                                    if (corner.includes("bottom")) {
                                      nr.h = Math.max(
                                        5,
                                        Math.min(
                                          startRegion.h + dy,
                                          100 - startRegion.y,
                                        ),
                                      );
                                    }
                                    setCropRegion(nr);
                                  };
                                  const onUp = () => {
                                    window.removeEventListener(
                                      "mousemove",
                                      onMove,
                                    );
                                    window.removeEventListener("mouseup", onUp);
                                  };
                                  window.addEventListener("mousemove", onMove);
                                  window.addEventListener("mouseup", onUp);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        {/* Global mouse handlers for crop drag */}
                        {isDraggingCrop && (
                          <div
                            className="fixed inset-0 z-50"
                            style={{ cursor: "move" }}
                            onMouseMove={(e) => {
                              if (!isDraggingCrop) return;
                              const parent =
                                cropCanvasRef.current?.parentElement ||
                                e.currentTarget.previousElementSibling;
                              if (!parent) return;
                              const container = document.querySelector(
                                '[class*="relative border-2 border-gray-300"]',
                              );
                              if (!container) return;
                              const rect = container.getBoundingClientRect();
                              const dx =
                                ((e.clientX - cropDragStart.x) / rect.width) *
                                100;
                              const dy =
                                ((e.clientY - cropDragStart.y) / rect.height) *
                                100;
                              setCropRegion((prev) => ({
                                ...prev,
                                x: Math.max(
                                  0,
                                  Math.min(prev.x + dx, 100 - prev.w),
                                ),
                                y: Math.max(
                                  0,
                                  Math.min(prev.y + dy, 100 - prev.h),
                                ),
                              }));
                              setCropDragStart({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseUp={() => setIsDraggingCrop(false)}
                          />
                        )}
                      </div>

                      {/* Crop dimensions info */}
                      {cropImageDimensions.w > 0 && (
                        <div className="text-xs text-gray-500 flex items-center gap-4">
                          <span>
                            מקור: {cropImageDimensions.w} ×{" "}
                            {cropImageDimensions.h}px
                          </span>
                          <span>
                            חיתוך:{" "}
                            {Math.round(
                              (cropImageDimensions.w * cropRegion.w) / 100,
                            )}{" "}
                            ×{" "}
                            {Math.round(
                              (cropImageDimensions.h * cropRegion.h) / 100,
                            )}
                            px
                          </span>
                        </div>
                      )}

                      {/* Crop Region Sliders */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">
                            מיקום X: {Math.round(cropRegion.x)}%
                          </Label>
                          <Slider
                            value={[cropRegion.x]}
                            onValueChange={([v]) =>
                              setCropRegion((r) => ({
                                ...r,
                                x: Math.min(v, 100 - r.w),
                              }))
                            }
                            min={0}
                            max={95}
                            step={1}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">
                            מיקום Y: {Math.round(cropRegion.y)}%
                          </Label>
                          <Slider
                            value={[cropRegion.y]}
                            onValueChange={([v]) =>
                              setCropRegion((r) => ({
                                ...r,
                                y: Math.min(v, 100 - r.h),
                              }))
                            }
                            min={0}
                            max={95}
                            step={1}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">
                            רוחב: {Math.round(cropRegion.w)}%
                          </Label>
                          <Slider
                            value={[cropRegion.w]}
                            onValueChange={([v]) =>
                              setCropRegion((r) => ({
                                ...r,
                                w: Math.min(v, 100 - r.x),
                              }))
                            }
                            min={5}
                            max={100}
                            step={1}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">
                            גובה: {Math.round(cropRegion.h)}%
                          </Label>
                          <Slider
                            value={[cropRegion.h]}
                            onValueChange={([v]) =>
                              setCropRegion((r) => ({
                                ...r,
                                h: Math.min(v, 100 - r.y),
                              }))
                            }
                            min={5}
                            max={100}
                            step={1}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Apply / Cancel */}
                      <div className="flex gap-3">
                        <Button
                          onClick={applyCrop}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          <Check className="h-4 w-4 ml-2" />
                          החל חיתוך כלוגו
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCropImageSrc(null);
                            setCropRegion({ x: 0, y: 0, w: 100, h: 100 });
                            setCropZoom(1);
                            setCropRotation(0);
                          }}
                        >
                          ביטול
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400">
                      <Crop className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        העלה קובץ או ערוך את הלוגו הנוכחי
                      </p>
                      <p className="text-xs mt-1">
                        תומך ב: PDF, Word (.docx), HTML, תמונות (PNG, JPG, SVG,
                        WebP)
                      </p>
                    </div>
                  )}
                </div>

                {/* Strip Size Section */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Maximize2 className="h-6 w-6 text-blue-600" />
                    גודל סטריפ (פס עליון)
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    הגדר את מידות הסטריפ העליון שמכיל את הלוגו וכותרת ההצעה
                  </p>

                  {/* Strip Toggle */}
                  <div className="flex items-center gap-3 mb-6">
                    <Switch
                      checked={designSettings.showHeaderStrip !== false}
                      onCheckedChange={(checked) =>
                        setDesignSettings({
                          ...designSettings,
                          showHeaderStrip: checked,
                        })
                      }
                    />
                    <Label className="font-medium">הצג סטריפ עליון</Label>
                  </div>

                  {designSettings.showHeaderStrip !== false && (
                    <div className="space-y-6">
                      {/* Strip Height */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">
                            גובה סטריפ
                          </Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={designSettings.headerStripHeight || 150}
                              onChange={(e) =>
                                setDesignSettings({
                                  ...designSettings,
                                  headerStripHeight: Math.max(
                                    40,
                                    Math.min(
                                      500,
                                      parseInt(e.target.value) || 150,
                                    ),
                                  ),
                                })
                              }
                              className="w-20 text-center border rounded px-2 py-1 text-sm"
                            />
                            <span className="text-xs text-gray-500">px</span>
                          </div>
                        </div>
                        <Slider
                          value={[designSettings.headerStripHeight || 150]}
                          onValueChange={([v]) =>
                            setDesignSettings({
                              ...designSettings,
                              headerStripHeight: v,
                            })
                          }
                          min={40}
                          max={500}
                          step={5}
                          className="mt-1"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>40px</span>
                          <span>500px</span>
                        </div>
                      </div>

                      {/* Strip Width */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">
                            רוחב סטריפ
                          </Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={designSettings.stripWidth || 100}
                              onChange={(e) =>
                                setDesignSettings({
                                  ...designSettings,
                                  stripWidth: Math.max(
                                    50,
                                    Math.min(
                                      100,
                                      parseInt(e.target.value) || 100,
                                    ),
                                  ),
                                })
                              }
                              className="w-20 text-center border rounded px-2 py-1 text-sm"
                            />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                        </div>
                        <Slider
                          value={[designSettings.stripWidth || 100]}
                          onValueChange={([v]) =>
                            setDesignSettings({
                              ...designSettings,
                              stripWidth: v,
                            })
                          }
                          min={50}
                          max={100}
                          step={5}
                          className="mt-1"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Auto-fit button */}
                      {designSettings.logoUrl && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            if (designSettings.logoUrl) {
                              const img = new window.Image();
                              img.onload = () => {
                                const containerWidth = 800;
                                const aspectRatio = img.height / img.width;
                                const calculatedHeight = Math.round(
                                  containerWidth * aspectRatio,
                                );
                                setDesignSettings((prev) => ({
                                  ...prev,
                                  headerStripHeight: Math.min(
                                    Math.max(calculatedHeight, 40),
                                    500,
                                  ),
                                  stripWidth: 100,
                                }));
                              };
                              img.src = designSettings.logoUrl;
                            }
                          }}
                        >
                          <Maximize2 className="h-4 w-4 ml-2" />
                          התאם אוטומטית לגודל הלוגו
                        </Button>
                      )}

                      {/* Strip Preview */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">
                          תצוגה מקדימה
                        </Label>
                        <div
                          className="rounded-lg overflow-hidden border"
                          style={{
                            width: `${designSettings.stripWidth || 100}%`,
                            height: `${Math.min(designSettings.headerStripHeight || 150, 200)}px`,
                            background: `linear-gradient(135deg, ${designSettings.primaryColor || "#1A1A2E"}, ${designSettings.secondaryColor || "#16213E"})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                          }}
                        >
                          {designSettings.logoUrl ? (
                            <img
                              src={designSettings.logoUrl}
                              alt="Strip preview"
                              className="max-h-full max-w-full object-contain"
                              style={{
                                maxHeight: `${Math.min(designSettings.headerStripHeight || 150, 200) - 20}px`,
                              }}
                            />
                          ) : (
                            <span className="text-white/50 text-sm">סטריפ</span>
                          )}
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">
                          מידות מהירות
                        </Label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { label: "קטן", h: 80, w: 100 },
                            { label: "רגיל", h: 150, w: 100 },
                            { label: "גדול", h: 250, w: 100 },
                            { label: "בינוני צר", h: 150, w: 80 },
                            { label: "באנר רחב", h: 100, w: 100 },
                          ].map((preset) => (
                            <Button
                              key={preset.label}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() =>
                                setDesignSettings({
                                  ...designSettings,
                                  headerStripHeight: preset.h,
                                  stripWidth: preset.w,
                                })
                              }
                            >
                              {preset.label} ({preset.h}×{preset.w}%)
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Strip Maker Tab */}
          <TabsContent
            value="strip-maker"
            className="flex-1 m-0 overflow-hidden"
          >
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {/* Upload Source */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Layers className="h-6 w-6 text-teal-600" />
                    מכין סטריפים
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    העלה קובץ מכל פורמט (PDF, Word, HTML, תמונה) והכן ממנו סטריפ
                    במידות מדויקות
                  </p>

                  <div className="flex gap-3 mb-4 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => stripMakerInputRef.current?.click()}
                      disabled={isConvertingStrip}
                    >
                      {isConvertingStrip ? (
                        <div className="h-4 w-4 ml-2 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 ml-2" />
                      )}
                      {isConvertingStrip ? "ממיר..." : "העלה קובץ מקור"}
                    </Button>
                    {designSettings.logoUrl && !stripSourceImage && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setStripSourceImage(designSettings.logoUrl);
                          setStripOffsetX(0);
                          setStripOffsetY(0);
                          setStripScale(100);
                          const img = new window.Image();
                          img.onload = () =>
                            setStripSourceDimensions({
                              w: img.width,
                              h: img.height,
                            });
                          img.src = designSettings.logoUrl;
                        }}
                      >
                        <Image className="h-4 w-4 ml-2" />
                        השתמש בלוגו הנוכחי
                      </Button>
                    )}
                    {stripSourceImage && (
                      <Button
                        variant="outline"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          setStripSourceImage(null);
                          setStripSourceDimensions({ w: 0, h: 0 });
                        }}
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        נקה
                      </Button>
                    )}
                    <input
                      ref={stripMakerInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={handleStripFileUpload}
                    />
                  </div>

                  {stripSourceImage && stripSourceDimensions.w > 0 && (
                    <div className="text-xs text-gray-500 mb-2">
                      גודל מקור: {stripSourceDimensions.w} ×{" "}
                      {stripSourceDimensions.h}px
                    </div>
                  )}
                </div>

                {/* Strip Dimensions */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Maximize2 className="h-5 w-5 text-teal-600" />
                    מידות הסטריפ
                  </h3>

                  {/* Quick Presets */}
                  <div className="mb-6">
                    <Label className="text-sm text-gray-500 mb-2 block">
                      מידות מוכנות
                    </Label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { label: "באנר רחב", w: 800, h: 100 },
                        { label: "סטריפ רגיל", w: 800, h: 150 },
                        { label: "סטריפ גבוה", w: 800, h: 250 },
                        { label: "סטריפ גדול", w: 800, h: 350 },
                        { label: "ריבועי", w: 800, h: 800 },
                        { label: "Facebook Cover", w: 820, h: 312 },
                        { label: "LinkedIn Banner", w: 1584, h: 396 },
                        { label: "YouTube Banner", w: 2560, h: 423 },
                        { label: "Email Header", w: 600, h: 200 },
                        { label: "A4 Header", w: 794, h: 200 },
                      ].map((preset) => (
                        <Button
                          key={preset.label}
                          variant="outline"
                          size="sm"
                          className={`text-xs ${stripTargetWidth === preset.w && stripTargetHeight === preset.h ? "border-teal-500 bg-teal-50 text-teal-700" : ""}`}
                          onClick={() => {
                            setStripTargetWidth(preset.w);
                            setStripTargetHeight(preset.h);
                          }}
                        >
                          {preset.label}
                          <span className="text-[10px] text-gray-400 mr-1">
                            ({preset.w}×{preset.h})
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Dimensions */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">רוחב (px)</Label>
                        <input
                          type="number"
                          value={stripTargetWidth}
                          onChange={(e) =>
                            setStripTargetWidth(
                              Math.max(100, parseInt(e.target.value) || 800),
                            )
                          }
                          className="w-24 text-center border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <Slider
                        value={[stripTargetWidth]}
                        onValueChange={([v]) => setStripTargetWidth(v)}
                        min={200}
                        max={2560}
                        step={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">גובה (px)</Label>
                        <input
                          type="number"
                          value={stripTargetHeight}
                          onChange={(e) =>
                            setStripTargetHeight(
                              Math.max(40, parseInt(e.target.value) || 150),
                            )
                          }
                          className="w-24 text-center border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <Slider
                        value={[stripTargetHeight]}
                        onValueChange={([v]) => setStripTargetHeight(v)}
                        min={40}
                        max={1000}
                        step={5}
                      />
                    </div>
                  </div>
                </div>

                {/* Image Fit & Position Controls */}
                {stripSourceImage && (
                  <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Move className="h-5 w-5 text-teal-600" />
                      התאמת תמונה
                    </h3>

                    {/* Fit Mode */}
                    <div className="mb-4">
                      <Label className="text-sm text-gray-500 mb-2 block">
                        מצב התאמה
                      </Label>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          {
                            value: "contain" as const,
                            label: "הכל נראה",
                            desc: "כל התמונה נראית, עם שוליים",
                          },
                          {
                            value: "cover" as const,
                            label: "ממלא הכל",
                            desc: "ממלא את הסטריפ, חלקים ייחתכו",
                          },
                          {
                            value: "stretch" as const,
                            label: "מתיחה",
                            desc: "מותח בדיוק למידות",
                          },
                          {
                            value: "manual" as const,
                            label: "ידני",
                            desc: "שליטה מלאה על מיקום וגודל",
                          },
                        ].map((mode) => (
                          <Button
                            key={mode.value}
                            variant="outline"
                            size="sm"
                            className={`text-xs ${stripFitMode === mode.value ? "border-teal-500 bg-teal-50 text-teal-700" : ""}`}
                            onClick={() => setStripFitMode(mode.value)}
                            title={mode.desc}
                          >
                            {mode.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Scale - for contain and manual */}
                    {(stripFitMode === "contain" ||
                      stripFitMode === "manual") && (
                      <div className="mb-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">
                            גודל: {stripScale}%
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setStripScale(100)}
                          >
                            איפוס
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <ZoomOut className="h-4 w-4 text-gray-400" />
                          <Slider
                            value={[stripScale]}
                            onValueChange={([v]) => setStripScale(v)}
                            min={10}
                            max={400}
                            step={5}
                          />
                          <ZoomIn className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    )}

                    {/* Offset - for contain, cover, manual */}
                    {stripFitMode !== "stretch" && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            הזזה אופקית: {stripOffsetX}px
                          </Label>
                          <Slider
                            value={[stripOffsetX]}
                            onValueChange={([v]) => setStripOffsetX(v)}
                            min={-stripTargetWidth}
                            max={stripTargetWidth}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            הזזה אנכית: {stripOffsetY}px
                          </Label>
                          <Slider
                            value={[stripOffsetY]}
                            onValueChange={([v]) => setStripOffsetY(v)}
                            min={-stripTargetHeight}
                            max={stripTargetHeight}
                            step={1}
                          />
                        </div>
                      </div>
                    )}

                    {/* Background Color */}
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium">צבע רקע:</Label>
                      <input
                        type="color"
                        value={stripBgColor}
                        onChange={(e) => setStripBgColor(e.target.value)}
                        className="h-8 w-8 rounded cursor-pointer border"
                      />
                      <div className="flex gap-1">
                        {[
                          "#ffffff",
                          "#000000",
                          "#f5f5f5",
                          designSettings.primaryColor,
                          designSettings.secondaryColor,
                        ].map((c) => (
                          <button
                            key={c}
                            className={`w-6 h-6 rounded border ${stripBgColor === c ? "ring-2 ring-teal-500" : ""}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setStripBgColor(c)}
                          />
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setStripBgColor("transparent")}
                      >
                        שקוף
                      </Button>
                    </div>
                  </div>
                )}

                {/* Live Preview */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-teal-600" />
                    תצוגה מקדימה
                    <span className="text-xs text-gray-400 font-normal mr-auto">
                      {stripTargetWidth} × {stripTargetHeight}px
                    </span>
                  </h3>

                  <div
                    className="border-2 border-gray-200 rounded-lg overflow-hidden mx-auto"
                    style={{
                      width: "100%",
                      maxWidth: Math.min(stripTargetWidth, 780),
                      aspectRatio: `${stripTargetWidth} / ${stripTargetHeight}`,
                      backgroundColor:
                        stripBgColor === "transparent"
                          ? undefined
                          : stripBgColor,
                      backgroundImage:
                        stripBgColor === "transparent"
                          ? "url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3C%2Fsvg%3E')"
                          : undefined,
                      position: "relative",
                    }}
                  >
                    {stripSourceImage ? (
                      <img
                        src={stripSourceImage}
                        alt="Strip preview"
                        style={{
                          position: "absolute",
                          ...(stripFitMode === "stretch"
                            ? {
                                width: "100%",
                                height: "100%",
                                objectFit: "fill",
                              }
                            : stripFitMode === "cover"
                              ? {
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  objectPosition: `calc(50% + ${stripOffsetX}px) calc(50% + ${stripOffsetY}px)`,
                                }
                              : stripFitMode === "contain"
                                ? {
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    objectPosition: `calc(50% + ${stripOffsetX}px) calc(50% + ${stripOffsetY}px)`,
                                    transform: `scale(${stripScale / 100})`,
                                  }
                                : {
                                    // manual
                                    width: `${stripScale}%`,
                                    height: "auto",
                                    top: stripOffsetY,
                                    left: stripOffsetX,
                                    objectFit: "none",
                                  }),
                        }}
                        draggable={false}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <div className="text-center">
                          <Layers className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <span className="text-sm">
                            העלה קובץ כדי לצפות בסטריפ
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {stripSourceImage && (
                  <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <h3 className="font-bold mb-4">פעולות</h3>
                    <div className="flex gap-3 flex-wrap">
                      <Button
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={applyStripAsLogo}
                      >
                        <Check className="h-4 w-4 ml-2" />
                        החל כלוגו סטריפ
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const dataUrl = generateStripImage();
                          if (dataUrl) {
                            const link = document.createElement("a");
                            link.download = `strip-${stripTargetWidth}x${stripTargetHeight}.png`;
                            link.href = dataUrl;
                            link.click();
                          }
                        }}
                      >
                        <FileDown className="h-4 w-4 ml-2" />
                        הורד כתמונה
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setStripOffsetX(0);
                          setStripOffsetY(0);
                          setStripScale(100);
                          setStripFitMode("contain");
                          setStripBgColor("#ffffff");
                        }}
                      >
                        <RotateCcw className="h-4 w-4 ml-2" />
                        אפס הכל
                      </Button>
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!stripSourceImage && (
                  <div className="bg-white rounded-xl border p-8 shadow-sm text-center text-gray-400">
                    <Layers className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-1">
                      מכין סטריפים מכל פורמט
                    </p>
                    <p className="text-sm">
                      PDF · Word · HTML · PNG · JPG · SVG
                    </p>
                    <p className="text-xs mt-2">
                      בחר מידות, העלה קובץ, והתאם את הסטריפ בדיוק כמו שאתה רוצה
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* AI Logo Generation Dialog */}
          <AILogoDialog
            open={showAILogoDialog}
            onOpenChange={setShowAILogoDialog}
            companyName={designSettings.companyName}
            primaryColor={designSettings.primaryColor}
            onGenerate={generateAILogo}
            isGenerating={isGeneratingLogo}
          />

          {/* Text Boxes Tab */}
          <TabsContent
            value="text-boxes"
            className="flex-1 m-0 overflow-hidden"
          >
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Editor Panel */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <ScrollArea className="h-full bg-gray-50">
                  <div className="p-6 space-y-4 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold">תיבות טקסט מותאמות</h2>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {textBoxes.length} תיבות
                        </Badge>
                        <Button
                          onClick={addTextBox}
                          className="bg-[#DAA520] hover:bg-[#B8860B]"
                        >
                          <Plus className="h-4 w-4 ml-2" />
                          הוסף תיבת טקסט
                        </Button>
                      </div>
                    </div>

                    {/* Quick add buttons */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          label: "הערה בראש",
                          position: "header",
                          style: "info",
                        },
                        {
                          label: "לפני שלבים",
                          position: "before-stages",
                          style: "default",
                        },
                        {
                          label: "אחרי שלבים",
                          position: "after-stages",
                          style: "default",
                        },
                        {
                          label: "לפני תשלומים",
                          position: "before-payments",
                          style: "highlight",
                        },
                        {
                          label: "אחרי תשלומים",
                          position: "after-payments",
                          style: "default",
                        },
                        {
                          label: "תחתית ההצעה",
                          position: "footer",
                          style: "warning",
                        },
                      ].map((preset) => (
                        <Button
                          key={preset.position}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() =>
                            setTextBoxes([
                              ...textBoxes,
                              {
                                id: Date.now().toString(),
                                title: "",
                                content: "",
                                position:
                                  preset.position as TextBox["position"],
                                style: preset.style as TextBox["style"],
                              },
                            ])
                          }
                        >
                          <Plus className="h-3 w-3 ml-1" />
                          {preset.label}
                        </Button>
                      ))}
                    </div>

                    {/* Templates section */}
                    <div className="bg-white rounded-lg border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <BookTemplate className="h-4 w-4 text-[#B8860B]" />
                        <span className="text-sm font-medium">
                          תבניות מוכנות
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {TEXT_BOX_TEMPLATES.map((tmpl, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() =>
                              setTextBoxes([
                                ...textBoxes,
                                {
                                  id: Date.now().toString() + i,
                                  title: tmpl.title,
                                  content: tmpl.content,
                                  position: tmpl.position,
                                  style: tmpl.style,
                                },
                              ])
                            }
                          >
                            {tmpl.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {textBoxes.length === 0 ? (
                      <div className="bg-white rounded-xl border-2 border-dashed p-12 text-center text-gray-400">
                        <Type className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>אין תיבות טקסט</p>
                        <p className="text-sm">
                          הוסף תיבות טקסט כדי להוסיף תוכן מותאם להצעה
                        </p>
                        <p className="text-xs mt-2">
                          גרור כדי לסדר מחדש | לחץ על תבנית מוכנה או "הוסף תיבת
                          טקסט"
                        </p>
                      </div>
                    ) : (
                      <DndContext
                        sensors={textBoxSensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleTextBoxDragEnd}
                      >
                        <SortableContext
                          items={textBoxes.map((tb) => tb.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {textBoxes.map((tb) => (
                              <SortableTextBox
                                key={tb.id}
                                textBox={tb}
                                onUpdate={(updated) =>
                                  setTextBoxes((prev) =>
                                    prev.map((t) =>
                                      t.id === tb.id ? updated : t,
                                    ),
                                  )
                                }
                                onDelete={() =>
                                  setTextBoxes((prev) =>
                                    prev.filter((t) => t.id !== tb.id),
                                  )
                                }
                                onDuplicate={() =>
                                  setTextBoxes((prev) => [
                                    ...prev,
                                    {
                                      ...tb,
                                      id: Date.now().toString(),
                                      title: tb.title + " (עותק)",
                                    },
                                  ])
                                }
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}

                    {/* Bulk actions */}
                    {textBoxes.length > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-gray-400">
                          גרור ⇕ כדי לשנות סדר
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-500 h-7"
                          onClick={() => {
                            if (confirm("למחוק את כל תיבות הטקסט?"))
                              setTextBoxes([]);
                          }}
                        >
                          <Trash2 className="h-3 w-3 ml-1" />
                          מחק הכל
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Live Preview Panel */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full bg-gray-100 p-4">
                  <div className="text-center text-xs text-gray-500 mb-2 font-medium">
                    תצוגה מקדימה - המיקום של תיבות הטקסט מסומן
                  </div>
                  <div className="h-[calc(100%-24px)] bg-white rounded-lg shadow-lg overflow-hidden">
                    <iframe
                      srcDoc={generateHtmlContent()}
                      title="תצוגה מקדימה"
                      className="w-full h-full border-0"
                      style={{ minHeight: "100%" }}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>

          {/* Advanced Tools Tab - Only render content when active */}
          <TabsContent
            value="tools"
            className="flex-1 m-0 overflow-hidden"
            forceMount={undefined}
          >
            {activeTab === "tools" && (
              <ScrollArea className="h-full bg-gradient-to-br from-purple-50 to-indigo-50">
                <div className="p-6 space-y-6 max-w-6xl mx-auto">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      כלים מתקדמים
                    </h2>
                    <p className="text-gray-500 mt-1">
                      כלים חכמים לניהול הצעות המחיר שלך
                    </p>
                  </div>

                  {/* Status Tracker & Calculator Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <QuoteStatusTracker
                      status={quoteStatus}
                      onStatusChange={(newStatus) => {
                        addChangeRecord("סטטוס", quoteStatus, newStatus);
                        setQuoteStatus(newStatus);
                      }}
                    />

                    {calculationResult && (
                      <AutoCalculator
                        result={calculationResult}
                        currency={(editedTemplate as any).currency || "₪"}
                      />
                    )}
                  </div>

                  {/* Alternative Pricing */}
                  <AlternativePricing
                    options={pricingOptions}
                    onOptionsChange={setPricingOptions}
                    selectedOption={selectedPricingOption}
                    onSelectOption={setSelectedPricingOption}
                    baseTotal={calculationResult?.subtotal || 0}
                  />

                  {/* Design Templates */}
                  <DesignTemplatesSelector
                    onSelect={(template) => {
                      addChangeRecord("תבנית עיצוב", "קודם", template.name);
                      setDesignSettings({
                        ...designSettings,
                        primaryColor:
                          (template as any).primaryColor ||
                          designSettings.primaryColor,
                        secondaryColor:
                          (template as any).secondaryColor ||
                          designSettings.secondaryColor,
                        accentColor:
                          (template as any).accentColor ||
                          designSettings.accentColor,
                        headerBackground:
                          (template as any).headerBg ||
                          designSettings.headerBackground,
                      });
                      toast({
                        title: "תבנית הוחלה",
                        description: `נבחרה תבנית "${template.name}"`,
                      });
                    }}
                  />

                  {/* Signature & QR Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DigitalSignature
                      onSave={(data) => {
                        setSignatureData(data);
                        toast({
                          title: "חתימה נשמרה",
                          description: "החתימה הדיגיטלית נשמרה בהצלחה",
                        });
                      }}
                      onClear={() => setSignatureData("")}
                      existingSignature={signatureData}
                    />

                    <QRCodeGenerator
                      quoteId={editedTemplate.id}
                      quoteName={editedTemplate.name}
                    />
                  </div>

                  {/* Client Signature Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                      <PenTool className="h-5 w-5 text-green-600" />
                      חתימת לקוח
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      שלח את ההצעה ללקוח לחתימה דיגיטלית
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <DigitalSignature
                        onSave={(data) => {
                          setClientSignatureData(data);
                          toast({
                            title: "חתימת לקוח נשמרה",
                            description: "חתימת הלקוח נשמרה בהצלחה",
                          });
                        }}
                        onClear={() => setClientSignatureData(null)}
                        existingSignature={clientSignatureData}
                      />
                    </div>
                    {(signatureData || clientSignatureData) && (
                      <div className="mt-3 pt-3 border-t border-green-200 flex items-center justify-between">
                        <div className="flex gap-3 text-xs">
                          {signatureData && (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              <Check className="h-3 w-3 ml-1" />
                              חתימת משרד
                            </Badge>
                          )}
                          {clientSignatureData && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                              <Check className="h-3 w-3 ml-1" />
                              חתימת לקוח
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={handleExportSignedPdf}
                        >
                          <Lock className="h-3 w-3 ml-1" />
                          ייצא PDF חתום
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Payment Link */}
                  <PaymentLink
                    amount={calculationResult?.total || 0}
                    quoteName={editedTemplate.name}
                    clientName={projectDetails.clientName}
                  />

                  {/* Change History */}
                  <ChangeHistory changes={changeHistory} />

                  {/* SMS and Calendar Sharing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-16 border-purple-200 hover:bg-purple-50"
                      onClick={() => setShowSMSDialog(true)}
                    >
                      <Smartphone className="h-6 w-6 ml-3 text-purple-600" />
                      <div className="text-right">
                        <div className="font-semibold">שליחה ב-SMS</div>
                        <div className="text-xs text-gray-500">
                          שלח קישור להצעה בהודעת טקסט
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-16 border-indigo-200 hover:bg-indigo-50"
                      onClick={() => setShowCalendarDialog(true)}
                    >
                      <Calendar className="h-6 w-6 ml-3 text-indigo-600" />
                      <div className="text-right">
                        <div className="font-semibold">הוסף ליומן</div>
                        <div className="text-xs text-gray-500">
                          צור תזכורת לתאריך התוקף
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          <SMSShareDialog
            open={showSMSDialog}
            onOpenChange={setShowSMSDialog}
            quoteName={editedTemplate.name}
            quoteId={editedTemplate.id}
            clientPhone={projectDetails.phone || ""}
            totalPrice={calculationResult?.total || 0}
          />

          {/* Calendar Dialog */}
          <CalendarSyncDialog
            open={showCalendarDialog}
            onOpenChange={setShowCalendarDialog}
            quoteName={editedTemplate.name}
            clientName={projectDetails.clientName}
            expiresAt={
              new Date(
                Date.now() +
                  (editedTemplate.validity_days || 30) * 24 * 60 * 60 * 1000,
              )
            }
          />

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Settings className="h-6 w-6 text-[#B8860B]" />
                    פרטי החברה
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>שם החברה</Label>
                      <Input
                        value={designSettings.companyName}
                        onChange={(e) =>
                          setDesignSettings({
                            ...designSettings,
                            companyName: e.target.value,
                          })
                        }
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>טלפון</Label>
                      <Input
                        value={designSettings.companyPhone}
                        onChange={(e) =>
                          setDesignSettings({
                            ...designSettings,
                            companyPhone: e.target.value,
                          })
                        }
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>כתובת</Label>
                      <Input
                        value={designSettings.companyAddress}
                        onChange={(e) =>
                          setDesignSettings({
                            ...designSettings,
                            companyAddress: e.target.value,
                          })
                        }
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>אימייל</Label>
                      <Input
                        value={designSettings.companyEmail}
                        onChange={(e) =>
                          setDesignSettings({
                            ...designSettings,
                            companyEmail: e.target.value,
                          })
                        }
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">הגדרות הצעה</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>תוקף הצעת מחיר (ימים)</Label>
                      <Input
                        type="number"
                        value={editedTemplate.validity_days || 30}
                        onChange={(e) =>
                          setEditedTemplate({
                            ...editedTemplate,
                            validity_days: parseInt(e.target.value) || 30,
                          })
                        }
                        min={1}
                        max={365}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>אחוז מע"מ</Label>
                      <Input
                        type="number"
                        value={editedTemplate.vat_rate || 17}
                        onChange={(e) =>
                          setEditedTemplate({
                            ...editedTemplate,
                            vat_rate: parseInt(e.target.value) || 17,
                          })
                        }
                        min={0}
                        max={50}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button variant="outline" className="text-gray-500">
                    <RotateCcw className="h-4 w-4 ml-2" />
                    איפוס להגדרות ברירת מחדל
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Preview Tab - Full Preview with Device Switcher */}
          <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
            <div className="h-full bg-gray-100 p-4 flex flex-col">
              {/* Device switcher toolbar */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="bg-white rounded-lg shadow-sm border p-1 flex gap-1">
                  <Button
                    size="sm"
                    variant={previewDevice === "desktop" ? "default" : "ghost"}
                    className={`h-8 text-xs ${previewDevice === "desktop" ? "bg-[#DAA520] hover:bg-[#B8860B]" : ""}`}
                    onClick={() => setPreviewDevice("desktop")}
                  >
                    <Columns className="h-3.5 w-3.5 ml-1" />
                    מחשב
                  </Button>
                  <Button
                    size="sm"
                    variant={previewDevice === "tablet" ? "default" : "ghost"}
                    className={`h-8 text-xs ${previewDevice === "tablet" ? "bg-[#DAA520] hover:bg-[#B8860B]" : ""}`}
                    onClick={() => setPreviewDevice("tablet")}
                  >
                    <FileText className="h-3.5 w-3.5 ml-1" />
                    טאבלט
                  </Button>
                  <Button
                    size="sm"
                    variant={previewDevice === "mobile" ? "default" : "ghost"}
                    className={`h-8 text-xs ${previewDevice === "mobile" ? "bg-[#DAA520] hover:bg-[#B8860B]" : ""}`}
                    onClick={() => setPreviewDevice("mobile")}
                  >
                    <Smartphone className="h-3.5 w-3.5 ml-1" />
                    נייד
                  </Button>
                </div>
                {/* Interactive Edit Mode Toggle */}
                <div className="bg-white rounded-lg shadow-sm border p-1 flex gap-1">
                  <Button
                    size="sm"
                    variant={interactiveEditMode ? "default" : "ghost"}
                    className={`h-8 text-xs ${interactiveEditMode ? "bg-purple-500 hover:bg-purple-600 text-white" : ""}`}
                    onClick={() => setInteractiveEditMode(!interactiveEditMode)}
                  >
                    <Edit className="h-3.5 w-3.5 ml-1" />
                    עריכה ישירה
                  </Button>
                </div>

                {/* Global Page Settings - only shown in edit mode */}
                {interactiveEditMode && (
                  <div className="bg-white rounded-lg shadow-sm border p-1 flex gap-2 items-center">
                    <span className="text-xs text-gray-500 px-1">
                      עיצוב כללי:
                    </span>
                    <select
                      value={designSettings.fontFamily}
                      onChange={(e) =>
                        setDesignSettings({
                          ...designSettings,
                          fontFamily: e.target.value,
                        })
                      }
                      className="h-7 text-xs border rounded px-1"
                    >
                      {HEBREW_FONTS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={designSettings.fontSize}
                      onChange={(e) =>
                        setDesignSettings({
                          ...designSettings,
                          fontSize: Number(e.target.value),
                        })
                      }
                      className="h-7 w-12 text-xs border rounded px-1 text-center"
                      min={12}
                      max={24}
                    />
                    <input
                      type="color"
                      value={designSettings.primaryColor}
                      onChange={(e) =>
                        setDesignSettings({
                          ...designSettings,
                          primaryColor: e.target.value,
                        })
                      }
                      className="h-7 w-7 rounded cursor-pointer border-0"
                      title="צבע ראשי"
                    />
                    <input
                      type="range"
                      value={designSettings.logoSize || 120}
                      onChange={(e) =>
                        setDesignSettings({
                          ...designSettings,
                          logoSize: Number(e.target.value),
                        })
                      }
                      min={60}
                      max={500}
                      className="w-20 h-2"
                      title={`גודל לוגו: ${designSettings.logoSize || 120}px`}
                    />
                    <select
                      value={designSettings.logoPosition || "inside-header"}
                      onChange={(e) =>
                        setDesignSettings({
                          ...designSettings,
                          logoPosition: e.target.value as any,
                        })
                      }
                      className="h-7 text-xs border rounded px-1"
                    >
                      <option value="inside-header">לוגו בסטריפ</option>
                      <option value="above-header">מעל הסטריפ</option>
                      <option value="centered-above">ממורכז מעל</option>
                      <option value="full-width">רוחב מלא</option>
                    </select>
                  </div>
                )}
                {/* Version save button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => saveVersion()}
                  disabled={isSavingVersion || !editedTemplate.id}
                >
                  <GitBranch className="h-3.5 w-3.5 ml-1" />
                  {isSavingVersion ? "שומר..." : "שמור גרסה ☁️"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setShowVersionDialog(true)}
                >
                  <History className="h-3.5 w-3.5 ml-1" />
                  גרסאות ({quoteVersions.length})
                </Button>
              </div>

              {/* Device frame */}
              <div className="flex-1 flex items-start justify-center overflow-auto">
                <div
                  className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
                    previewDevice === "mobile"
                      ? "w-[375px] border-[8px] border-gray-800 rounded-[2rem]"
                      : previewDevice === "tablet"
                        ? "w-[768px] border-[6px] border-gray-700 rounded-[1.5rem]"
                        : "w-full h-full"
                  }`}
                  style={
                    previewDevice !== "desktop"
                      ? {
                          height:
                            previewDevice === "mobile" ? "667px" : "1024px",
                        }
                      : { height: "100%" }
                  }
                >
                  {/* Phone notch */}
                  {previewDevice === "mobile" && (
                    <div className="bg-gray-800 flex justify-center py-1">
                      <div className="w-20 h-4 bg-gray-900 rounded-full" />
                    </div>
                  )}

                  {/* Interactive Edit Preview */}
                  {interactiveEditMode ? (
                    <ScrollArea
                      className="w-full h-full"
                      style={{
                        height:
                          previewDevice === "mobile"
                            ? "630px"
                            : previewDevice === "tablet"
                              ? "1000px"
                              : "100%",
                      }}
                    >
                      <div
                        className="p-6 space-y-4"
                        dir="rtl"
                        style={{
                          fontFamily: designSettings.fontFamily,
                          fontSize: designSettings.fontSize,
                        }}
                      >
                        {/* Logo Above Header */}
                        {designSettings.showLogo &&
                          designSettings.logoUrl &&
                          (designSettings.logoPosition === "above-header" ||
                            designSettings.logoPosition ===
                              "centered-above") && (
                            <div
                              className={`relative ${designSettings.logoPosition === "centered-above" ? "text-center" : ""}`}
                            >
                              <div
                                className="relative group inline-block"
                                style={{
                                  width:
                                    designSettings.logoWidth ||
                                    designSettings.logoSize ||
                                    120,
                                  height: designSettings.logoHeight || "auto",
                                  maxWidth: "100%",
                                  cursor: "pointer",
                                }}
                                onClick={() => logoInputRef.current?.click()}
                              >
                                <img
                                  src={designSettings.logoUrl}
                                  alt="Logo"
                                  style={{
                                    width: "100%",
                                    height: designSettings.logoHeight
                                      ? "100%"
                                      : "auto",
                                    objectFit: designSettings.logoHeight
                                      ? "contain"
                                      : undefined,
                                  }}
                                  title="לחץ להחלפת לוגו"
                                />
                                {/* Corner resize handle */}
                                <div
                                  className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const startX = e.clientX;
                                    const startWidth =
                                      designSettings.logoWidth ||
                                      designSettings.logoSize ||
                                      120;
                                    const parentEl =
                                      e.currentTarget.parentElement;
                                    const startHeight =
                                      designSettings.logoHeight ||
                                      parentEl?.offsetHeight ||
                                      80;
                                    const ratio = startHeight / startWidth;
                                    const onMouseMove = (ev: MouseEvent) => {
                                      const deltaX = ev.clientX - startX;
                                      const newWidth = Math.min(
                                        Math.max(startWidth + deltaX, 40),
                                        500,
                                      );
                                      const newHeight = Math.round(
                                        newWidth * ratio,
                                      );
                                      setDesignSettings((prev) => ({
                                        ...prev,
                                        logoWidth: newWidth,
                                        logoHeight: newHeight,
                                        logoSize: newWidth,
                                      }));
                                    };
                                    const onMouseUp = () => {
                                      document.removeEventListener(
                                        "mousemove",
                                        onMouseMove,
                                      );
                                      document.removeEventListener(
                                        "mouseup",
                                        onMouseUp,
                                      );
                                    };
                                    document.addEventListener(
                                      "mousemove",
                                      onMouseMove,
                                    );
                                    document.addEventListener(
                                      "mouseup",
                                      onMouseUp,
                                    );
                                  }}
                                >
                                  <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-gray-400 hover:border-blue-500 rounded-br-sm" />
                                </div>
                                {/* Right edge resize handle - maintains aspect ratio */}
                                <div
                                  className="absolute top-0 right-0 w-2 h-full cursor-ew-resize bg-transparent hover:bg-blue-500/30 transition-colors z-10 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const startX = e.clientX;
                                    const startWidth =
                                      designSettings.logoWidth ||
                                      designSettings.logoSize ||
                                      120;
                                    const parentEl =
                                      e.currentTarget.parentElement;
                                    const startHeight =
                                      designSettings.logoHeight ||
                                      parentEl?.offsetHeight ||
                                      80;
                                    const ratio = startHeight / startWidth;
                                    const onMouseMove = (ev: MouseEvent) => {
                                      const delta = ev.clientX - startX;
                                      const newWidth = Math.min(
                                        Math.max(startWidth + delta, 40),
                                        500,
                                      );
                                      const newHeight = Math.round(
                                        newWidth * ratio,
                                      );
                                      setDesignSettings((prev) => ({
                                        ...prev,
                                        logoWidth: newWidth,
                                        logoHeight: newHeight,
                                        logoSize: newWidth,
                                      }));
                                    };
                                    const onMouseUp = () => {
                                      document.removeEventListener(
                                        "mousemove",
                                        onMouseMove,
                                      );
                                      document.removeEventListener(
                                        "mouseup",
                                        onMouseUp,
                                      );
                                    };
                                    document.addEventListener(
                                      "mousemove",
                                      onMouseMove,
                                    );
                                    document.addEventListener(
                                      "mouseup",
                                      onMouseUp,
                                    );
                                  }}
                                />
                              </div>
                              <div className="absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-6 text-xs shadow-lg"
                                  onClick={() => logoInputRef.current?.click()}
                                >
                                  <Upload className="h-3 w-3 ml-1" />
                                  החלף
                                </Button>
                              </div>
                            </div>
                          )}

                        {/* Header Section - Editable */}
                        <div
                          className="relative group"
                          style={
                            designSettings.logoPosition === "full-width"
                              ? { margin: "-1.5rem -1.5rem 0 -1.5rem" }
                              : undefined
                          }
                        >
                          <div
                            className={`text-white text-center ${designSettings.logoPosition === "full-width" ? "p-0 overflow-hidden relative" : "rounded-xl p-6"}`}
                            style={{
                              background:
                                designSettings.logoPosition === "full-width"
                                  ? "transparent"
                                  : designSettings.showHeaderStrip !== false
                                    ? designSettings.headerBackground
                                    : `linear-gradient(135deg, ${designSettings.primaryColor}, ${designSettings.secondaryColor})`,
                            }}
                          >
                            {/* Full Width Logo - Inside header, spanning full width */}
                            {designSettings.showLogo &&
                              designSettings.logoUrl &&
                              designSettings.logoPosition === "full-width" && (
                                <div
                                  className="cursor-pointer relative group"
                                  style={{
                                    width: "100%",
                                    margin: "0 auto",
                                  }}
                                  onClick={() => logoInputRef.current?.click()}
                                >
                                  <img
                                    src={designSettings.logoUrl}
                                    alt="Logo"
                                    style={{
                                      width: "100%",
                                      height: "auto",
                                      display: "block",
                                      objectFit: "cover",
                                      objectPosition: "center",
                                    }}
                                  />
                                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-6 text-xs shadow-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        logoInputRef.current?.click();
                                      }}
                                    >
                                      <Upload className="h-3 w-3 ml-1" />
                                      החלף לוגו
                                    </Button>
                                  </div>
                                </div>
                              )}
                            {/* Regular Logo inside header */}
                            {designSettings.showLogo &&
                              designSettings.logoUrl &&
                              (!designSettings.logoPosition ||
                                designSettings.logoPosition ===
                                  "inside-header") && (
                                <div
                                  className="cursor-pointer relative group inline-block"
                                  style={{
                                    width:
                                      designSettings.logoWidth ||
                                      designSettings.logoSize ||
                                      120,
                                    height: designSettings.logoHeight || "auto",
                                    margin: "0 auto 16px",
                                  }}
                                  onClick={() => logoInputRef.current?.click()}
                                >
                                  <img
                                    src={designSettings.logoUrl}
                                    alt="Logo"
                                    style={{
                                      width: "100%",
                                      height: designSettings.logoHeight
                                        ? "100%"
                                        : "auto",
                                      objectFit: designSettings.logoHeight
                                        ? "contain"
                                        : undefined,
                                    }}
                                  />
                                  {/* Corner resize handle - maintains aspect ratio */}
                                  <div
                                    className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const startX = e.clientX;
                                      const startWidth =
                                        designSettings.logoWidth ||
                                        designSettings.logoSize ||
                                        120;
                                      const parentEl =
                                        e.currentTarget.parentElement;
                                      const startHeight =
                                        designSettings.logoHeight ||
                                        parentEl?.offsetHeight ||
                                        80;
                                      const ratio = startHeight / startWidth;
                                      const onMouseMove = (ev: MouseEvent) => {
                                        const deltaX = ev.clientX - startX;
                                        const newWidth = Math.min(
                                          Math.max(startWidth + deltaX, 40),
                                          500,
                                        );
                                        const newHeight = Math.round(
                                          newWidth * ratio,
                                        );
                                        setDesignSettings((prev) => ({
                                          ...prev,
                                          logoWidth: newWidth,
                                          logoHeight: newHeight,
                                          logoSize: newWidth,
                                        }));
                                      };
                                      const onMouseUp = () => {
                                        document.removeEventListener(
                                          "mousemove",
                                          onMouseMove,
                                        );
                                        document.removeEventListener(
                                          "mouseup",
                                          onMouseUp,
                                        );
                                      };
                                      document.addEventListener(
                                        "mousemove",
                                        onMouseMove,
                                      );
                                      document.addEventListener(
                                        "mouseup",
                                        onMouseUp,
                                      );
                                    }}
                                  >
                                    <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-white/60 hover:border-blue-400 rounded-br-sm" />
                                  </div>
                                </div>
                              )}
                            {/* Title and description - only when NOT full-width logo */}
                            {designSettings.logoPosition !== "full-width" && (
                              <>
                                <h1
                                  className="text-2xl font-bold outline-none focus:bg-white/20 rounded px-2"
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) =>
                                    setEditedTemplate({
                                      ...editedTemplate,
                                      name: e.currentTarget.textContent || "",
                                    })
                                  }
                                >
                                  {editedTemplate.name}
                                </h1>
                                <p
                                  className="opacity-90 text-sm mt-1 outline-none focus:bg-white/20 rounded px-2"
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) =>
                                    setEditedTemplate({
                                      ...editedTemplate,
                                      description:
                                        e.currentTarget.textContent || "",
                                    })
                                  }
                                >
                                  {editedTemplate.description}
                                </p>
                              </>
                            )}
                          </div>
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs shadow-lg"
                              onClick={() => setActiveTab("design")}
                            >
                              <Palette className="h-3 w-3 ml-1" />
                              עיצוב
                            </Button>
                            {!designSettings.logoUrl && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-xs shadow-lg"
                                onClick={() => logoInputRef.current?.click()}
                              >
                                <Upload className="h-3 w-3 ml-1" />
                                לוגו
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Project Details Section - Editable */}
                        {projectDetails.clientName && (
                          <div className="relative group">
                            <div
                              className="bg-gray-50 rounded-xl p-4 border"
                              style={{
                                borderRadius: designSettings.borderRadius,
                              }}
                            >
                              <h2
                                className="font-bold mb-3"
                                style={{ color: designSettings.primaryColor }}
                              >
                                פרטי הפרויקט
                              </h2>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {projectDetails.clientName && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">לקוח:</span>
                                    <span
                                      contentEditable
                                      suppressContentEditableWarning
                                      className="outline-none focus:bg-yellow-100 rounded px-1"
                                      onBlur={(e) =>
                                        setProjectDetails({
                                          ...projectDetails,
                                          clientName:
                                            e.currentTarget.textContent || "",
                                        })
                                      }
                                    >
                                      {projectDetails.clientName}
                                    </span>
                                  </div>
                                )}
                                {projectDetails.address && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">כתובת:</span>
                                    <span
                                      contentEditable
                                      suppressContentEditableWarning
                                      className="outline-none focus:bg-yellow-100 rounded px-1"
                                      onBlur={(e) =>
                                        setProjectDetails({
                                          ...projectDetails,
                                          address:
                                            e.currentTarget.textContent || "",
                                        })
                                      }
                                    >
                                      {projectDetails.address}
                                    </span>
                                  </div>
                                )}
                                {projectDetails.gush && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">גוש:</span>
                                    <span
                                      contentEditable
                                      suppressContentEditableWarning
                                      className="outline-none focus:bg-yellow-100 rounded px-1"
                                      onBlur={(e) =>
                                        setProjectDetails({
                                          ...projectDetails,
                                          gush:
                                            e.currentTarget.textContent || "",
                                        })
                                      }
                                    >
                                      {projectDetails.gush}
                                    </span>
                                  </div>
                                )}
                                {projectDetails.helka && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">חלקה:</span>
                                    <span
                                      contentEditable
                                      suppressContentEditableWarning
                                      className="outline-none focus:bg-yellow-100 rounded px-1"
                                      onBlur={(e) =>
                                        setProjectDetails({
                                          ...projectDetails,
                                          helka:
                                            e.currentTarget.textContent || "",
                                        })
                                      }
                                    >
                                      {projectDetails.helka}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-xs shadow-lg"
                                onClick={() => setActiveTab("project")}
                              >
                                <Edit className="h-3 w-3 ml-1" />
                                ערוך
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Work Stages Section - Editable */}
                        <div className="relative group">
                          <div
                            className="bg-white rounded-xl p-4 border shadow-sm"
                            style={{
                              borderRadius: designSettings.borderRadius,
                            }}
                          >
                            <h2
                              className="font-bold mb-4"
                              style={{ color: designSettings.primaryColor }}
                            >
                              שלבי העבודה
                            </h2>
                            <div className="space-y-3">
                              {editedTemplate.stages.map((stage) => (
                                <div
                                  key={stage.id}
                                  className="bg-gray-50 rounded-lg p-3 border"
                                  style={{
                                    borderRadius: designSettings.borderRadius,
                                  }}
                                >
                                  <h3
                                    className="font-semibold flex items-center gap-2"
                                    style={{
                                      color: designSettings.primaryColor,
                                    }}
                                  >
                                    <span>{stage.icon || "📋"}</span>
                                    <span
                                      contentEditable
                                      suppressContentEditableWarning
                                      className="outline-none focus:bg-yellow-100 rounded px-1"
                                      onBlur={(e) =>
                                        updateStage(stage.id, {
                                          ...stage,
                                          name:
                                            e.currentTarget.textContent || "",
                                        })
                                      }
                                    >
                                      {stage.name}
                                    </span>
                                  </h3>
                                  <ul className="mt-2 space-y-1">
                                    {stage.items.map((item: any) => (
                                      <li
                                        key={item.id}
                                        className="text-sm text-gray-600 flex items-center gap-2"
                                      >
                                        <span className="text-green-500">
                                          ✓
                                        </span>
                                        <span
                                          contentEditable
                                          suppressContentEditableWarning
                                          className="outline-none focus:bg-yellow-100 rounded px-1 flex-1"
                                          onBlur={(e) => {
                                            const newItems = stage.items.map(
                                              (i: any) =>
                                                i.id === item.id
                                                  ? {
                                                      ...i,
                                                      text:
                                                        e.currentTarget
                                                          .textContent || "",
                                                    }
                                                  : i,
                                            );
                                            updateStage(stage.id, {
                                              ...stage,
                                              items: newItems,
                                            });
                                          }}
                                          style={{
                                            fontFamily:
                                              item.fontFamily ||
                                              designSettings.fontFamily,
                                            fontSize: item.fontSize || 14,
                                            color: item.fontColor || "#333",
                                            fontWeight: item.isBold
                                              ? "bold"
                                              : "normal",
                                            fontStyle: item.isItalic
                                              ? "italic"
                                              : "normal",
                                            textDecoration: item.isUnderline
                                              ? "underline"
                                              : "none",
                                          }}
                                        >
                                          {item.text}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs shadow-lg"
                              onClick={() => setActiveTab("content")}
                            >
                              <Edit className="h-3 w-3 ml-1" />
                              ערוך שלבים
                            </Button>
                          </div>
                        </div>

                        {/* Payments Section - Editable */}
                        <div className="relative group">
                          <div
                            className="bg-white rounded-xl p-4 border shadow-sm"
                            style={{
                              borderRadius: designSettings.borderRadius,
                            }}
                          >
                            <h2
                              className="font-bold mb-4"
                              style={{ color: designSettings.primaryColor }}
                            >
                              סדר תשלומים
                            </h2>
                            <table className="w-full text-sm">
                              <thead>
                                <tr
                                  style={{
                                    backgroundColor:
                                      designSettings.primaryColor,
                                  }}
                                  className="text-white"
                                >
                                  <th className="p-2 text-right rounded-tr-lg">
                                    שלב
                                  </th>
                                  <th className="p-2 text-center">אחוז</th>
                                  <th className="p-2 text-left rounded-tl-lg">
                                    סכום
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {paymentSteps.map((step, i) => (
                                  <tr
                                    key={step.id}
                                    className={i % 2 === 0 ? "bg-gray-50" : ""}
                                  >
                                    <td className="p-2">
                                      <span
                                        contentEditable
                                        suppressContentEditableWarning
                                        className="outline-none focus:bg-yellow-100 rounded px-1"
                                        onBlur={(e) =>
                                          setPaymentSteps(
                                            paymentSteps.map((s) =>
                                              s.id === step.id
                                                ? {
                                                    ...s,
                                                    name:
                                                      e.currentTarget
                                                        .textContent || "",
                                                  }
                                                : s,
                                            ),
                                          )
                                        }
                                      >
                                        {step.name}
                                      </span>
                                    </td>
                                    <td className="p-2 text-center">
                                      <span
                                        contentEditable
                                        suppressContentEditableWarning
                                        className="outline-none focus:bg-yellow-100 rounded px-1"
                                        onBlur={(e) =>
                                          setPaymentSteps(
                                            paymentSteps.map((s) =>
                                              s.id === step.id
                                                ? {
                                                    ...s,
                                                    percentage:
                                                      parseInt(
                                                        e.currentTarget
                                                          .textContent || "0",
                                                      ) || 0,
                                                  }
                                                : s,
                                            ),
                                          )
                                        }
                                      >
                                        {step.percentage}
                                      </span>
                                      %
                                    </td>
                                    <td className="p-2 text-left">
                                      ₪
                                      {Math.round(
                                        ((editedTemplate.base_price || 35000) *
                                          step.percentage) /
                                          100,
                                      ).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="font-bold bg-gray-100">
                                  <td className="p-2">סה"כ</td>
                                  <td className="p-2 text-center">
                                    {paymentSteps.reduce(
                                      (sum, s) => sum + s.percentage,
                                      0,
                                    )}
                                    %
                                  </td>
                                  <td className="p-2 text-left">
                                    ₪
                                    <span
                                      contentEditable
                                      suppressContentEditableWarning
                                      className="outline-none focus:bg-yellow-100 rounded px-1"
                                      onBlur={(e) =>
                                        setEditedTemplate({
                                          ...editedTemplate,
                                          base_price:
                                            parseInt(
                                              e.currentTarget.textContent?.replace(
                                                /,/g,
                                                "",
                                              ) || "35000",
                                            ) || 35000,
                                        })
                                      }
                                    >
                                      {(
                                        editedTemplate.base_price || 35000
                                      ).toLocaleString()}
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs shadow-lg"
                              onClick={() => setActiveTab("payments")}
                            >
                              <Edit className="h-3 w-3 ml-1" />
                              ערוך תשלומים
                            </Button>
                          </div>
                        </div>

                        {/* Text Boxes - Editable */}
                        {textBoxes.length > 0 && (
                          <div className="relative group">
                            <div className="space-y-3">
                              {textBoxes.map((tb) => (
                                <div
                                  key={tb.id}
                                  className="rounded-lg p-4 border"
                                  style={{
                                    backgroundColor:
                                      tb.customBg ||
                                      (tb.style === "highlight"
                                        ? "#fef3c7"
                                        : tb.style === "warning"
                                          ? "#fef2f2"
                                          : tb.style === "info"
                                            ? "#eff6ff"
                                            : "#f9fafb"),
                                    borderColor:
                                      tb.customBorder ||
                                      (tb.style === "highlight"
                                        ? "#fcd34d"
                                        : tb.style === "warning"
                                          ? "#fca5a5"
                                          : tb.style === "info"
                                            ? "#93c5fd"
                                            : "#e5e7eb"),
                                    borderRadius: designSettings.borderRadius,
                                  }}
                                >
                                  {tb.title && (
                                    <h3
                                      className="font-semibold mb-2 outline-none focus:bg-white/50 rounded px-1"
                                      style={{
                                        color: designSettings.primaryColor,
                                      }}
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) =>
                                        setTextBoxes(
                                          textBoxes.map((t) =>
                                            t.id === tb.id
                                              ? {
                                                  ...t,
                                                  title:
                                                    e.currentTarget
                                                      .textContent || "",
                                                }
                                              : t,
                                          ),
                                        )
                                      }
                                    >
                                      {tb.title}
                                    </h3>
                                  )}
                                  <p
                                    className="text-sm outline-none focus:bg-white/50 rounded px-1"
                                    style={{
                                      color: tb.customTextColor || "#333",
                                      fontSize: tb.fontSize || 14,
                                      fontWeight: tb.isBold ? "bold" : "normal",
                                      fontStyle: tb.isItalic
                                        ? "italic"
                                        : "normal",
                                      textDecoration: tb.isUnderline
                                        ? "underline"
                                        : "none",
                                      textAlign: tb.textAlign || "right",
                                      fontFamily:
                                        tb.fontFamily ||
                                        designSettings.fontFamily,
                                    }}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) =>
                                      setTextBoxes(
                                        textBoxes.map((t) =>
                                          t.id === tb.id
                                            ? {
                                                ...t,
                                                content:
                                                  e.currentTarget.textContent ||
                                                  "",
                                              }
                                            : t,
                                        ),
                                      )
                                    }
                                  >
                                    {tb.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-xs shadow-lg"
                                onClick={() => setActiveTab("text-boxes")}
                              >
                                <Type className="h-3 w-3 ml-1" />
                                ערוך תיבות
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Footer Section - Editable */}
                        <div className="relative group">
                          <div className="bg-gray-100 rounded-xl p-4 text-center text-sm text-gray-600">
                            <p
                              className="font-semibold outline-none focus:bg-yellow-100 rounded px-1 inline-block"
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) =>
                                setDesignSettings({
                                  ...designSettings,
                                  companyName:
                                    e.currentTarget.textContent || "",
                                })
                              }
                            >
                              {designSettings.companyName}
                            </p>
                            <p className="mt-1">
                              <span
                                className="outline-none focus:bg-yellow-100 rounded px-1"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) =>
                                  setDesignSettings({
                                    ...designSettings,
                                    companyAddress:
                                      e.currentTarget.textContent || "",
                                  })
                                }
                              >
                                {designSettings.companyAddress}
                              </span>{" "}
                              |{" "}
                              <span
                                className="outline-none focus:bg-yellow-100 rounded px-1"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) =>
                                  setDesignSettings({
                                    ...designSettings,
                                    companyPhone:
                                      e.currentTarget.textContent || "",
                                  })
                                }
                              >
                                {designSettings.companyPhone}
                              </span>{" "}
                              |{" "}
                              <span
                                className="outline-none focus:bg-yellow-100 rounded px-1"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) =>
                                  setDesignSettings({
                                    ...designSettings,
                                    companyEmail:
                                      e.currentTarget.textContent || "",
                                  })
                                }
                              >
                                {designSettings.companyEmail}
                              </span>
                            </p>
                            <p className="mt-2 text-xs">
                              * המחירים אינם כוללים מע"מ. תוקף ההצעה:{" "}
                              <span
                                className="outline-none focus:bg-yellow-100 rounded px-1"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) =>
                                  setEditedTemplate({
                                    ...editedTemplate,
                                    validity_days:
                                      parseInt(
                                        e.currentTarget.textContent || "30",
                                      ) || 30,
                                  })
                                }
                              >
                                {editedTemplate.validity_days || 30}
                              </span>{" "}
                              יום.
                            </p>
                          </div>
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs shadow-lg"
                              onClick={() => setActiveTab("settings")}
                            >
                              <Settings className="h-3 w-3 ml-1" />
                              הגדרות
                            </Button>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <iframe
                      srcDoc={generateHtmlContent()}
                      title="תצוגה מקדימה"
                      className="w-full border-0"
                      style={{
                        height:
                          previewDevice === "mobile"
                            ? "630px"
                            : previewDevice === "tablet"
                              ? "1000px"
                              : "100%",
                      }}
                    />
                  )}

                  {/* Phone bottom bar */}
                  {previewDevice === "mobile" && (
                    <div className="bg-gray-800 flex justify-center py-1">
                      <div className="w-28 h-1 bg-gray-600 rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Split View Tab - Block Editor + Live Preview */}
          <TabsContent value="split" className="flex-1 m-0 overflow-hidden">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Editor Panel - Draggable blocks */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <ScrollArea className="h-full bg-gray-50">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <GripVertical className="h-3 w-3" />
                        גרור סקשנים לשינוי סדר
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => saveVersion()}
                      >
                        <GitBranch className="h-3 w-3 ml-1" />
                        שמור גרסה
                      </Button>
                    </div>

                    {/* Quick Project Details - always first */}
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <User className="h-4 w-4 text-[#B8860B]" />
                        פרטי פרויקט
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={projectDetails.clientName}
                          onChange={(e) =>
                            setProjectDetails({
                              ...projectDetails,
                              clientName: e.target.value,
                            })
                          }
                          placeholder="שם הלקוח"
                          dir="rtl"
                        />
                        <Input
                          value={projectDetails.address}
                          onChange={(e) =>
                            setProjectDetails({
                              ...projectDetails,
                              address: e.target.value,
                            })
                          }
                          placeholder="כתובת"
                          dir="rtl"
                        />
                        <Input
                          value={projectDetails.gush}
                          onChange={(e) =>
                            setProjectDetails({
                              ...projectDetails,
                              gush: e.target.value,
                            })
                          }
                          placeholder="גוש"
                          dir="rtl"
                        />
                        <Input
                          value={projectDetails.helka}
                          onChange={(e) =>
                            setProjectDetails({
                              ...projectDetails,
                              helka: e.target.value,
                            })
                          }
                          placeholder="חלקה"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    {/* Draggable Sections */}
                    <DndContext
                      sensors={sectionSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleSectionDragEnd}
                    >
                      <SortableContext
                        items={sectionOrder}
                        strategy={verticalListSortingStrategy}
                      >
                        {sectionOrder.map((sectionId) => {
                          if (sectionId === "stages")
                            return (
                              <SortableSection key="stages" id="stages">
                                <div className="bg-white rounded-xl border p-4 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-[#B8860B]" />
                                      שלבי העבודה
                                    </h3>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={addStage}
                                    >
                                      <Plus className="h-3 w-3 ml-1" />
                                      הוסף
                                    </Button>
                                  </div>
                                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {editedTemplate.stages.map((stage) => (
                                      <div
                                        key={stage.id}
                                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                                      >
                                        <span className="text-lg">
                                          {stage.icon || "📋"}
                                        </span>
                                        <Input
                                          value={stage.name}
                                          onChange={(e) =>
                                            updateStage(stage.id, {
                                              ...stage,
                                              name: e.target.value,
                                            })
                                          }
                                          className="flex-1 h-8 text-sm"
                                          dir="rtl"
                                        />
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {stage.items.length}
                                        </Badge>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 text-red-500"
                                          onClick={() => deleteStage(stage.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </SortableSection>
                            );
                          if (sectionId === "payments")
                            return (
                              <SortableSection key="payments" id="payments">
                                <div className="bg-white rounded-xl border p-4 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                      <CreditCard className="h-4 w-4 text-[#B8860B]" />
                                      תשלומים
                                    </h3>
                                    <Badge
                                      variant={
                                        totalPaymentPercentage === 100
                                          ? "default"
                                          : "destructive"
                                      }
                                      className={
                                        totalPaymentPercentage === 100
                                          ? "bg-green-500 text-xs"
                                          : "text-xs"
                                      }
                                    >
                                      {totalPaymentPercentage}%
                                    </Badge>
                                  </div>
                                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {paymentSteps.map((step) => (
                                      <div
                                        key={step.id}
                                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                                      >
                                        <Input
                                          value={step.name}
                                          onChange={(e) =>
                                            setPaymentSteps(
                                              paymentSteps.map((s) =>
                                                s.id === step.id
                                                  ? {
                                                      ...s,
                                                      name: e.target.value,
                                                    }
                                                  : s,
                                              ),
                                            )
                                          }
                                          className="flex-1 h-8 text-sm"
                                          dir="rtl"
                                        />
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            value={step.percentage}
                                            onChange={(e) =>
                                              setPaymentSteps(
                                                paymentSteps.map((s) =>
                                                  s.id === step.id
                                                    ? {
                                                        ...s,
                                                        percentage:
                                                          parseInt(
                                                            e.target.value,
                                                          ) || 0,
                                                      }
                                                    : s,
                                                ),
                                              )
                                            }
                                            className="w-14 h-8 text-sm text-center"
                                          />
                                          <span className="text-xs text-gray-500">
                                            %
                                          </span>
                                        </div>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 text-red-500"
                                          onClick={() =>
                                            setPaymentSteps(
                                              paymentSteps.filter(
                                                (s) => s.id !== step.id,
                                              ),
                                            )
                                          }
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full mt-2 text-[#B8860B]"
                                    onClick={addPaymentStep}
                                  >
                                    <Plus className="h-3 w-3 ml-1" />
                                    הוסף שלב תשלום
                                  </Button>
                                </div>
                              </SortableSection>
                            );
                          if (sectionId === "textboxes")
                            return (
                              <SortableSection key="textboxes" id="textboxes">
                                <div className="bg-white rounded-xl border p-4 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                      <Type className="h-4 w-4 text-[#B8860B]" />
                                      תיבות טקסט
                                    </h3>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {textBoxes.length}
                                    </Badge>
                                  </div>
                                  {textBoxes.length > 0 ? (
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                      {textBoxes.map((tb) => (
                                        <div
                                          key={tb.id}
                                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                                        >
                                          <span className="text-xs text-gray-400">
                                            {tb.position}
                                          </span>
                                          <span className="flex-1 text-sm truncate">
                                            {tb.title || "ללא כותרת"}
                                          </span>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 text-red-500"
                                            onClick={() =>
                                              setTextBoxes((prev) =>
                                                prev.filter(
                                                  (t) => t.id !== tb.id,
                                                ),
                                              )
                                            }
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400 text-center py-2">
                                      אין תיבות טקסט - הוסף בלשונית "תיבות טקסט"
                                    </p>
                                  )}
                                </div>
                              </SortableSection>
                            );
                          if (sectionId === "upgrades")
                            return (
                              <SortableSection key="upgrades" id="upgrades">
                                <div className="bg-white rounded-xl border p-4 shadow-sm">
                                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-[#B8860B]" />
                                    מחיר ושדרוגים
                                  </h3>
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[#B8860B]">₪</span>
                                    <Input
                                      type="number"
                                      value={editedTemplate.base_price || 35000}
                                      onChange={(e) =>
                                        setEditedTemplate({
                                          ...editedTemplate,
                                          base_price:
                                            parseInt(e.target.value) || 0,
                                        })
                                      }
                                      className="text-xl font-bold text-[#B8860B]"
                                    />
                                    <span className="text-gray-500 text-sm">
                                      + מע"מ
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    {upgrades.map((u) => (
                                      <div
                                        key={u.id}
                                        className="flex items-center gap-2 text-xs"
                                      >
                                        <Switch
                                          checked={u.enabled}
                                          onCheckedChange={(checked) =>
                                            setUpgrades(
                                              upgrades.map((up) =>
                                                up.id === u.id
                                                  ? { ...up, enabled: checked }
                                                  : up,
                                              ),
                                            )
                                          }
                                        />
                                        <span className="flex-1">{u.name}</span>
                                        <span className="text-gray-500">
                                          ₪{u.price.toLocaleString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </SortableSection>
                            );
                          return null;
                        })}
                      </SortableContext>
                    </DndContext>
                  </div>
                </ScrollArea>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Preview Panel */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full bg-gray-100 p-4">
                  <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
                    <iframe
                      srcDoc={generateHtmlContent()}
                      title="תצוגה מקדימה חיה"
                      className="w-full h-full border-0"
                      style={{ minHeight: "100%" }}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="shrink-0 border-t bg-white p-3">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                תוקף: {editedTemplate.validity_days || 30} יום
              </div>
              {quoteVersions.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <GitBranch className="h-3 w-3 ml-1" />
                  {quoteVersions.length} גרסאות
                </Badge>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              <Button variant="outline" size="sm" onClick={onClose}>
                סגור
              </Button>

              {/* Export dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileDown className="h-4 w-4 ml-1" />
                    ייצוא
                    <ChevronDown className="h-3 w-3 mr-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-1" align="end">
                  <div className="space-y-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 text-xs"
                      onClick={handleExportHtml}
                    >
                      <FileCode className="h-3.5 w-3.5 ml-2" />
                      הורד HTML
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 text-xs"
                      onClick={handleExportPdf}
                    >
                      <Download className="h-3.5 w-3.5 ml-2" />
                      הורד PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 text-xs"
                      onClick={handleExportSignedPdf}
                    >
                      <Lock className="h-3.5 w-3.5 ml-2" />
                      PDF חתום
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 text-xs"
                      onClick={handleExportWord}
                    >
                      <File className="h-3.5 w-3.5 ml-2" />
                      הורד Word
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 text-xs"
                      onClick={handleExportExcel}
                    >
                      <FileText className="h-3.5 w-3.5 ml-2" />
                      סיכום Excel
                    </Button>
                    <div className="h-px bg-gray-200 my-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 text-xs"
                      onClick={handleShareWhatsAppFile}
                    >
                      <Share2 className="h-3.5 w-3.5 ml-2" />
                      שתף קובץ בוואטסאפ
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                className="bg-[#DAA520] hover:bg-[#B8860B] text-white"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Save className="h-4 w-4 ml-1" />
                )}
                {isSaving ? "שומר..." : "שמור בענן ☁️"}
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
                onClick={() => setShowEmailDialog(true)}
              >
                <Mail className="h-4 w-4 ml-1" />
                מייל
              </Button>
              <Button
                className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                size="sm"
                onClick={() => setShowWhatsAppDialog(true)}
              >
                <MessageCircle className="h-4 w-4 ml-1" />
                וואטסאפ
              </Button>
            </div>
          </div>
        </div>

        {/* Version History Dialog */}
        <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-[#B8860B]" />
                היסטוריית גרסאות{" "}
                {isLoadingVersions && (
                  <span className="text-xs text-gray-400 animate-pulse">
                    טוען...
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[400px]">
              {quoteVersions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>אין גרסאות שמורות בענן</p>
                  <p className="text-xs mt-1">
                    לחץ "שמור גרסה" כדי לשמור את המצב הנוכחי
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-1">
                  {quoteVersions.map((version) => (
                    <div
                      key={version.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{version.label}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(version.timestamp).toLocaleString(
                              "he-IL",
                            )}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {version.data.stages?.length || 0} שלבים
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {version.data.textBoxes?.length || 0} תיבות
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              ₪{(version.data.basePrice || 0).toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() =>
                              setComparingVersion(
                                comparingVersion?.id === version.id
                                  ? null
                                  : version,
                              )
                            }
                          >
                            <ArrowLeftRight className="h-3 w-3 ml-1" />
                            {comparingVersion?.id === version.id
                              ? "בטל"
                              : "השוואה"}
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs bg-[#DAA520] hover:bg-[#B8860B]"
                            onClick={() => restoreVersion(version)}
                          >
                            <Undo2 className="h-3 w-3 ml-1" />
                            שחזר
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-400 hover:text-red-600"
                            onClick={() => deleteVersion(version.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {comparingVersion?.id === version.id && (
                        <div className="mt-3 pt-3 border-t text-xs space-y-1">
                          <p className="font-medium text-gray-600">
                            השוואה מול מצב נוכחי:
                          </p>
                          {(version.data.stages?.length || 0) !==
                            editedTemplate.stages.length && (
                            <p>
                              • שלבי עבודה: {version.data.stages?.length || 0} ←{" "}
                              {editedTemplate.stages.length}
                            </p>
                          )}
                          {(version.data.paymentSteps?.length || 0) !==
                            paymentSteps.length && (
                            <p>
                              • שלבי תשלום:{" "}
                              {version.data.paymentSteps?.length || 0} ←{" "}
                              {paymentSteps.length}
                            </p>
                          )}
                          {(version.data.textBoxes?.length || 0) !==
                            textBoxes.length && (
                            <p>
                              • תיבות טקסט:{" "}
                              {version.data.textBoxes?.length || 0} ←{" "}
                              {textBoxes.length}
                            </p>
                          )}
                          {(version.data.basePrice || 0) !==
                            (editedTemplate.base_price || 35000) && (
                            <p>
                              • מחיר: ₪
                              {(version.data.basePrice || 0).toLocaleString()} ←
                              ₪
                              {(
                                editedTemplate.base_price || 35000
                              ).toLocaleString()}
                            </p>
                          )}
                          {version.data.designSettings?.primaryColor !==
                            designSettings.primaryColor && (
                            <p>
                              • צבע ראשי:{" "}
                              <span
                                className="inline-block w-3 h-3 rounded"
                                style={{
                                  backgroundColor:
                                    version.data.designSettings?.primaryColor,
                                }}
                              />{" "}
                              ←{" "}
                              <span
                                className="inline-block w-3 h-3 rounded"
                                style={{
                                  backgroundColor: designSettings.primaryColor,
                                }}
                              />
                            </p>
                          )}
                          {(version.data.stages?.length || 0) ===
                            editedTemplate.stages.length &&
                            (version.data.paymentSteps?.length || 0) ===
                              paymentSteps.length &&
                            (version.data.textBoxes?.length || 0) ===
                              textBoxes.length &&
                            (version.data.basePrice || 0) ===
                              (editedTemplate.base_price || 35000) &&
                            version.data.designSettings?.primaryColor ===
                              designSettings.primaryColor && (
                              <p className="text-green-600">
                                ✓ זהה למצב הנוכחי
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* WhatsApp Dialog */}
        <WhatsAppDialog
          open={showWhatsAppDialog}
          onOpenChange={setShowWhatsAppDialog}
          templateName={editedTemplate.name}
          clientName={projectDetails.clientName}
          clientPhone={
            allClients.find((c: any) => c.id === projectDetails.clientId)
              ?.phone || ""
          }
          totalPrice={editedTemplate.base_price || 35000}
        />
      </SheetContent>
    </Sheet>
  );
}

// WhatsApp Dialog Component
function WhatsAppDialog({
  open,
  onOpenChange,
  templateName,
  clientName,
  clientPhone,
  totalPrice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  clientName: string;
  clientPhone: string;
  totalPrice: number;
}) {
  const [phone, setPhone] = useState(clientPhone);
  const [messageType, setMessageType] = useState<
    "formal" | "friendly" | "short" | "custom"
  >("formal");
  const [customMessage, setCustomMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setPhone(clientPhone);
  }, [clientPhone]);

  const messageTemplates = {
    formal: `שלום ${clientName || "[שם הלקוח]"},

בהמשך לשיחתנו, מצורפת הצעת מחיר עבור: ${templateName}

סה"כ: ₪${totalPrice.toLocaleString()} + מע"מ

נשמח לעמוד לרשותך לכל שאלה.

בברכה`,
    friendly: `היי ${clientName || "[שם הלקוח]"} 👋

מצורפת הצעת המחיר שביקשת ל${templateName}.

סכום: ₪${totalPrice.toLocaleString()} + מע"מ

יש שאלות? אני כאן! 😊`,
    short: `הצעת מחיר - ${templateName}\nסה"כ: ₪${totalPrice.toLocaleString()} + מע"מ`,
    custom: customMessage,
  };

  const formatPhoneForWhatsApp = (phoneNumber: string): string => {
    let cleaned = phoneNumber.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "972" + cleaned.substring(1);
    } else if (!cleaned.startsWith("972")) {
      cleaned = "972" + cleaned;
    }
    return cleaned;
  };

  const handleSend = () => {
    if (!phone) {
      toast({
        title: "שגיאה",
        description: "יש להזין מספר טלפון",
        variant: "destructive",
      });
      return;
    }
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const message = encodeURIComponent(messageTemplates[messageType]);
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
    onOpenChange(false);
    toast({ title: "וואטסאפ נפתח", description: "ההודעה מוכנה לשליחה" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            שליחה בוואטסאפ
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>מספר טלפון</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-1234567"
              dir="ltr"
              className="text-left"
            />
          </div>
          <div className="space-y-2">
            <Label>סגנון הודעה</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "formal", label: "רשמית" },
                { value: "friendly", label: "ידידותית" },
                { value: "short", label: "קצרה" },
                { value: "custom", label: "מותאמת" },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={messageType === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMessageType(option.value as any)}
                  className={
                    messageType === option.value
                      ? "bg-[#25D366] hover:bg-[#128C7E]"
                      : ""
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          {messageType === "custom" ? (
            <div className="space-y-2">
              <Label>הודעה מותאמת</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="כתוב את ההודעה שלך..."
                rows={5}
                dir="rtl"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>תצוגה מקדימה</Label>
              <div className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap border max-h-40 overflow-y-auto">
                {messageTemplates[messageType]}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            onClick={handleSend}
            className="bg-[#25D366] hover:bg-[#128C7E] text-white"
            disabled={!phone}
          >
            <MessageCircle className="h-4 w-4 ml-2" />
            שלח בוואטסאפ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// AI Logo Generation Dialog
function AILogoDialog({
  open,
  onOpenChange,
  companyName,
  primaryColor,
  onGenerate,
  isGenerating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  primaryColor: string;
  onGenerate: (name: string, style: string, color: string) => void;
  isGenerating: boolean;
}) {
  const [name, setName] = useState(companyName);
  const [style, setStyle] = useState("modern");
  const [color, setColor] = useState(primaryColor);

  useEffect(() => {
    setName(companyName);
    setColor(primaryColor);
  }, [companyName, primaryColor]);

  const styles = [
    { value: "modern", label: "מודרני", description: "עיצוב נקי ומינימליסטי" },
    { value: "classic", label: "קלאסי", description: "עיצוב מסורתי ואלגנטי" },
    { value: "creative", label: "יצירתי", description: "עיצוב ייחודי ובולט" },
    { value: "professional", label: "מקצועי", description: "עיצוב עסקי ורשמי" },
  ];

  const presetColors = [
    "#1e40af",
    "#B8860B",
    "#059669",
    "#7c3aed",
    "#dc2626",
    "#0891b2",
    "#374151",
    "#ec4899",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#B8860B]" />
            יצירת לוגו עם AI
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>שם החברה</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="הזן את שם החברה..."
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label>סגנון עיצוב</Label>
            <div className="grid grid-cols-2 gap-2">
              {styles.map((s) => (
                <button
                  key={s.value}
                  className={`p-3 rounded-lg border-2 text-right transition-all ${style === s.value ? "border-[#B8860B] bg-[#B8860B]/10" : "border-gray-200 hover:border-gray-300"}`}
                  onClick={() => setStyle(s.value)}
                >
                  <div className="font-medium text-sm">{s.label}</div>
                  <div className="text-xs text-gray-500">{s.description}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>צבע</Label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-black scale-110" : "border-transparent hover:scale-105"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 p-0 cursor-pointer"
              />
            </div>
          </div>
          {/* Preview */}
          <div className="p-4 rounded-lg bg-gray-100 text-center">
            <div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-white text-3xl font-bold"
              style={{ backgroundColor: color }}
            >
              {name.charAt(0).toUpperCase() || "?"}
            </div>
            <p className="text-sm text-gray-500 mt-2">תצוגה מקדימה</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            onClick={() => onGenerate(name, style, color)}
            className="bg-[#B8860B] hover:bg-[#9A7209] text-white"
            disabled={!name || isGenerating}
          >
            {isGenerating ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <Sparkles className="h-4 w-4 ml-2" />
            )}
            צור לוגו
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default HtmlTemplateEditor;
