// עורך HTML ויזואלי מתקדם לתבניות הצעות מחיר
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";
import { PreviewIframe, type InlineEditPayload } from "./PreviewIframe";
import { FrameDesignPanel } from "./FrameDesignPanel";
import {
  DEFAULT_FRAME_SETTINGS,
  borderToCss,
  backgroundToBodyCss,
  sectionTitleHtml,
  fixedHeaderHtml,
  fixedFooterHtml,
  decorativeCornersHtml,
  getPageDimensions,
  type FrameDesignSettings,
} from "./frameStyles";
import { useDebouncedValue } from "@/hooks/useDebounce";
import * as PopoverPrimitive from "@radix-ui/react-popover";
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
  FolderPlus,
  UserPlus,
  ExternalLink,
  ListPlus,
  Heading2,
  Star,
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
import { useCloudPreferences } from "@/hooks/useCloudPreferences";
import { useQuoteDraftAutosave } from "@/hooks/useQuoteDraftAutosave";
import { supabase } from "@/integrations/supabase/client";
import { syncClientStagesFromTemplate } from "@/lib/clientStageTemplateSync";
import companyHeaderImg from "@/assets/company-header.png";
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
  vatRate?: number; // אחוז מע״מ ייחודי לשלב (אם שונה מברירת מחדל)
  useCustomVat?: boolean; // האם להשתמש במע״מ ייחודי
  linkSource?: "stage_template" | "quote_template";
  templateStageId?: string;
  templateStageName?: string;
  templateTaskId?: string;
  templateTaskName?: string;
  quoteTemplateStageId?: string;
  quoteTemplateStageName?: string;
  quoteTemplateItemId?: string;
  quoteTemplateItemText?: string;
  triggerMode?: "manual" | "date" | "task_completion";
  triggerDate?: string | null;
}

interface StageTemplateTaskOption {
  id: string;
  title: string;
  template_stage_id: string | null;
}

interface StageTemplateStageOption {
  id: string;
  stage_name: string;
  sort_order: number;
  tasks: StageTemplateTaskOption[];
}

interface StageTemplateOption {
  id: string;
  name: string;
  description: string | null;
  stages: StageTemplateStageOption[];
}

type AssignmentSourceTab = "stage-template" | "quote-template" | "all";
type AssignmentViewMode = "chips" | "cards" | "list";
type AssignmentCardsLayout = "horizontal" | "vertical";

const ASSIGNMENT_ALL_STAGE_FILTER = "__all_stages__";

const getAssignmentStageIcon = (stageName: string) => {
  const normalized = stageName.trim();

  if (normalized.includes("התקשרות") || normalized.includes("לקוח")) {
    return User;
  }
  if (
    normalized.includes("עלות") ||
    normalized.includes("מחיר") ||
    normalized.includes("תשלום") ||
    normalized.includes("הפקדה")
  ) {
    return CreditCard;
  }
  if (
    normalized.includes("תצהיר") ||
    normalized.includes("מסמך") ||
    normalized.includes("אישור")
  ) {
    return FileText;
  }
  if (
    normalized.includes("פרסום") ||
    normalized.includes("התנגד") ||
    normalized.includes("מאגר")
  ) {
    return Share2;
  }

  return Layers;
};
interface StripLayer {
  url: string;
  color: string;
  opacity: number;
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
    | "full-width"
    | "custom-strip";
  stripBgColor?: string;
  stripLineColor?: string;
  stripLineOpacity?: number;
  showHeaderStrip?: boolean;
  headerStripHeight?: number;
  stripWidth?: number;
  logoCropData?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // AI-processed logo layers
  stripLayers?: {
    lines?: StripLayer;
    windows?: StripLayer;
    text?: StripLayer;
  };
  stripProcessed?: boolean;
  originalLogoUrl?: string; // Original logo before AI processing
  vatDisplayMode?: "plus-vat" | "breakdown"; // How VAT is displayed in the quote
  // Frame design (borders, background, section titles, fixed header/footer)
  frameDesign?: import("./frameStyles").FrameDesignSettings;
  repeatHeaderOnAllPages?: boolean; // Pin header strip to top on every printed page
  repeatFooterOnAllPages?: boolean; // Pin company details to bottom on every printed page (default: true)
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
  borderWidth?: number;
  customTextColor?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlign?: "right" | "center" | "left";
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
}
interface CustomTextBoxTemplate {
  id: string;
  label: string;
  title: string;
  content: string;
  position: TextBox["position"];
  style: TextBox["style"];
  customBg?: string;
  customBorder?: string;
  createdAt: string;
}
const CUSTOM_TEMPLATES_LS_KEY = "text-box-custom-templates";
const CUSTOM_COLORS_LS_KEY = "text-box-custom-colors";

// Hebrew fonts available in text boxes
const HEBREW_FONTS = [
  // System
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'David', serif", label: "David" },
  { value: "'Narkisim', serif", label: "Narkisim" },
  { value: "'FrankRuehl', serif", label: "Frank Ruehl (System)" },
  { value: "'Miriam', sans-serif", label: "Miriam" },
  { value: "'Courier New', monospace", label: "Courier New" },
  // Google Sans
  { value: "Heebo", label: "Heebo" },
  { value: "Assistant", label: "Assistant" },
  { value: "Rubik", label: "Rubik" },
  { value: "Alef", label: "Alef" },
  { value: "Varela Round", label: "Varela Round" },
  { value: "Noto Sans Hebrew", label: "Noto Sans Hebrew" },
  { value: "Miriam Libre", label: "Miriam Libre" },
  { value: "M PLUS Rounded 1c", label: "M PLUS Rounded" },
  // Google Serif
  { value: "David Libre", label: "David Libre" },
  { value: "Frank Ruhl Libre", label: "Frank Ruhl Libre" },
  { value: "Noto Serif Hebrew", label: "Noto Serif Hebrew" },
  // Decorative
  { value: "Secular One", label: "Secular One" },
  { value: "Suez One", label: "Suez One" },
  { value: "Amatic SC", label: "Amatic SC" },
  { value: "Karantina", label: "Karantina" },
  { value: "Bellefair", label: "Bellefair" },
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

const MAX_QUOTE_VERSIONS = 5;

function buildAutoVersionLabel(
  versionNumber: number,
  snapshot: QuoteVersion["data"],
  previousVersion: QuoteVersion | null,
): string {
  if (!previousVersion?.data) {
    return `גרסה ${versionNumber} - בסיס`;
  }

  const prev = previousVersion.data;
  const changes: string[] = [];

  if (JSON.stringify(snapshot.stages || []) !== JSON.stringify(prev.stages || [])) {
    changes.push("שלבים");
  }

  if (
    JSON.stringify(snapshot.paymentSteps || []) !==
    JSON.stringify(prev.paymentSteps || [])
  ) {
    changes.push("תשלומים");
  }

  if (Number(snapshot.basePrice || 0) !== Number(prev.basePrice || 0)) {
    changes.push("תמחור");
  }

  if (
    JSON.stringify(snapshot.projectDetails || {}) !==
    JSON.stringify(prev.projectDetails || {})
  ) {
    changes.push("פרטי פרויקט");
  }

  if (
    JSON.stringify(snapshot.designSettings || {}) !==
    JSON.stringify(prev.designSettings || {})
  ) {
    changes.push("עיצוב");
  }

  if (changes.length === 0) {
    return `גרסה ${versionNumber} - שמירה`;
  }

  return `גרסה ${versionNumber} - ${changes.slice(0, 3).join(" + ")}`;
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
  stageTemplateId?: string;
  stageTemplateName?: string;
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

// Field with quick-select options + manual text + input history (48h memory)
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
  const historyKey = `quote_field_history_${fieldKey}`;
  const [options, setOptions] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(historyKey) || "[]") as Array<{ value: string; timestamp: number }>;
      const now = Date.now();
      const hours48 = 48 * 60 * 60 * 1000;
      // Filter to last 48 hours and extract values
      const recent = saved.filter(h => now - h.timestamp < hours48);
      // Clean up expired entries
      if (recent.length !== saved.length) {
        try { localStorage.setItem(historyKey, JSON.stringify(recent)); } catch {}
      }
      return recent.map(h => h.value);
    } catch {
      return [];
    }
  });
  const [newOption, setNewOption] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showAddPopover, setShowAddPopover] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const newOptionRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(options)); } catch {}
  }, [options, storageKey]);

  useEffect(() => {
    if (showAddPopover && newOptionRef.current) newOptionRef.current.focus();
  }, [showAddPopover]);

  // Save value to history when it changes (debounced)
  const saveToHistoryRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!value || value.trim().length < 2) return;
    if (saveToHistoryRef.current) clearTimeout(saveToHistoryRef.current);
    saveToHistoryRef.current = setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(historyKey) || "[]") as Array<{ value: string; timestamp: number }>;
        const now = Date.now();
        const hours48 = 48 * 60 * 60 * 1000;
        // Remove expired + existing same value
        const filtered = saved.filter(h => now - h.timestamp < hours48 && h.value !== value.trim());
        // Add current value at the top
        filtered.unshift({ value: value.trim(), timestamp: now });
        // Keep max 20 entries per field
        const trimmed = filtered.slice(0, 20);
        localStorage.setItem(historyKey, JSON.stringify(trimmed));
        setHistory(trimmed.map(h => h.value));
      } catch {}
      
      // Also save to database for cloud persistence
      (async () => {
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await (supabase as any).from("input_history").upsert({
            user_id: user.id,
            field_key: fieldKey,
            field_value: value.trim(),
            used_at: new Date().toISOString(),
            use_count: 1,
          }, { onConflict: "user_id,field_key,field_value" });
        } catch {}
      })();
    }, 1500);
    return () => { if (saveToHistoryRef.current) clearTimeout(saveToHistoryRef.current); };
  }, [value, fieldKey, historyKey]);

  // Load history from database on mount
  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data } = await (supabase as any)
          .from("input_history")
          .select("field_value")
          .eq("user_id", user.id)
          .eq("field_key", fieldKey)
          .gte("used_at", cutoff)
          .order("used_at", { ascending: false })
          .limit(20);
        if (data && data.length > 0) {
          const dbValues = data.map((d: any) => d.field_value);
          setHistory(prev => {
            const merged = [...new Set([...prev, ...dbValues])];
            return merged.slice(0, 20);
          });
        }
      } catch {}
    })();
  }, [fieldKey]);

  const addOption = () => {
    const trimmed = newOption.trim();
    if (trimmed && !options.includes(trimmed)) {
      setOptions((prev) => [...prev, trimmed]);
      setNewOption("");
    }
  };

  const removeOption = (opt: string) =>
    setOptions((prev) => prev.filter((o) => o !== opt));

  // Handle input change with autocomplete suggestions
  const handleInputChange = (inputVal: string) => {
    onChange(inputVal);
    if (inputVal.trim().length >= 1) {
      const allSuggestions = [...new Set([...options, ...history])];
      const filtered = allSuggestions.filter(s => 
        s.toLowerCase().includes(inputVal.toLowerCase()) && s !== inputVal
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    // Show recent history on focus if field is empty
    if (!value || value.trim().length === 0) {
      const allSuggestions = [...new Set([...history, ...options])];
      if (allSuggestions.length > 0) {
        setFilteredSuggestions(allSuggestions.slice(0, 8));
        setShowSuggestions(true);
      }
    }
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="space-y-1">
      <Label className="text-sm text-gray-600 flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
        {history.length > 0 && (
          <span className="text-[10px] text-gray-400 mr-1" title="זוכר ערכים אחרונים">🕐</span>
        )}
      </Label>
      <div className="relative flex items-center gap-1">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
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

          {/* Autocomplete suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 border rounded-lg bg-white shadow-lg overflow-hidden animate-in slide-in-from-top-1 duration-200 max-h-40 overflow-y-auto">
              {filteredSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-right px-3 py-2 text-sm hover:bg-[#B8860B]/10 transition-colors flex items-center justify-between text-gray-700"
                >
                  <span>{suggestion}</span>
                  <span className="text-[10px] text-gray-400">🕐</span>
                </button>
              ))}
            </div>
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
  stageTemplates = [],
  onTemplateChange,
}: {
  details: ProjectDetails;
  onUpdate: (details: ProjectDetails) => void;
  clients: any[];
  stageTemplates: StageTemplateOption[];
  onTemplateChange?: (template: StageTemplateOption | null) => void;
}) {
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const normalizeClientName = useCallback(
    (value?: string | null) =>
      (value || "").trim().replace(/\s+/g, " ").toLowerCase(),
    [],
  );

  const isQuoteLeadClient = useCallback((client: any) => {
    const source = (client?.source || "").toString();
    const notes = (client?.notes || "").toString();
    return source.includes("הצעת מחיר") || notes.includes("הצעת מחיר");
  }, []);

  const exactClientMatch = useMemo(() => {
    const normalized = normalizeClientName(details.clientName);
    if (!normalized) return null;
    return (
      clients.find((c) => normalizeClientName(c?.name) === normalized) || null
    );
  }, [clients, details.clientName, normalizeClientName]);

  const selectedClientRecord = useMemo(
    () =>
      clients.find((c) => c.id === details.clientId) || exactClientMatch || null,
    [clients, details.clientId, exactClientMatch],
  );

  const shouldShowCreateOption =
    Boolean(details.clientName?.trim()) && !exactClientMatch;

  const selectedTemplate = useMemo(
    () =>
      stageTemplates.find((t) => t.id === details.stageTemplateId) || null,
    [stageTemplates, details.stageTemplateId],
  );

  const filteredClients = useMemo(() => {
    const query = (details.clientName || "").trim().toLowerCase();
    const list = clients.filter((c) => {
      if (!query) return true;
      return (
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query)
      );
    });
    return list;
  }, [clients, details.clientName]);

  const applyClientToDetails = useCallback(
    (client: any) => {
      onUpdate({
        ...details,
        clientId: client.id,
        clientName: client.name || "",
        gush: client.gush || "",
        helka: client.helka || "",
        migrash: client.migrash || "",
        taba: client.taba || "",
        address: client.address || "",
        projectType: details.projectType || "",
        phone: client.phone || details.phone,
        ...(client.email ? ({ email: client.email } as any) : {}),
      } as any);
      setShowClientDropdown(false);
    },
    [details, onUpdate],
  );

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
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-[#B8860B]" />
          פרטי הפרויקט והלקוח
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => {
          if (field.key === "clientName") {
            const Icon = field.icon;
            return (
              <div key={field.key} className="space-y-1 relative">
                <Label className="text-sm text-gray-600 flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  {field.label}
                </Label>

                <Popover
                  open={showClientDropdown}
                  onOpenChange={setShowClientDropdown}
                >
                  <PopoverPrimitive.Anchor asChild>
                    <Input
                      value={(details as any)[field.key] || ""}
                      onClick={() => setShowClientDropdown(true)}
                      onFocus={() => setShowClientDropdown(true)}
                      onChange={(e) => {
                        onUpdate({
                          ...details,
                          clientName: e.target.value,
                          clientId: "",
                        } as any);
                        setShowClientDropdown(true);
                      }}
                      placeholder={`הזן ${field.label}...`}
                      dir="rtl"
                    />
                  </PopoverPrimitive.Anchor>

                  <PopoverContent
                    align="start"
                    sideOffset={4}
                    dir="rtl"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="w-[var(--radix-popover-trigger-width)] p-0 z-[9999]"
                  >
                    <div
                      className="max-h-64 overflow-y-auto overscroll-contain"
                      style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
                      onWheel={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    >
                      {filteredClients.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">
                          לא נמצאו לקוחות
                        </p>
                      ) : (
                        filteredClients.map((client: any) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => applyClientToDetails(client)}
                            className="w-full text-right px-3 py-2.5 text-sm hover:bg-[#B8860B]/10 transition-colors border-b last:border-0"
                          >
                            <div className="font-medium flex items-center gap-2 justify-start">
                              <span>{client.name}</span>
                              {isQuoteLeadClient(client) && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-5 border-amber-300 text-amber-700"
                                >
                                  הצעת מחיר
                                </Badge>
                              )}
                            </div>
                            {(client.phone || client.email) && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {client.phone || ""}
                                {client.phone && client.email ? " • " : ""}
                                {client.email || ""}
                              </div>
                            )}
                          </button>
                        ))
                      )}

                      {shouldShowCreateOption && (
                        <button
                          type="button"
                          onClick={() => {
                            const typedName = details.clientName.trim();
                            if (!typedName) return;
                            onUpdate({
                              ...details,
                              clientName: typedName,
                              clientId: "",
                            } as any);
                            setShowClientDropdown(false);
                          }}
                          className="w-full text-right px-3 py-2.5 text-sm bg-amber-50 hover:bg-amber-100 transition-colors border-t border-amber-200"
                        >
                          <span className="font-medium">+ צור לקוח חדש: {details.clientName.trim()}</span>
                          <div className="text-[11px] text-amber-700 mt-0.5">
                            יסומן כליד מסוג "הצעת מחיר" בשמירה
                          </div>
                        </button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {selectedClientRecord && isQuoteLeadClient(selectedClientRecord) && (
                  <p className="text-xs text-amber-700 mt-1">
                    הערה: זה לקוח מסוג "הצעת מחיר" (טרם נסגר)
                  </p>
                )}
              </div>
            );
          }

          return (
            <FieldWithOptions
              key={field.key}
              fieldKey={field.key}
              label={field.label}
              icon={field.icon}
              value={(details as any)[field.key] || ""}
              onChange={(val) => onUpdate({ ...details, [field.key]: val })}
              placeholder={`הזן ${field.label}...`}
            />
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        <Label className="text-sm text-gray-600 flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          שיוך פנימי לתבנית שלבים
        </Label>
        <Select
          value={details.stageTemplateId || "__none__"}
          onValueChange={(value) => {
            if (value === "__none__") {
              onUpdate({
                ...details,
                stageTemplateId: "",
                stageTemplateName: "",
              });
              onTemplateChange?.(null);
              return;
            }

            const template = stageTemplates.find((t) => t.id === value) || null;
            onUpdate({
              ...details,
              stageTemplateId: template?.id || "",
              stageTemplateName: template?.name || "",
            });
            onTemplateChange?.(template);
          }}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="בחר תבנית שלבים לפרויקט" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">ללא שיוך תבנית</SelectItem>
            {stageTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          השיוך פנימי בלבד ולא יוצג ללקוח במסמך ההצעה.
          {selectedTemplate ? ` נבחרה תבנית: ${selectedTemplate.name}` : ""}
        </p>
      </div>
    </div>
  );
}

const ITEM_ICON_OPTIONS = [
  { value: "✓", label: "וי" },
  { value: "•", label: "נקודה" },
  { value: "▸", label: "חץ" },
  { value: "★", label: "כוכב" },
  { value: "◆", label: "יהלום" },
  { value: "–", label: "קו" },
  { value: "→", label: "חץ ימין" },
  { value: "▶", label: "משולש" },
  { value: "📌", label: "פין" },
  { value: "✅", label: "וי ירוק" },
  { value: "🔹", label: "כחול" },
  { value: "🔸", label: "כתום" },
  { value: "💠", label: "תכלת" },
  { value: "", label: "ללא" },
];

const ITEM_ICON_COLORS = [
  "#DAA520",
  "#d8ac27",
  "#374151",
  "#1e40af",
  "#b91c1c",
  "#15803d",
  "#7e22ce",
  "#000000",
];

function EditableItem({
  item,
  onUpdate,
  onDelete,
  isSelected,
  onToggleSelect,
  stageDisplayMode,
  stageIconColor,
  itemIndex,
}: {
  item: TemplateStageItem;
  onUpdate: (item: TemplateStageItem) => void;
  onDelete: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  stageDisplayMode?: TemplateStage["itemDisplayMode"];
  stageIconColor?: string;
  itemIndex?: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);
  const [inlinePos, setInlinePos] = useState<{ top: number; left: number } | null>(null);

  // Populate contentEditable when entering edit mode
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.innerHTML = item.text;
      editRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editRef.current);
      range.collapse(false);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  }, [isEditing]);

  // Show inline toolbar on text selection inside the contentEditable
  useEffect(() => {
    if (!isEditing) return;
    const onSel = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !editRef.current?.contains(sel.anchorNode)) {
        setInlinePos(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect.width && !rect.height) { setInlinePos(null); return; }
      const TOOLBAR_H = 44;
      const top = rect.top >= TOOLBAR_H + 4 ? rect.top - TOOLBAR_H : rect.bottom + 6;
      const left = Math.max(130, Math.min(window.innerWidth - 130, rect.left + rect.width / 2));
      setInlinePos({ top, left });
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [isEditing]);

  const handleSave = () => {
    if (editRef.current) onUpdate({ ...item, text: editRef.current.innerHTML });
    setIsEditing(false);
    setInlinePos(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInlinePos(null);
  };

  const applyFormat = (cmd: string, val?: string) => {
    editRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const updateStyle = (updates: Partial<TemplateStageItem>) => {
    onUpdate({ ...item, ...updates });
  };

  const quickColors = [
    "#000000", "#374151", "#6b7280",
    "#1e40af", "#b91c1c", "#15803d", "#854d0e", "#7e22ce",
  ];

  if (isEditing)
    return (
      <div className="py-2 px-3 bg-yellow-50 border border-yellow-300 rounded-lg space-y-2">
        {/* Floating inline toolbar — appears on text selection */}
        {inlinePos && createPortal(
          <div
            className="fixed z-[300] flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white shadow-xl px-1.5 py-1"
            style={{ top: inlinePos.top, left: inlinePos.left, transform: "translateX(-50%)" }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button onClick={() => applyFormat("bold")} className="px-2 py-1 rounded hover:bg-gray-100 font-bold text-sm leading-none" title="מודגש">B</button>
            <button onClick={() => applyFormat("italic")} className="px-2 py-1 rounded hover:bg-gray-100 italic text-sm leading-none" title="נטוי">I</button>
            <button onClick={() => applyFormat("underline")} className="px-2 py-1 rounded hover:bg-gray-100 underline text-sm leading-none" title="קו תחתון">U</button>
            <div className="w-px h-4 bg-gray-200 mx-0.5" />
            <button onClick={() => applyFormat("foreColor", "#dc2626")} className="px-1.5 py-1 rounded hover:bg-gray-100 text-red-600 font-bold text-sm leading-none" title="אדום">A</button>
            <button onClick={() => applyFormat("foreColor", "#1d4ed8")} className="px-1.5 py-1 rounded hover:bg-gray-100 text-blue-700 font-bold text-sm leading-none" title="כחול">A</button>
            <button onClick={() => applyFormat("foreColor", "#15803d")} className="px-1.5 py-1 rounded hover:bg-gray-100 text-green-700 font-bold text-sm leading-none" title="ירוק">A</button>
            <span className="relative w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer" title="צבע מותאם">
              <span className="font-bold text-sm leading-none select-none">A</span>
              <input
                type="color"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => applyFormat("foreColor", e.target.value)}
              />
            </span>
            <div className="w-px h-4 bg-gray-200 mx-0.5" />
            <button onClick={() => applyFormat("removeFormat")} className="px-1.5 py-1 rounded hover:bg-gray-100 text-gray-400 text-xs leading-none" title="נקה עיצוב">✕</button>
          </div>,
          document.body
        )}

        {/* ContentEditable field */}
        <div className="flex items-center gap-2">
          <div
            ref={editRef}
            contentEditable
            suppressContentEditableWarning
            dir="rtl"
            onKeyDown={(e) => {
              if (e.key === "Escape") handleCancel();
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); }
            }}
            className="flex-1 min-h-[28px] text-sm outline-none border-b border-yellow-400 py-0.5 px-1"
            style={{
              fontFamily: item.fontFamily || "Heebo",
              fontWeight: item.isBold ? "bold" : "normal",
              fontStyle: item.isItalic ? "italic" : "normal",
              textDecoration: item.isUnderline ? "underline" : "none",
              textAlign: (item.textAlign || "right") as React.CSSProperties["textAlign"],
              fontSize: item.fontSize ? `${item.fontSize}px` : undefined,
              color: item.fontColor || "#374151",
            }}
          />
          <Button size="sm" variant="ghost" onMouseDown={handleSave} className="h-7 w-7 p-0 text-green-600 hover:text-green-700">
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onMouseDown={handleCancel} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Whole-item formatting toolbar */}
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
                <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
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
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6" title="צבע טקסט">
                <span className="w-4 h-4 rounded border" style={{ backgroundColor: item.fontColor || "#000000" }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex gap-1">
                {quickColors.map((c) => (
                  <button
                    key={c}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    onClick={() => updateStyle({ fontColor: c === "#000000" ? undefined : c })}
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
          <Button size="icon" variant={item.isBold ? "default" : "ghost"} className="h-6 w-6" onClick={() => updateStyle({ isBold: !item.isBold })}>
            <Bold className="h-3 w-3" />
          </Button>
          <Button size="icon" variant={item.isItalic ? "default" : "ghost"} className="h-6 w-6" onClick={() => updateStyle({ isItalic: !item.isItalic })}>
            <Italic className="h-3 w-3" />
          </Button>
          <Button size="icon" variant={item.isUnderline ? "default" : "ghost"} className="h-6 w-6" onClick={() => updateStyle({ isUnderline: !item.isUnderline })}>
            <Underline className="h-3 w-3" />
          </Button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <Button size="icon" variant={item.textAlign === "right" || !item.textAlign ? "default" : "ghost"} className="h-6 w-6" onClick={() => updateStyle({ textAlign: "right" })}>
            <AlignRight className="h-3 w-3" />
          </Button>
          <Button size="icon" variant={item.textAlign === "center" ? "default" : "ghost"} className="h-6 w-6" onClick={() => updateStyle({ textAlign: "center" })}>
            <AlignCenter className="h-3 w-3" />
          </Button>
          <Button size="icon" variant={item.textAlign === "left" ? "default" : "ghost"} className="h-6 w-6" onClick={() => updateStyle({ textAlign: "left" })}>
            <AlignLeft className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );

  // Spacer item — render a thin divider line instead of a text item
  if (item.isSpacer) {
    return (
      <div className="flex items-center gap-2 py-0.5 group">
        <DragHandle className="h-4 w-4 text-gray-300 flex-shrink-0" />
        <div className="flex-1 border-t border-dashed border-gray-300" />
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  const getEffectiveIcon = () => {
    if (item.icon !== undefined) return item.icon;
    switch (stageDisplayMode ?? "check") {
      case "numbered": return itemIndex !== undefined ? `${itemIndex + 1}.` : "✓";
      case "bullet": return "•";
      case "none": return "";
      default: return "✓";
    }
  };
  const currentIcon = getEffectiveIcon();
  const currentIconColor = item.iconColor || stageIconColor || "#DAA520";

  return (
    <div className={`flex items-center gap-2 py-2 group hover:bg-gray-50 rounded-lg px-1 ${isSelected ? "bg-blue-50" : ""}`}>
      <DragHandle className="h-4 w-4 text-gray-300" />
      {onToggleSelect && (
        <button
          onClick={onToggleSelect}
          className={`w-4 h-4 rounded border-2 flex-shrink-0 transition-colors ${isSelected ? "bg-[#DAA520] border-[#DAA520]" : "border-gray-300 opacity-0 group-hover:opacity-100"}`}
          title="בחר פריט"
        >
          {isSelected && <span className="text-white text-[9px] flex items-center justify-center w-full h-full leading-none">✓</span>}
        </button>
      )}
      <Popover open={showIconPicker} onOpenChange={setShowIconPicker}>
        <PopoverTrigger asChild>
          <button
            className="text-lg min-w-[22px] hover:opacity-70 transition-opacity cursor-pointer leading-none"
            style={{ color: currentIconColor }}
            title="לחץ לשינוי אייקון"
          >
            {currentIcon === "" ? (
              <span className="text-[10px] text-gray-300 border border-dashed border-gray-300 rounded px-0.5">–</span>
            ) : (
              currentIcon
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3 space-y-3" align="start" side="bottom">
          <p className="text-xs font-medium text-gray-500 mb-1">סמל</p>
          <div className="grid grid-cols-7 gap-1">
            {ITEM_ICON_OPTIONS.map((opt) => (
              <button
                key={opt.value + opt.label}
                className={`w-8 h-8 flex items-center justify-center rounded text-base hover:bg-gray-100 transition-colors ${currentIcon === opt.value ? "bg-gray-200 ring-1 ring-gray-400" : ""}`}
                onClick={() => { onUpdate({ ...item, icon: opt.value }); setShowIconPicker(false); }}
                title={opt.label}
              >
                {opt.value === "" ? <span className="text-[10px] text-gray-400">ללא</span> : opt.value}
              </button>
            ))}
          </div>
          <div className="h-px bg-gray-200" />
          <p className="text-xs font-medium text-gray-500">צבע האייקון</p>
          <div className="flex gap-1 flex-wrap">
            {ITEM_ICON_COLORS.map((c) => (
              <button
                key={c}
                className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${currentIconColor === c ? "border-gray-900" : "border-transparent"}`}
                style={{ backgroundColor: c }}
                onClick={() => onUpdate({ ...item, iconColor: c })}
              />
            ))}
            <Input
              type="color"
              value={currentIconColor}
              onChange={(e) => onUpdate({ ...item, iconColor: e.target.value })}
              className="w-7 h-6 p-0 border-0 cursor-pointer"
            />
          </div>
        </PopoverContent>
      </Popover>
      <span
        className="flex-1 cursor-pointer hover:text-[#B8860B]"
        onClick={() => setIsEditing(true)}
        style={{
          fontFamily: item.fontFamily || "Heebo",
          fontWeight: item.isBold ? "bold" : "normal",
          fontStyle: item.isItalic ? "italic" : "normal",
          textDecoration: item.isUnderline ? "underline" : "none",
          textAlign: (item.textAlign || "right") as React.CSSProperties["textAlign"],
          fontSize: item.fontSize ? `${item.fontSize}px` : undefined,
          color: item.fontColor || "#374151",
        }}
        dangerouslySetInnerHTML={{ __html: item.text }}
      />
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(true)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ===== Drag-and-Drop infrastructure for stages + items =====
type DragHandleCtx = {
  attributes: Record<string, any>;
  listeners: Record<string, any> | undefined;
  setActivatorNodeRef?: (el: HTMLElement | null) => void;
  isDragging?: boolean;
} | null;
const DragHandleContext = createContext<DragHandleCtx>(null);

function DragHandle({
  className = "h-4 w-4 text-gray-300 flex-shrink-0",
  alwaysVisible = false,
  title = "גרור לסידור מחדש",
}: { className?: string; alwaysVisible?: boolean; title?: string }) {
  const ctx = useContext(DragHandleContext);
  if (!ctx) return <GripVertical className={className} />;
  return (
    <div
      ref={(el) => ctx.setActivatorNodeRef?.(el as HTMLElement | null)}
      role="button"
      tabIndex={0}
      {...(ctx.attributes as Record<string, any>)}
      {...(ctx.listeners as Record<string, any>)}
      title={title}
      className={`${className} inline-flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none ${alwaysVisible ? "opacity-60 hover:opacity-100" : "opacity-30 hover:opacity-100"} ${ctx.isDragging ? "opacity-100" : ""}`}
      style={{ touchAction: "none" }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <GripVertical className="w-full h-full pointer-events-none" />
    </div>
  );
}

function SortableStageBlock({
  id,
  isSection,
  children,
}: {
  id: string;
  isSection?: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: "stage", isSection } });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <DragHandleContext.Provider value={{ attributes, listeners, setActivatorNodeRef, isDragging }}>
        {children}
      </DragHandleContext.Provider>
    </div>
  );
}

function InsertBetweenStages({
  onInsertStage,
  onInsertSection,
}: {
  onInsertStage: () => void;
  onInsertSection: () => void;
}) {
  return (
    <div className="group relative h-2 my-0.5 flex items-center justify-center">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-transparent group-hover:bg-[#DAA520]/30 transition-colors" />
      <div className="relative flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-[#DAA520]/40 rounded-full shadow-sm px-1 py-0.5">
        <button
          type="button"
          onClick={onInsertStage}
          title="הוסף שלב כאן"
          className="flex items-center gap-1 text-[10px] font-medium text-[#B8860B] hover:bg-[#DAA520]/10 rounded-full px-2 py-0.5"
        >
          <Plus className="h-3 w-3" />
          שלב
        </button>
        <span className="w-px h-3 bg-[#DAA520]/30" />
        <button
          type="button"
          onClick={onInsertSection}
          title="הוסף כותרת ראשית כאן"
          className="flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50 rounded-full px-2 py-0.5"
        >
          <Plus className="h-3 w-3" />
          כותרת ראשית
        </button>
      </div>
    </div>
  );
}

function SortableItemBlock({
  id,
  stageId,
  children,
}: {
  id: string;
  stageId: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: "item", stageId } });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <DragHandleContext.Provider value={{ attributes, listeners, setActivatorNodeRef, isDragging }}>
        {children}
      </DragHandleContext.Provider>
    </div>
  );
}

function StagesDndProvider({
  stages,
  onChange,
  children,
}: {
  stages: TemplateStage[];
  onChange: (next: TemplateStage[]) => void;
  children: React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const stagesRef = useRef(stages);
  stagesRef.current = stages;

  const findStageByItemId = (itemId: string) =>
    stagesRef.current.find((s) => s.items.some((i) => i.id === itemId));

  const handleDragOver = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const aType = (active.data.current as any)?.type;
    if (aType !== "item") return;
    if (active.id === over.id) return;

    const overType = (over.data.current as any)?.type;
    const fromStage = findStageByItemId(active.id as string);
    if (!fromStage) return;

    let toStageId: string;
    if (overType === "item") {
      toStageId = (over.data.current as any).stageId;
    } else if (overType === "stage") {
      toStageId = over.id as string;
    } else {
      return;
    }
    if (fromStage.id === toStageId) return;

    const toStage = stagesRef.current.find((s) => s.id === toStageId);
    if (!toStage || toStage.isSection) return;

    const newStages = stagesRef.current.map((s) => ({ ...s, items: [...s.items] }));
    const from = newStages.find((s) => s.id === fromStage.id)!;
    const to = newStages.find((s) => s.id === toStageId)!;
    const fromIdx = from.items.findIndex((i) => i.id === active.id);
    if (fromIdx < 0) return;
    const [moved] = from.items.splice(fromIdx, 1);
    const overIdx = overType === "item" ? to.items.findIndex((i) => i.id === over.id) : to.items.length;
    to.items.splice(overIdx >= 0 ? overIdx : to.items.length, 0, moved);
    onChange(newStages);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const aType = (active.data.current as any)?.type;

    if (aType === "stage") {
      const oldIdx = stagesRef.current.findIndex((s) => s.id === active.id);
      const newIdx = stagesRef.current.findIndex((s) => s.id === over.id);
      if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return;
      onChange(arrayMove(stagesRef.current, oldIdx, newIdx));
      return;
    }

    if (aType === "item") {
      const overType = (over.data.current as any)?.type;
      const stage = findStageByItemId(active.id as string);
      if (!stage) return;
      if (overType === "item" && stage.items.some((i) => i.id === over.id)) {
        const oldIdx = stage.items.findIndex((i) => i.id === active.id);
        const newIdx = stage.items.findIndex((i) => i.id === over.id);
        if (oldIdx === newIdx) return;
        const newItems = arrayMove(stage.items, oldIdx, newIdx);
        onChange(stagesRef.current.map((s) => (s.id === stage.id ? { ...s, items: newItems } : s)));
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      {children}
    </DndContext>
  );
}

function SectionHeaderRow({
  stage,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddStageBelow,
  onAddSectionBelow,
  isFirst,
  isLast,
}: {
  stage: TemplateStage;
  onUpdate: (stage: TemplateStage) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddStageBelow: () => void;
  onAddSectionBelow?: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(stage.name);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (isEditing) inputRef.current?.focus(); }, [isEditing]);

  const save = () => { onUpdate({ ...stage, name }); setIsEditing(false); };

  return (
    <div className="flex items-center justify-between gap-2 mt-4 group">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <DragHandle className="h-4 w-4 text-gray-300 flex-shrink-0" alwaysVisible title="גרור לסידור מחדש של כותרת ראשית" />
        {isEditing ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setName(stage.name); setIsEditing(false); } }}
            className="text-xl font-bold bg-transparent border-b-2 border-[#DAA520] outline-none flex-1"
            dir="rtl"
          />
        ) : (
          <h2
            className="text-xl font-bold cursor-pointer hover:text-[#B8860B] flex items-center gap-1 group/title"
            onClick={() => setIsEditing(true)}
            title="לחץ לעריכת כותרת"
          >
            {stage.name}
            <Pencil className="h-3 w-3 opacity-0 group-hover/title:opacity-40 transition-opacity" />
          </h2>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="border-[#DAA520] text-[#B8860B] hover:bg-[#DAA520]/10"
          onClick={onAddStageBelow}
        >
          <Plus className="h-4 w-4 ml-1" />
          הוסף שלב
        </Button>
        {onAddSectionBelow && (
          <Button
            variant="outline"
            size="sm"
            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            onClick={onAddSectionBelow}
            title="הוסף כותרת ראשית מתחת"
          >
            <Heading2 className="h-4 w-4 ml-1" />
            הוסף כותרת
          </Button>
        )}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onMoveUp} disabled={isFirst}>
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onMoveDown} disabled={isLast}>
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
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
  allStages,
  onMoveToStage,
  onCreateTextBox,
  onAddStagesAfter,
}: {
  stage: TemplateStage;
  onUpdate: (stage: TemplateStage) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  allStages: TemplateStage[];
  onMoveToStage: (itemIds: string[], targetStageId: string, position: "start" | "end") => void;
  onCreateTextBox: (items: TemplateStageItem[], format: "lines" | "numbered" | "checkmarks") => void;
  onAddStagesAfter?: (stages: TemplateStage[]) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [stageName, setStageName] = useState(stage.name);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [textBoxFormat, setTextBoxFormat] = useState<"lines" | "numbered" | "checkmarks">("lines");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkSections, setBulkSections] = useState<Array<{ name: string; text: string; icon?: string }>>([]);


  const toggleItemSelect = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const deleteSelectedItems = () => {
    onUpdate({ ...stage, items: stage.items.filter((i) => !selectedItemIds.has(i.id)) });
    setSelectedItemIds(new Set());
  };
  const applyFontToSelected = (font: string) => {
    onUpdate({ ...stage, items: stage.items.map((i) => selectedItemIds.has(i.id) ? { ...i, fontFamily: font } : i) });
  };

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
  const openBulkImport = () => {
    // Pre-populate with existing items of current stage as first section
    const existingText = stage.items
      .map((item) => {
        if (item.isSpacer) return "";
        return item.text
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .trim();
      })
      .join("\n");
    setBulkSections([{ name: stage.name, text: existingText, icon: stage.icon }]);
    setShowBulkImport(true);
  };

  const applyBulkImport = () => {
    if (bulkSections.length === 0) {
      setShowBulkImport(false);
      return;
    }
    const toItems = (text: string): TemplateStageItem[] =>
      text.split("\n").map((line, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random()}`,
        text: line.trim(),
        isSpacer: line.trim() === "",
      }));

    // First section -> update current stage (name + items)
    const first = bulkSections[0];
    onUpdate({ ...stage, name: first.name || stage.name, icon: first.icon ?? stage.icon, items: toItems(first.text) });

    // Additional sections -> create new stages after current
    const extra = bulkSections.slice(1);
    if (extra.length > 0 && onAddStagesAfter) {
      const newStages: TemplateStage[] = extra.map((sec, i) => ({
        id: `${Date.now() + i + 1}-${Math.random()}`,
        name: sec.name || `שלב ${i + 2}`,
        icon: sec.icon || "📋",
        items: toItems(sec.text),
        itemDisplayMode: "check",
      }));
      onAddStagesAfter(newStages);
    }

    setBulkSections([]);
    setShowBulkImport(false);
  };
  const saveNameChange = () => {
    onUpdate({ ...stage, name: stageName });
    setIsEditingName(false);
  };
  const stageIcons = [
    "📋", "🔍", "📐", "✏️", "📁", "🏗️", "🔧", "✅", "📊", "🎯",
    "🏠", "🏢", "🛠️", "📝", "💡", "🎨", "📦", "🚧", "⚙️", "🔑",
    "📌", "⭐", "🏆", "💼", "📅", "💰", "🔔", "🎉", "🚀", "🧭",
  ];
  const iconColors = [
    null, "#d8ac27", "#162C58", "#ef4444", "#10b981", "#3b82f6",
    "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#6b7280",
  ];
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 bg-gradient-to-l from-gray-50 to-white">
        <DragHandle className="h-5 w-5 text-gray-400 flex-shrink-0" alwaysVisible title="גרור לסידור מחדש של השלב" />

        <Popover>
          <PopoverTrigger asChild>
            <button
              className="text-xl hover:scale-110 transition-transform cursor-pointer rounded-lg w-9 h-9 flex items-center justify-center"
              style={
                stage.iconColor
                  ? { backgroundColor: stage.iconColor + "20", border: `1px solid ${stage.iconColor}` }
                  : undefined
              }
            >
              {stage.icon ? (
                <span style={stage.iconColor ? { filter: "none" } : undefined}>{stage.icon}</span>
              ) : (
                <span className="text-muted-foreground text-sm">+</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 rtl" align="start">
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">בחר אייקון</div>
                <div className="grid grid-cols-6 gap-1">
                  {stageIcons.map((icon) => (
                    <button
                      key={icon}
                      className={`p-2 hover:bg-gray-100 rounded text-xl ${stage.icon === icon ? "bg-[#d8ac27]/20 ring-1 ring-[#d8ac27]" : ""}`}
                      onClick={() => onUpdate({ ...stage, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">צבע רקע אייקון</div>
                <div className="flex flex-wrap gap-1">
                  {iconColors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => onUpdate({ ...stage, iconColor: color || undefined })}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${
                        (stage.iconColor || null) === color ? "border-gray-900" : "border-gray-200"
                      }`}
                      style={{ backgroundColor: color || "transparent" }}
                      title={color || "ללא"}
                    >
                      {!color && <X className="h-3 w-3 text-gray-400" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={stage.iconColor || "#d8ac27"}
                    onChange={(e) => onUpdate({ ...stage, iconColor: e.target.value })}
                    className="w-7 h-7 rounded-full border-2 border-gray-200 cursor-pointer p-0"
                    title="צבע מותאם"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-red-500 hover:bg-red-50"
                onClick={() => onUpdate({ ...stage, icon: undefined, iconColor: undefined })}
              >
                <Trash2 className="h-3 w-3 ml-1" />
                הסר אייקון
              </Button>
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

        {/* Item display mode + icon color — visible for regular stages */}
        {!stage.isSection && (
          <div className="flex items-center border border-gray-200 rounded overflow-hidden text-xs font-mono">
            {([
              { mode: "check" as const, label: "✓", title: "ווי" },
              { mode: "numbered" as const, label: "1.", title: "מספרים" },
              { mode: "bullet" as const, label: "•", title: "עיגול" },
              { mode: "none" as const, label: "—", title: "ללא סימון" },
            ]).map((opt) => (
              <button
                key={opt.mode}
                title={opt.title}
                onClick={() => onUpdate({ ...stage, itemDisplayMode: opt.mode })}
                className="px-1.5 py-0.5 transition-colors"
                style={
                  (stage.itemDisplayMode ?? "check") === opt.mode
                    ? { backgroundColor: stage.itemDisplayColor || "#DAA520", color: "#fff" }
                    : { color: "#9ca3af" }
                }
              >
                {opt.label}
              </button>
            ))}
            {/* Color picker dot */}
            <label
              className="flex items-center justify-center px-1.5 py-0.5 cursor-pointer border-r border-gray-200 border-l"
              title="צבע האייקונים"
            >
              <span
                className="w-3 h-3 rounded-full border border-gray-400 inline-block"
                style={{ backgroundColor: stage.itemDisplayColor || "#DAA520" }}
              />
              <input
                type="color"
                value={stage.itemDisplayColor || "#DAA520"}
                onChange={(e) => onUpdate({ ...stage, itemDisplayColor: e.target.value })}
                className="sr-only"
              />
            </label>
          </div>
        )}

        {/* Select-all toggle */}
        {stage.items.length > 0 && (
          <button
            title={selectedItemIds.size === stage.items.length ? "נקה בחירה" : "בחר הכל"}
            onClick={() => {
              if (selectedItemIds.size === stage.items.length) {
                setSelectedItemIds(new Set());
              } else {
                setSelectedItemIds(new Set(stage.items.map(i => i.id)));
              }
            }}
            className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors flex-shrink-0 ${
              selectedItemIds.size === stage.items.length
                ? "bg-[#DAA520] border-[#DAA520]"
                : selectedItemIds.size > 0
                ? "bg-[#DAA520]/40 border-[#DAA520]"
                : "border-gray-300 hover:border-[#DAA520]"
            }`}
          >
            {selectedItemIds.size === stage.items.length && (
              <span className="text-white text-[9px] leading-none">✓</span>
            )}
            {selectedItemIds.size > 0 && selectedItemIds.size < stage.items.length && (
              <span className="text-white text-[10px] leading-none font-bold">−</span>
            )}
          </button>
        )}
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
          {selectedItemIds.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 border-b border-blue-100 text-xs flex-wrap">
              <span className="font-medium text-blue-700">{selectedItemIds.size} נבחרו</span>
              {/* Format picker for selected items */}
              <div className="flex items-center gap-0 border border-blue-200 rounded overflow-hidden font-mono">
                {([
                  { icon: "✓", title: "וי" },
                  { icon: "1.", title: "מספרים" },
                  { icon: "•", title: "נקודה" },
                  { icon: "", title: "ללא סימון" },
                ] as const).map((opt, idx) => (
                  <button
                    key={idx}
                    title={opt.title}
                    onClick={() => {
                      const selectedOrder = stage.items
                        .map((it, i) => ({ it, i }))
                        .filter(({ it }) => selectedItemIds.has(it.id));
                      onUpdate({
                        ...stage,
                        items: stage.items.map((it) => {
                          if (!selectedItemIds.has(it.id)) return it;
                          const pos = selectedOrder.findIndex(x => x.it.id === it.id);
                          const icon = opt.icon === "1." ? `${pos + 1}.` : opt.icon;
                          return { ...it, icon };
                        }),
                      });
                    }}
                    className="px-2 py-1 text-xs leading-none hover:bg-blue-100 text-blue-800 transition-colors border-r border-blue-200 last:border-r-0"
                  >
                    {opt.icon === "" ? "—" : opt.icon}
                  </button>
                ))}
              </div>
              <Select onValueChange={applyFontToSelected}>
                <SelectTrigger className="h-6 w-28 text-xs"><SelectValue placeholder="שנה גופן" /></SelectTrigger>
                <SelectContent>
                  {HEBREW_FONTS.slice(0, 12).map((f) => (
                    <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Move to stage */}
              {allStages.filter(s => s.id !== stage.id).length > 0 && (
                <Select onValueChange={(value) => {
                  const [targetId, pos] = value.split("|");
                  onMoveToStage(Array.from(selectedItemIds), targetId, pos as "start" | "end");
                  setSelectedItemIds(new Set());
                }}>
                  <SelectTrigger className="h-6 w-32 text-xs"><SelectValue placeholder="העבר אל..." /></SelectTrigger>
                  <SelectContent>
                    {allStages.filter(s => s.id !== stage.id).map(s => (
                      <React.Fragment key={s.id}>
                        <SelectItem value={`${s.id}|start`}>תחילת: {s.name}</SelectItem>
                        <SelectItem value={`${s.id}|end`}>סוף: {s.name}</SelectItem>
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {/* Create text box */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
                    <FileText className="h-3 w-3" /> צור תיבת טקסט
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 rtl" align="start">
                  <div className="space-y-1 text-xs">
                    <div className="font-medium text-muted-foreground mb-1">בחר פורמט</div>
                    {([
                      { value: "lines" as const, label: "שורות רגילות" },
                      { value: "numbered" as const, label: "רשימה ממוספרת" },
                      { value: "checkmarks" as const, label: "✓ עם וי" },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        className={`w-full text-right px-2 py-1.5 rounded hover:bg-gray-100 ${textBoxFormat === opt.value ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                        onClick={() => setTextBoxFormat(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <hr className="my-1" />
                    <button
                      className="w-full text-center px-2 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium"
                      onClick={() => {
                        const selected = stage.items.filter(i => selectedItemIds.has(i.id));
                        onCreateTextBox(selected, textBoxFormat);
                      }}
                    >
                      צור תיבת טקסט
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
              <button onClick={deleteSelectedItems} className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium">
                <Trash2 className="h-3 w-3" /> מחק
              </button>
              <button onClick={() => setSelectedItemIds(new Set())} className="text-gray-400 hover:text-gray-600 mr-auto">
                בטל בחירה
              </button>
            </div>
          )}
          <div className="p-4 space-y-1 min-h-[20px]">
            <SortableContext items={stage.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {stage.items.map((item, idx) => (
                <SortableItemBlock key={item.id} id={item.id} stageId={stage.id}>
                  <EditableItem
                    item={item}
                    onUpdate={(updatedItem) => updateItem(item.id, updatedItem)}
                    onDelete={() => deleteItem(item.id)}
                    isSelected={selectedItemIds.has(item.id)}
                    onToggleSelect={() => toggleItemSelect(item.id)}
                    stageDisplayMode={stage.itemDisplayMode}
                    stageIconColor={stage.itemDisplayColor}
                    itemIndex={idx}
                  />
                </SortableItemBlock>
              ))}
            </SortableContext>
          </div>
          <div className="px-4 pb-4 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#B8860B] hover:bg-[#DAA520]/10 flex-1 justify-center"
              onClick={addItem}
            >
              <Plus className="h-4 w-4 ml-1" />
              הוסף פריט
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-indigo-600 hover:bg-indigo-50"
              onClick={openBulkImport}
              title="עריכת רשימה — כל שורה = פריט"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk import dialog - multi-stage */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListPlus className="h-5 w-5 text-indigo-600" />
              עריכת רשימת פריטים ושלבים
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            כל שורה = פריט &bull; שורה ריקה = רווח בין קבוצות &bull; השלב הראשון מחליף את הפריטים הקיימים, שלבים נוספים נוצרים אחריו
          </p>

          <div className="space-y-4 mt-2">
            {bulkSections.map((section, idx) => (
              <div key={idx} className="border border-[#DAA520]/30 rounded-lg p-3 bg-[#DAA520]/5 space-y-2 relative">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  <Input
                    value={section.name}
                    onChange={(e) => {
                      const next = [...bulkSections];
                      next[idx] = { ...next[idx], name: e.target.value };
                      setBulkSections(next);
                    }}
                    placeholder={idx === 0 ? "שם השלב (קיים)" : "שם השלב החדש"}
                    className="flex-1 font-medium"
                  />
                  {idx > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:bg-red-50"
                      onClick={() => {
                        setBulkSections(bulkSections.filter((_, i) => i !== idx));
                      }}
                      title="הסר שלב"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Textarea
                  value={section.text}
                  onChange={(e) => {
                    const next = [...bulkSections];
                    next[idx] = { ...next[idx], text: e.target.value };
                    setBulkSections(next);
                  }}
                  rows={6}
                  dir="rtl"
                  placeholder={"פריט ראשון\nפריט שני\nפריט שלישי\n\nפריט אחרי רווח"}
                  className="text-sm resize-none font-mono"
                  autoFocus={idx === bulkSections.length - 1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); applyBulkImport(); }
                  }}
                />
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full border-dashed border-indigo-400 text-indigo-600 hover:bg-indigo-50"
              onClick={() => {
                setBulkSections([...bulkSections, { name: `שלב ${bulkSections.length + 1}`, text: "", icon: "📋" }]);
              }}
            >
              <Plus className="h-4 w-4 ml-1" />
              הוסף שלב
            </Button>
          </div>

          <DialogFooter className="flex gap-2 flex-row-reverse mt-4">
            <Button onClick={applyBulkImport}>
              שמור הכל
            </Button>
            <Button variant="outline" onClick={() => setShowBulkImport(false)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentStepEditor({
  step,
  onUpdate,
  onDelete,
  defaultVatRate,
  templateStages = [],
  templateName,
  quoteTemplateStages = [],
  templateKey,
  onPreferenceChange,
  basePrice = 0,
}: {
  step: PaymentStep;
  onUpdate: (step: PaymentStep) => void;
  onDelete: () => void;
  defaultVatRate: number;
  templateStages: StageTemplateStageOption[];
  templateName?: string;
  quoteTemplateStages?: TemplateStage[];
  templateKey?: string;
  onPreferenceChange?: () => void;
  basePrice?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [assignmentSourceTab, setAssignmentSourceTab] =
    useState<AssignmentSourceTab>("stage-template");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentViewMode, setAssignmentViewMode] =
    useState<AssignmentViewMode>(() => {
      try {
        const stored = localStorage.getItem(
          `quote-payment-assignment-view:${templateKey || "draft-template"}`,
        );
        if (stored === "chips" || stored === "cards" || stored === "list") {
          return stored;
        }
      } catch {
        // no-op
      }
      return "cards";
    });
  const [activeStageTemplateTab, setActiveStageTemplateTab] = useState(
    ASSIGNMENT_ALL_STAGE_FILTER,
  );
  const [activeQuoteTemplateTab, setActiveQuoteTemplateTab] = useState(
    ASSIGNMENT_ALL_STAGE_FILTER,
  );
  const assignmentSourceStorageKey = useMemo(
    () => `quote-payment-assignment-source:${templateKey || "draft-template"}`,
    [templateKey],
  );
  const assignmentViewStorageKey = useMemo(
    () => `quote-payment-assignment-view:${templateKey || "draft-template"}`,
    [templateKey],
  );
  const assignmentCardsLayoutStorageKey = useMemo(
    () =>
      `quote-payment-assignment-cards-layout:${templateKey || "draft-template"}`,
    [templateKey],
  );
  const [assignmentCardsLayout, setAssignmentCardsLayout] =
    useState<AssignmentCardsLayout>(() => {
      try {
        const stored = localStorage.getItem(
          `quote-payment-assignment-cards-layout:${templateKey || "draft-template"}`,
        );
        if (stored === "horizontal" || stored === "vertical") {
          return stored;
        }
      } catch {
        // no-op
      }
      return "horizontal";
    });
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 640px)").matches;
  });
  const [lastUsedSourceTab, setLastUsedSourceTab] =
    useState<AssignmentSourceTab>(() => {
    try {
      const stored = localStorage.getItem(
        `quote-payment-assignment-source:${templateKey || "draft-template"}`,
      );
      return stored === "quote-template" || stored === "all"
        ? stored
        : "stage-template";
    } catch {
      return "stage-template";
    }
  });
  const effectiveVat = step.useCustomVat ? (step.vatRate ?? defaultVatRate) : defaultVatRate;
  const selectedTemplateStage = useMemo(
    () => templateStages.find((s) => s.id === step.templateStageId) || null,
    [templateStages, step.templateStageId],
  );

  const templateTasks = selectedTemplateStage?.tasks || [];
  const selectedTemplateTask = useMemo(
    () => templateTasks.find((task) => task.id === step.templateTaskId) || null,
    [templateTasks, step.templateTaskId],
  );
  const quoteTemplateStageOptions = useMemo(
    () =>
      (quoteTemplateStages || []).map((stage) => ({
        id: stage.id,
        name: stage.name,
        tasks: (stage.items || [])
          .map((item) => ({ id: item.id, title: (item.text || "").trim() }))
          .filter((item) => item.title.length > 0),
      })),
    [quoteTemplateStages],
  );

  const selectedQuoteStage = useMemo(
    () =>
      quoteTemplateStageOptions.find(
        (stage) => stage.id === step.quoteTemplateStageId,
      ) || null,
    [quoteTemplateStageOptions, step.quoteTemplateStageId],
  );

  const selectedQuoteTask = useMemo(
    () =>
      selectedQuoteStage?.tasks.find(
        (task) => task.id === step.quoteTemplateItemId,
      ) || null,
    [selectedQuoteStage, step.quoteTemplateItemId],
  );

  useEffect(() => {
    if (activeStageTemplateTab === ASSIGNMENT_ALL_STAGE_FILTER) return;
    if (templateStages.some((stage) => stage.id === activeStageTemplateTab)) {
      return;
    }
    setActiveStageTemplateTab(ASSIGNMENT_ALL_STAGE_FILTER);
  }, [templateStages, activeStageTemplateTab]);

  useEffect(() => {
    if (activeQuoteTemplateTab === ASSIGNMENT_ALL_STAGE_FILTER) return;
    if (
      quoteTemplateStageOptions.some(
        (stage) => stage.id === activeQuoteTemplateTab,
      )
    ) {
      return;
    }
    setActiveQuoteTemplateTab(ASSIGNMENT_ALL_STAGE_FILTER);
  }, [quoteTemplateStageOptions, activeQuoteTemplateTab]);

  useEffect(() => {
    try {
      localStorage.setItem(assignmentViewStorageKey, assignmentViewMode);
      onPreferenceChange?.();
    } catch {
      // no-op
    }
  }, [assignmentViewMode, assignmentViewStorageKey, onPreferenceChange]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);
    updateViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewport);
      return () => mediaQuery.removeEventListener("change", updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        assignmentCardsLayoutStorageKey,
        assignmentCardsLayout,
      );
      onPreferenceChange?.();
    } catch {
      // no-op
    }
  }, [assignmentCardsLayout, assignmentCardsLayoutStorageKey, onPreferenceChange]);

  const effectiveCardsLayout: AssignmentCardsLayout = isMobileViewport
    ? "vertical"
    : assignmentCardsLayout;
  const assignmentTabTriggerClass =
    "h-9 shrink-0 rounded-lg border border-primary/30 bg-background px-3 text-xs font-medium text-foreground transition-colors data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:border-primary/50 hover:bg-primary/5";

  const assignmentSummary =
    step.linkSource === "quote_template" && (step.quoteTemplateItemText || selectedQuoteTask?.title)
      ? `שיוך תשלום: ${step.quoteTemplateStageName || selectedQuoteStage?.name || "שלב בתבנית ההצעה"} → ${step.quoteTemplateItemText || selectedQuoteTask?.title}`
      : step.templateTaskName
        ? `שיוך תשלום: ${step.templateStageName || "שלב"} → ${step.templateTaskName}`
        : templateName
          ? `לא נבחרה משימה (תבנית: ${templateName})`
          : "לא נבחרה תבנית שלבים בפרטי הפרויקט";

  const hasStageAssignment = !!(step.templateStageId || step.templateTaskId);
  const hasQuoteAssignment = !!(step.quoteTemplateStageId || step.quoteTemplateItemId);

  const assignmentSourceBadge = hasQuoteAssignment
    ? { label: "מקור: תבנית ההצעה", className: "text-blue-700 border-blue-300" }
    : hasStageAssignment
      ? { label: "מקור: תבנית שלבי לקוח", className: "text-amber-700 border-amber-300" }
      : null;

  const rememberSourceTab = useCallback(
    (sourceTab: AssignmentSourceTab) => {
      setLastUsedSourceTab(sourceTab);
      try {
        localStorage.setItem(assignmentSourceStorageKey, sourceTab);
        onPreferenceChange?.();
      } catch {
        // no-op
      }
    },
    [assignmentSourceStorageKey, onPreferenceChange],
  );

  const openAssignmentDialog = useCallback(() => {
    const preferredTab = hasQuoteAssignment
      ? "quote-template"
      : hasStageAssignment
        ? "stage-template"
        : lastUsedSourceTab;
    setIsExpanded(true);
    setAssignmentSourceTab(preferredTab);
    setAssignmentDialogOpen(true);
  }, [hasQuoteAssignment, hasStageAssignment, lastUsedSourceTab]);

  const activeStageTemplateForDialog = useMemo(
    () => {
      if (activeStageTemplateTab === ASSIGNMENT_ALL_STAGE_FILTER) {
        return null;
      }
      return (
        templateStages.find((stage) => stage.id === activeStageTemplateTab) ||
        null
      );
    },
    [templateStages, activeStageTemplateTab],
  );

  const activeQuoteTemplateStageForDialog = useMemo(
    () => {
      if (activeQuoteTemplateTab === ASSIGNMENT_ALL_STAGE_FILTER) {
        return null;
      }
      return (
        quoteTemplateStageOptions.find(
          (stage) => stage.id === activeQuoteTemplateTab,
        ) || null
      );
    },
    [quoteTemplateStageOptions, activeQuoteTemplateTab],
  );

  const stageTemplateFilterOptions = useMemo(
    () => [
      {
        id: ASSIGNMENT_ALL_STAGE_FILTER,
        name: "כל השלבים",
        taskCount: templateStages.reduce(
          (total, stage) => total + (stage.tasks?.length || 0),
          0,
        ),
      },
      ...templateStages.map((stage) => ({
        id: stage.id,
        name: stage.stage_name,
        taskCount: stage.tasks?.length || 0,
      })),
    ],
    [templateStages],
  );

  const quoteTemplateFilterOptions = useMemo(
    () => [
      {
        id: ASSIGNMENT_ALL_STAGE_FILTER,
        name: "כל השלבים",
        taskCount: quoteTemplateStageOptions.reduce(
          (total, stage) => total + (stage.tasks?.length || 0),
          0,
        ),
      },
      ...quoteTemplateStageOptions.map((stage) => ({
        id: stage.id,
        name: stage.name,
        taskCount: stage.tasks?.length || 0,
      })),
    ],
    [quoteTemplateStageOptions],
  );

  const normalizedAssignmentSearch = assignmentSearch.trim().toLowerCase();

  const stageTemplateTaskPool = useMemo(() => {
    if (
      activeStageTemplateTab === ASSIGNMENT_ALL_STAGE_FILTER ||
      !activeStageTemplateForDialog
    ) {
      return templateStages.flatMap((stage) =>
        (stage.tasks || []).map((task) => ({
          ...task,
          stageId: stage.id,
          stageName: stage.stage_name,
        })),
      );
    }

    return (activeStageTemplateForDialog.tasks || []).map((task) => ({
      ...task,
      stageId: activeStageTemplateForDialog.id,
      stageName: activeStageTemplateForDialog.stage_name,
    }));
  }, [templateStages, activeStageTemplateTab, activeStageTemplateForDialog]);

  const filteredStageTemplateTasks = useMemo(() => {
    if (!normalizedAssignmentSearch) return stageTemplateTaskPool;
    return stageTemplateTaskPool.filter((task) =>
      `${task.title} ${task.stageName}`
        .toLowerCase()
        .includes(normalizedAssignmentSearch),
    );
  }, [stageTemplateTaskPool, normalizedAssignmentSearch]);

  const quoteTemplateItemsPool = useMemo(() => {
    if (
      activeQuoteTemplateTab === ASSIGNMENT_ALL_STAGE_FILTER ||
      !activeQuoteTemplateStageForDialog
    ) {
      return quoteTemplateStageOptions.flatMap((stage) =>
        (stage.tasks || []).map((task) => ({
          ...task,
          stageId: stage.id,
          stageName: stage.name,
        })),
      );
    }

    return (activeQuoteTemplateStageForDialog.tasks || []).map((item) => ({
      ...item,
      stageId: activeQuoteTemplateStageForDialog.id,
      stageName: activeQuoteTemplateStageForDialog.name,
    }));
  }, [
    quoteTemplateStageOptions,
    activeQuoteTemplateTab,
    activeQuoteTemplateStageForDialog,
  ]);

  const filteredQuoteTemplateItems = useMemo(() => {
    if (!normalizedAssignmentSearch) return quoteTemplateItemsPool;
    return quoteTemplateItemsPool.filter((item) =>
      `${item.title} ${item.stageName}`
        .toLowerCase()
        .includes(normalizedAssignmentSearch),
    );
  }, [quoteTemplateItemsPool, normalizedAssignmentSearch]);

  const assignFromStageTemplate = (
    stage: StageTemplateStageOption,
    task: StageTemplateTaskOption,
  ) => {
    onUpdate({
      ...step,
      linkSource: "stage_template",
      templateStageId: stage.id,
      templateStageName: stage.stage_name,
      templateTaskId: task.id,
      templateTaskName: task.title,
      quoteTemplateStageId: "",
      quoteTemplateStageName: "",
      quoteTemplateItemId: "",
      quoteTemplateItemText: "",
    });
    rememberSourceTab("stage-template");
    setAssignmentDialogOpen(false);
  };

  const assignFromQuoteTemplate = (
    stage: { id: string; name: string },
    item: { id: string; title: string },
  ) => {
    onUpdate({
      ...step,
      linkSource: "quote_template",
      quoteTemplateStageId: stage.id,
      quoteTemplateStageName: stage.name,
      quoteTemplateItemId: item.id,
      quoteTemplateItemText: item.title,
      templateStageId: "",
      templateStageName: "",
      templateTaskId: "",
      templateTaskName: "",
      triggerMode: step.triggerMode === "task_completion" ? "task_completion" : step.triggerMode,
    });
    rememberSourceTab("quote-template");
    setAssignmentDialogOpen(false);
  };

  const renderStageFilters = (
    options: Array<{ id: string; name: string; taskCount: number }>,
    activeId: string,
    onSelect: (id: string) => void,
  ) => {
    if (assignmentViewMode === "chips") {
      return (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const Icon =
              option.id === ASSIGNMENT_ALL_STAGE_FILTER
                ? Search
                : getAssignmentStageIcon(option.name);
            const isActive = activeId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  onSelect(
                    isActive && option.id !== ASSIGNMENT_ALL_STAGE_FILTER
                      ? ASSIGNMENT_ALL_STAGE_FILTER
                      : option.id,
                  )
                }
                className={`inline-flex items-center gap-2 rounded-md border px-3 h-8 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent border-input"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{option.name}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (assignmentViewMode === "cards") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {options.map((option) => {
            const Icon =
              option.id === ASSIGNMENT_ALL_STAGE_FILTER
                ? Search
                : getAssignmentStageIcon(option.name);
            const isActive = activeId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  onSelect(
                    isActive && option.id !== ASSIGNMENT_ALL_STAGE_FILTER
                      ? ASSIGNMENT_ALL_STAGE_FILTER
                      : option.id,
                  )
                }
                className={`rounded-lg border px-3 py-2 text-right transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-input bg-background hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {option.taskCount}
                  </Badge>
                </div>
                <div className="mt-2 text-xs font-medium truncate">{option.name}</div>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {options.map((option) => {
          const Icon =
            option.id === ASSIGNMENT_ALL_STAGE_FILTER
              ? Search
              : getAssignmentStageIcon(option.name);
          const isActive = activeId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                onSelect(
                  isActive && option.id !== ASSIGNMENT_ALL_STAGE_FILTER
                    ? ASSIGNMENT_ALL_STAGE_FILTER
                    : option.id,
                )
              }
              className={`w-full rounded-md border px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "border-primary bg-primary/10"
                  : "border-input bg-background hover:bg-accent/50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{option.name}</span>
                </div>
                <Badge variant="outline" className="text-[10px] h-5">
                  {option.taskCount}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#DAA520]/10 text-[#B8860B] font-bold text-xs">
          {step.percentage}%
          {step.useCustomVat && effectiveVat !== defaultVatRate && (
            <span className="block text-[9px] text-orange-500">{effectiveVat}%</span>
          )}
        </div>
        <div className="flex-1">
          <Input
            value={step.name}
            onChange={(e) => onUpdate({ ...step, name: e.target.value })}
            className="font-medium border-0 p-0 h-auto focus-visible:ring-0"
            placeholder="שם שלב התשלום"
            dir="rtl"
          />
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-[11px] text-muted-foreground">
              {assignmentSummary}
            </p>
            {assignmentSourceBadge && (
              <Badge variant="outline" className={`text-[10px] ${assignmentSourceBadge.className}`}>
                {assignmentSourceBadge.label}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={Math.round((basePrice * (step.percentage || 0)) / 100)}
            onChange={(e) => {
              const amt = parseFloat(e.target.value) || 0;
              const pct = basePrice > 0
                ? Math.round((amt / basePrice) * 10000) / 100
                : 0;
              onUpdate({ ...step, percentage: pct });
            }}
            className="w-24 text-center"
            min={0}
            title="סכום בש״ח - עדכון דו-כיווני עם האחוז"
          />
          <span className="text-gray-500">₪</span>
          <Input
            type="number"
            value={step.percentage}
            onChange={(e) =>
              onUpdate({ ...step, percentage: parseFloat(e.target.value) || 0 })
            }
            className="w-16 text-center"
            min={0}
            max={100}
            step="0.01"
          />
          <span className="text-gray-500">%</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={openAssignmentDialog}
          >
            <Layers className="h-3 w-3 ml-1" />
            שיוך
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
        <div className="mt-3 pt-3 border-t space-y-3">
          <Textarea
            value={step.description}
            onChange={(e) => onUpdate({ ...step, description: e.target.value })}
            placeholder="תיאור שלב התשלום..."
            className="min-h-[60px]"
            dir="rtl"
          />

          <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/40 p-3 space-y-3">
            <p className="text-xs text-amber-800">
              שיוך פנימי בלבד: בחר משימה לקישור התשלום להתקדמות בפועל.
            </p>

            {templateStages.length === 0 && quoteTemplateStageOptions.length === 0 && (
              <div className="rounded-md border border-amber-200 bg-white p-2 text-xs text-amber-800">
                לא נמצאו מקורות שיוך. בחר תבנית שלבים בפרטי הפרויקט או הוסף שלבים בתוכן תבנית ההצעה.
              </div>
            )}

            {(templateStages.length > 0 || quoteTemplateStageOptions.length > 0) && (
              <div className="rounded-md border bg-white p-2 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-2 text-xs w-full justify-between"
                  onClick={openAssignmentDialog}
                >
                  <span>פתח בורר שיוך מהיר (דיאלוג)</span>
                  <Layers className="h-3.5 w-3.5" />
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div className="rounded border bg-muted/30 px-2 py-1.5">
                    תבנית שלבי לקוח: {templateStages.length} שלבים
                  </div>
                  <div className="rounded border bg-muted/30 px-2 py-1.5">
                    תבנית ההצעה: {quoteTemplateStageOptions.length} שלבים
                  </div>
                </div>
              </div>
            )}

            {step.linkSource === "stage_template" && selectedTemplateTask && (
              <div className="rounded-md border border-green-200 bg-green-50 px-2 py-1.5 text-xs text-green-800">
                משימה משויכת: {step.templateStageName || selectedTemplateStage?.stage_name} → {selectedTemplateTask.title}
              </div>
            )}

            {step.linkSource === "quote_template" && (step.quoteTemplateItemText || selectedQuoteTask?.title) && (
              <div className="rounded-md border border-green-200 bg-green-50 px-2 py-1.5 text-xs text-green-800">
                משימה משויכת מתבנית ההצעה: {step.quoteTemplateStageName || selectedQuoteStage?.name} → {step.quoteTemplateItemText || selectedQuoteTask?.title}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  טריגר דרישת תשלום
                </Label>
                <Select
                  value={step.triggerMode || "manual"}
                  onValueChange={(value: "manual" | "date" | "task_completion") =>
                    onUpdate({
                      ...step,
                      triggerMode: value,
                      triggerDate: value === "date" ? step.triggerDate || "" : null,
                    })
                  }
                >
                  <SelectTrigger className="h-8 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">ידני</SelectItem>
                    <SelectItem value="task_completion">סיום משימה משויכת</SelectItem>
                    <SelectItem value="date">תאריך יעד קבוע</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {step.triggerMode === "date" && (
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    תאריך יעד לתשלום
                  </Label>
                  <Input
                    type="date"
                    value={step.triggerDate || ""}
                    onChange={(e) => onUpdate({ ...step, triggerDate: e.target.value || null })}
                    className="h-8 bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-amber-50 rounded-lg p-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={step.useCustomVat || false}
                onChange={(e) => onUpdate({ ...step, useCustomVat: e.target.checked, vatRate: step.vatRate ?? defaultVatRate })}
                className="rounded"
              />
              <span>מע״מ שונה לשלב זה</span>
            </label>
            {step.useCustomVat && (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={step.vatRate ?? defaultVatRate}
                  onChange={(e) => onUpdate({ ...step, vatRate: parseFloat(e.target.value) || 0 })}
                  className="w-20 text-center h-8"
                  min={0}
                  max={100}
                  step={0.5}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent
          className="max-w-6xl"
          contentClassName="overflow-x-visible"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle>שיוך מהיר לשלב תשלום</DialogTitle>
          </DialogHeader>

          <Tabs
            value={assignmentSourceTab}
            onValueChange={(value) => {
              const sourceTab = value as AssignmentSourceTab;
              setAssignmentSourceTab(sourceTab);
              rememberSourceTab(sourceTab);
            }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              <TabsList className="grid grid-cols-3 w-full md:w-auto md:min-w-[460px] gap-2 bg-transparent h-auto p-0">
                <TabsTrigger value="stage-template" className={assignmentTabTriggerClass}>תבנית שלבי לקוח</TabsTrigger>
                <TabsTrigger value="quote-template" className={assignmentTabTriggerClass}>תבנית ההצעה</TabsTrigger>
                <TabsTrigger value="all" className={assignmentTabTriggerClass}>הכל</TabsTrigger>
              </TabsList>

              <div className="inline-flex items-center gap-1 rounded-md border bg-muted/30 p-1 self-start">
                <Button
                  type="button"
                  variant={assignmentViewMode === "chips" ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  title="תצוגת צ'יפים"
                  onClick={() => setAssignmentViewMode("chips")}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={assignmentViewMode === "cards" ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  title="תצוגת כרטיסים"
                  onClick={() => setAssignmentViewMode("cards")}
                >
                  <Columns className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={assignmentViewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  title="תצוגת רשימה"
                  onClick={() => setAssignmentViewMode("list")}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={effectiveCardsLayout === "vertical" ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  title={
                    isMobileViewport
                      ? "במובייל מוצגת תצוגה אנכית קבועה"
                      : effectiveCardsLayout === "horizontal"
                        ? "מעבר לתצוגה אנכית"
                        : "מעבר לתצוגה אופקית"
                  }
                  onClick={() =>
                    setAssignmentCardsLayout((prev) =>
                      prev === "horizontal" ? "vertical" : "horizontal",
                    )
                  }
                  disabled={isMobileViewport}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
                placeholder={
                  assignmentSourceTab === "all"
                    ? "חיפוש בכל הטאבים והמקורות..."
                    : "חיפוש משימה..."
                }
                className="pr-9"
              />
            </div>

            <TabsContent value="stage-template" className="space-y-3 m-0">
              {templateStages.length === 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  אין תבנית שלבי לקוח משויכת לפרויקט.
                </div>
              ) : (
                <>
                  {renderStageFilters(
                    stageTemplateFilterOptions,
                    activeStageTemplateTab,
                    setActiveStageTemplateTab,
                  )}

                  <ScrollArea className="h-56 rounded-md border p-2">
                    <div className="space-y-2">
                      {filteredStageTemplateTasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-1 py-2">
                          {activeStageTemplateTab === ASSIGNMENT_ALL_STAGE_FILTER
                            ? "לא נמצאו משימות בהתאם לחיפוש."
                            : "לא נמצאו משימות בשלב זה בהתאם לחיפוש."}
                        </p>
                      ) : (
                        filteredStageTemplateTasks.map((task) => {
                          const stage = templateStages.find(
                            (stageOption) => stageOption.id === task.stageId,
                          );
                          if (!stage) return null;
                          const isSelected =
                            step.linkSource === "stage_template" &&
                            step.templateTaskId === task.id;
                          const Icon = getAssignmentStageIcon(task.stageName);
                          return (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => assignFromStageTemplate(stage, task)}
                              className={`w-full text-right text-sm rounded border px-3 py-2 transition-colors ${
                                isSelected
                                  ? "border-amber-400 bg-amber-50 text-amber-900"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Icon className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{task.title}</span>
                                </div>
                                {activeStageTemplateTab ===
                                  ASSIGNMENT_ALL_STAGE_FILTER && (
                                  <Badge variant="outline" className="text-[10px] h-5">
                                    {task.stageName}
                                  </Badge>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TabsContent>

            <TabsContent value="quote-template" className="space-y-3 m-0">
              {quoteTemplateStageOptions.length === 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  אין שלבים זמינים בתוכן תבנית ההצעה.
                </div>
              ) : (
                <>
                  {renderStageFilters(
                    quoteTemplateFilterOptions,
                    activeQuoteTemplateTab,
                    setActiveQuoteTemplateTab,
                  )}

                  <ScrollArea className="h-56 rounded-md border p-2">
                    <div className="space-y-2">
                      {filteredQuoteTemplateItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-1 py-2">
                          {activeQuoteTemplateTab === ASSIGNMENT_ALL_STAGE_FILTER
                            ? "לא נמצאו סעיפים בהתאם לחיפוש."
                            : "לא נמצאו סעיפים בשלב זה בהתאם לחיפוש."}
                        </p>
                      ) : (
                        filteredQuoteTemplateItems.map((item) => {
                          const stage = quoteTemplateStageOptions.find(
                            (stageOption) => stageOption.id === item.stageId,
                          );
                          if (!stage) return null;
                          const isSelected =
                            step.linkSource === "quote_template" &&
                            step.quoteTemplateItemId === item.id;
                          const Icon = getAssignmentStageIcon(item.stageName);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => assignFromQuoteTemplate(stage, item)}
                              className={`w-full text-right text-sm rounded border px-3 py-2 transition-colors ${
                                isSelected
                                  ? "border-amber-400 bg-amber-50 text-amber-900"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Icon className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{item.title}</span>
                                </div>
                                {activeQuoteTemplateTab ===
                                  ASSIGNMENT_ALL_STAGE_FILTER && (
                                  <Badge variant="outline" className="text-[10px] h-5">
                                    {item.stageName}
                                  </Badge>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-3 m-0">
              {templateStages.length === 0 && quoteTemplateStageOptions.length === 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  אין מקורות זמינים לחיפוש רוחבי.
                </div>
              ) : (
                (() => {
                  // Build Kanban columns by source+stage id to avoid merging
                  // different stages that share the same display name.
                  type Col = {
                    key: string;
                    name: string;
                    source: "stage-template" | "quote-template";
                    stageItems: Array<{ stage: any; task: any }>;
                    quoteItems: Array<{ stage: any; item: any }>;
                  };
                  const columns = new Map<string, Col>();
                  const matchesSearch = (title: string, stageName: string) => {
                    if (!normalizedAssignmentSearch) return true;
                    return (
                      title.toLowerCase().includes(normalizedAssignmentSearch) ||
                      stageName.toLowerCase().includes(normalizedAssignmentSearch)
                    );
                  };
                  templateStages.forEach((stage: any) => {
                    const name = (stage.stage_name || "").trim();
                    if (!name) return;
                    const key = `stage-template:${stage.id || name}`;
                    if (!columns.has(key)) {
                      columns.set(key, {
                        key,
                        name,
                        source: "stage-template",
                        stageItems: [],
                        quoteItems: [],
                      });
                    }
                    (stage.tasks || []).forEach((task: any) => {
                      if (!matchesSearch(task.title || "", name)) return;
                      columns.get(key)!.stageItems.push({ stage, task });
                    });
                  });
                  quoteTemplateStageOptions.forEach((stage) => {
                    const name = (stage.name || "").trim();
                    if (!name) return;
                    const key = `quote-template:${stage.id || name}`;
                    if (!columns.has(key)) {
                      columns.set(key, {
                        key,
                        name,
                        source: "quote-template",
                        stageItems: [],
                        quoteItems: [],
                      });
                    }
                    (stage.tasks || []).forEach((item: any) => {
                      if (!matchesSearch(item.title || "", name)) return;
                      columns.get(key)!.quoteItems.push({ stage, item });
                    });
                  });
                  const visibleColumns = Array.from(columns.values()).filter(
                    (c) => c.stageItems.length > 0 || c.quoteItems.length > 0,
                  );
                  if (visibleColumns.length === 0) {
                    return (
                      <p className="text-xs text-muted-foreground px-1 py-6 text-center">
                        לא נמצאו תוצאות בחיפוש בכל המקורות.
                      </p>
                    );
                  }
                  const highlight = (text: string) => {
                    if (!normalizedAssignmentSearch) return text;
                    const idx = text.toLowerCase().indexOf(normalizedAssignmentSearch);
                    if (idx === -1) return text;
                    return (
                      <>
                        {text.slice(0, idx)}
                        <mark className="bg-[#d8ac27]/30 text-[#162C58] rounded px-0.5">
                          {text.slice(idx, idx + normalizedAssignmentSearch.length)}
                        </mark>
                        {text.slice(idx + normalizedAssignmentSearch.length)}
                      </>
                    );
                  };
                  return (
                    <div className="h-[480px] w-full max-w-full overflow-y-auto overflow-x-auto rounded-md border bg-muted/10">
                      <div
                        className={
                          effectiveCardsLayout === "horizontal"
                            ? "flex gap-3 p-3 min-w-max"
                            : "flex flex-col gap-3 p-3"
                        }
                      >
                        {visibleColumns.map((col) => {
                          const Icon = getAssignmentStageIcon(col.name);
                          const totalCount =
                            col.stageItems.length + col.quoteItems.length;
                          return (
                            <div
                              key={col.key}
                              className={
                                effectiveCardsLayout === "horizontal"
                                  ? "w-[260px] shrink-0 rounded-lg border bg-background flex flex-col shadow-sm"
                                  : "w-full rounded-lg border bg-background flex flex-col shadow-sm"
                              }
                              dir="rtl"
                            >
                              <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 border-b bg-[#162C58] text-white rounded-t-lg">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Icon className="h-4 w-4 shrink-0 text-[#d8ac27]" />
                                  <span className="truncate text-sm font-semibold">
                                    {col.name}
                                  </span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-5 border-[#d8ac27] text-[#d8ac27] bg-transparent"
                                >
                                  {totalCount}
                                </Badge>
                              </div>
                              <div className="p-2 space-y-3">
                                {col.stageItems.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-[10px] uppercase tracking-wide text-amber-700 font-semibold px-1">
                                      תבנית שלבים ({col.stageItems.length})
                                    </div>
                                    {col.stageItems.map(({ stage, task }) => {
                                      const isSelected =
                                        step.linkSource === "stage_template" &&
                                        step.templateTaskId === task.id;
                                      return (
                                        <button
                                          key={`k-stage-${task.id}`}
                                          type="button"
                                          onClick={() => {
                                            assignFromStageTemplate(stage, task);
                                            setAssignmentDialogOpen(false);
                                          }}
                                          className={`w-full text-right text-xs rounded border px-2 py-1.5 transition-colors flex items-start gap-2 ${
                                            isSelected
                                              ? "border-amber-400 bg-amber-50 text-amber-900"
                                              : "border-amber-200/60 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300"
                                          }`}
                                        >
                                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                          <span className="flex-1 leading-snug">
                                            {highlight(task.title)}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                                {col.quoteItems.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-[10px] uppercase tracking-wide text-blue-700 font-semibold px-1">
                                      תבנית ההצעה ({col.quoteItems.length})
                                    </div>
                                    {col.quoteItems.map(({ stage, item }) => {
                                      const isSelected =
                                        step.linkSource === "quote_template" &&
                                        step.quoteTemplateItemId === item.id;
                                      return (
                                        <button
                                          key={`k-quote-${item.id}`}
                                          type="button"
                                          onClick={() => {
                                            assignFromQuoteTemplate(stage, item);
                                            setAssignmentDialogOpen(false);
                                          }}
                                          className={`w-full text-right text-xs rounded border px-2 py-1.5 transition-colors flex items-start gap-2 ${
                                            isSelected
                                              ? "border-amber-400 bg-amber-50 text-amber-900"
                                              : "border-blue-200/60 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300"
                                          }`}
                                        >
                                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                                          <span className="flex-1 leading-snug">
                                            {highlight(item.title)}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
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
  onSaveAsTemplate,
  customColors,
  onAddCustomColor,
  onRemoveCustomColor,
  onEditCustomColor,
  dragHandleProps,
  isSelected,
  onToggleSelect,
}: {
  textBox: TextBox;
  onUpdate: (textBox: TextBox) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onSaveAsTemplate?: () => void;
  customColors?: string[];
  onAddCustomColor?: (color: string) => void;
  onRemoveCustomColor?: (color: string) => void;
  onEditCustomColor?: (oldColor: string, newColor: string) => void;
  dragHandleProps?: any;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showColorSettings, setShowColorSettings] = useState(false);
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
  const [activeCustomColor, setActiveCustomColor] = useState<string | null>(null);

  return (
    <div
      className={`rounded-lg border-2 p-3 ${isSelected ? "border-blue-400 bg-blue-50/50" : styleColors[textBox.style]} transition-all hover:shadow-md`}
      style={{
        backgroundColor: isSelected ? undefined : (textBox.customBg || undefined),
        borderColor: isSelected ? undefined : (textBox.customBorder || undefined),
        borderWidth: isSelected ? undefined : (textBox.borderWidth !== undefined ? `${textBox.borderWidth}px` : undefined),
      }}
    >
      {/* Top bar: drag handle + checkbox + title + controls */}
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <div
          {...(dragHandleProps || {})}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-black/5 touch-none"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        {/* Multi-select checkbox */}
        {onToggleSelect && (
          <button
            onClick={onToggleSelect}
            className={`w-4 h-4 rounded border-2 flex-shrink-0 transition-colors ${isSelected ? "bg-[#DAA520] border-[#DAA520]" : "border-gray-300"}`}
            title="בחר תיבה"
          >
            {isSelected && <span className="text-white text-[9px] flex items-center justify-center w-full h-full leading-none">✓</span>}
          </button>
        )}

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
          {onSaveAsTemplate && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-[#B8860B] hover:text-[#B8860B]"
              onClick={onSaveAsTemplate}
              title="שמור כתבנית לשימוש חוזר"
            >
              <Star className="h-3 w-3" />
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
              {/* Saved custom colors row */}
              {customColors && customColors.length > 0 && (
                <div className="pb-1.5 border-b space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16 text-[#B8860B] font-medium">שמורים:</Label>
                    <div className="flex gap-1 flex-wrap flex-1">
                      {!showColorSettings ? (
                        customColors.map((c) => (
                          <div key={c} className="relative group">
                            <button
                              className={`w-5 h-5 rounded border-2 hover:scale-110 transition-transform ${activeCustomColor === c ? "border-[#B8860B] scale-110 shadow" : "border-transparent hover:border-gray-400"}`}
                              style={{ backgroundColor: c, outline: activeCustomColor === c ? "2px solid #B8860B" : undefined, outlineOffset: "1px" }}
                              title="בחר צבע"
                              onClick={() => setActiveCustomColor(activeCustomColor === c ? null : c)}
                            />
                          </div>
                        ))
                      ) : (
                        /* Edit mode: each saved color shows a color input + delete */
                        customColors.map((c) => (
                          <div key={c} className="flex items-center gap-0.5">
                            <Input
                              type="color"
                              value={c}
                              onChange={(e) => onEditCustomColor && onEditCustomColor(c, e.target.value)}
                              className="w-7 h-6 p-0.5 border rounded cursor-pointer"
                              title="שנה צבע"
                            />
                            <button
                              className="w-4 h-4 bg-red-100 hover:bg-red-500 text-red-500 hover:text-white rounded text-[9px] flex items-center justify-center transition-colors"
                              onClick={() => { onRemoveCustomColor && onRemoveCustomColor(c); if (activeCustomColor === c) setActiveCustomColor(null); }}
                              title="מחק"
                            >×</button>
                          </div>
                        ))
                      )}
                    </div>
                    <button
                      className={`flex-shrink-0 p-0.5 rounded transition-colors ${showColorSettings ? "text-[#B8860B] bg-[#FFF8E1]" : "text-gray-400 hover:text-[#B8860B]"}`}
                      onClick={() => { setShowColorSettings(!showColorSettings); setActiveCustomColor(null); }}
                      title="ערוך צבעים שמורים"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {/* Apply target selector — appears when a saved color is selected (normal mode only) */}
                  {activeCustomColor && !showColorSettings && (
                    <div className="flex items-center gap-2 mr-16 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="w-4 h-4 rounded border flex-shrink-0" style={{ backgroundColor: activeCustomColor }} />
                      <span className="text-xs text-gray-500">החל על:</span>
                      {[
                        { label: "רקע", apply: () => onUpdate({ ...textBox, customBg: activeCustomColor }) },
                        { label: "מסגרת", apply: () => onUpdate({ ...textBox, customBorder: activeCustomColor }) },
                        { label: "טקסט", apply: () => onUpdate({ ...textBox, customTextColor: activeCustomColor }) },
                      ].map(({ label, apply }) => (
                        <button
                          key={label}
                          className="text-xs px-2 py-0.5 rounded bg-[#FFF8E1] border border-[#DAA520]/50 hover:bg-[#DAA520]/20 text-[#7A5C00] transition-colors"
                          onClick={() => { apply(); setActiveCustomColor(null); }}
                        >
                          {label}
                        </button>
                      ))}
                      <button
                        className="text-xs text-gray-400 hover:text-gray-600 mr-auto"
                        onClick={() => setActiveCustomColor(null)}
                      >ביטול</button>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Label className="text-xs w-16">רקע:</Label>
                <div className="flex gap-1 flex-wrap">
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
                  {onAddCustomColor && (
                    <button
                      className="w-5 h-5 rounded border border-dashed border-[#DAA520] text-[#B8860B] hover:bg-[#FFF8E1] text-[10px] flex items-center justify-center transition-colors"
                      title="שמור צבע לפלטה"
                      onClick={() => onAddCustomColor(textBox.customBg || "#ffffff")}
                    >+</button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs w-16">מסגרת:</Label>
                <div className="flex gap-1 flex-wrap">
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
                  {onAddCustomColor && (
                    <button
                      className="w-5 h-5 rounded border border-dashed border-[#DAA520] text-[#B8860B] hover:bg-[#FFF8E1] text-[10px] flex items-center justify-center transition-colors"
                      title="שמור צבע לפלטה"
                      onClick={() => onAddCustomColor(textBox.customBorder || "#e5e7eb")}
                    >+</button>
                  )}
                </div>
              </div>
              {/* Border width */}
              <div className="flex items-center gap-2">
                <Label className="text-xs w-16">עובי:</Label>
                <div className="flex items-center gap-2 flex-1">
                  <Slider
                    value={[textBox.borderWidth ?? 2]}
                    min={0}
                    max={8}
                    step={1}
                    onValueChange={([v]) => onUpdate({ ...textBox, borderWidth: v })}
                    className="w-28"
                  />
                  <span className="text-xs text-gray-500 w-8">{textBox.borderWidth ?? 2}px</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs w-16">טקסט:</Label>
                <div className="flex gap-1 flex-wrap">
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
                  {onAddCustomColor && (
                    <button
                      className="w-5 h-5 rounded border border-dashed border-[#DAA520] text-[#B8860B] hover:bg-[#FFF8E1] text-[10px] flex items-center justify-center transition-colors"
                      title="שמור צבע לפלטה"
                      onClick={() => onAddCustomColor(textBox.customTextColor || "#000000")}
                    >+</button>
                  )}
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
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <Label className="text-xs" title="מרווח בין שורות">↕</Label>
            <div className="flex items-center gap-0.5">
              <button
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-xs font-bold"
                onClick={() => onUpdate({ ...textBox, lineHeight: Math.max(0.8, +((textBox.lineHeight ?? 1.6) - 0.1).toFixed(1)) })}
              >−</button>
              <span className="text-xs w-8 text-center tabular-nums">{(textBox.lineHeight ?? 1.6).toFixed(1)}</span>
              <button
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-xs font-bold"
                onClick={() => onUpdate({ ...textBox, lineHeight: Math.min(4, +((textBox.lineHeight ?? 1.6) + 0.1).toFixed(1)) })}
              >+</button>
            </div>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <Label className="text-xs" title="מרווח בין אותיות">AV</Label>
            <div className="flex items-center gap-0.5">
              <button
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-xs font-bold"
                onClick={() => onUpdate({ ...textBox, letterSpacing: Math.max(-3, +((textBox.letterSpacing ?? 0) - 0.5).toFixed(1)) })}
              >−</button>
              <span className="text-xs w-6 text-center tabular-nums">{(textBox.letterSpacing ?? 0)}</span>
              <button
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-xs font-bold"
                onClick={() => onUpdate({ ...textBox, letterSpacing: Math.min(15, +((textBox.letterSpacing ?? 0) + 0.5).toFixed(1)) })}
              >+</button>
            </div>
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
              lineHeight: textBox.lineHeight ? String(textBox.lineHeight) : undefined,
              letterSpacing: textBox.letterSpacing ? `${textBox.letterSpacing}px` : undefined,
              whiteSpace: "pre-wrap",
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
  onSaveAsTemplate,
  customColors,
  onAddCustomColor,
  onRemoveCustomColor,
  onEditCustomColor,
  isSelected,
  onToggleSelect,
}: {
  textBox: TextBox;
  onUpdate: (textBox: TextBox) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSaveAsTemplate?: () => void;
  customColors?: string[];
  onAddCustomColor?: (color: string) => void;
  onRemoveCustomColor?: (color: string) => void;
  onEditCustomColor?: (oldColor: string, newColor: string) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
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
        onSaveAsTemplate={onSaveAsTemplate}
        customColors={customColors}
        onAddCustomColor={onAddCustomColor}
        onRemoveCustomColor={onRemoveCustomColor}
        onEditCustomColor={onEditCustomColor}
        dragHandleProps={listeners}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
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
  const { saveToCloud } = useCloudPreferences();
  const [editedTemplate, setEditedTemplate] = useState<QuoteTemplate>(template);
  const [editingStagesTitle, setEditingStagesTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("מתקדם");
  const [activeTab, setActiveTab] = useState("project");
  const [logoStripMode, setLogoStripMode] = useState<"logo" | "maker">(
    "logo",
  );
  const [showEmbeddedVectorEditor, setShowEmbeddedVectorEditor] =
    useState(false);
  const [paymentSteps, setPaymentSteps] = useState<PaymentStep[]>(() => {
    const saved = template.payment_schedule;
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved.map((s: any) => ({
        id: s.id || Date.now().toString(),
        name: s.description || s.name || "",
        percentage: s.percentage || 0,
        description: s.description || "",
        vatRate: s.vatRate,
        useCustomVat: s.useCustomVat || false,
        linkSource:
          s.linkSource || (s.quoteTemplateItemId ? "quote_template" : "stage_template"),
        templateStageId: s.templateStageId || "",
        templateStageName: s.templateStageName || "",
        templateTaskId: s.templateTaskId || "",
        templateTaskName: s.templateTaskName || "",
        quoteTemplateStageId: s.quoteTemplateStageId || "",
        quoteTemplateStageName: s.quoteTemplateStageName || "",
        quoteTemplateItemId: s.quoteTemplateItemId || "",
        quoteTemplateItemText: s.quoteTemplateItemText || "",
        triggerMode: s.triggerMode || "manual",
        triggerDate: s.triggerDate || null,
      }));
    }
    return [
      { id: "1", name: "מקדמה בחתימה", percentage: 30, description: "" },
      { id: "2", name: "הגשה לרישוי", percentage: 25, description: "" },
      { id: "3", name: 'אישור תב"ע', percentage: 25, description: "" },
      { id: "4", name: "היתר בנייה", percentage: 20, description: "" },
    ].map((step) => ({ ...step, triggerMode: "manual" as const, triggerDate: null }));
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
  const [selectedTextBoxIds, setSelectedTextBoxIds] = useState<Set<string>>(new Set());
  const toggleTextBoxSelect = (id: string) => {
    setSelectedTextBoxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const deleteSelectedTextBoxes = () => {
    setTextBoxes((prev) => prev.filter((tb) => !selectedTextBoxIds.has(tb.id)));
    setSelectedTextBoxIds(new Set());
  };
  const applyFontToSelectedTextBoxes = (font: string) => {
    setTextBoxes((prev) => prev.map((tb) => selectedTextBoxIds.has(tb.id) ? { ...tb, fontFamily: font } : tb));
  };

  const [customTextBoxTemplates, setCustomTextBoxTemplates] = useState<CustomTextBoxTemplate[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_TEMPLATES_LS_KEY);
      if (raw) return JSON.parse(raw) as CustomTextBoxTemplate[];
    } catch {}
    return [];
  });
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_TEMPLATES_LS_KEY, JSON.stringify(customTextBoxTemplates));
    } catch {}
  }, [customTextBoxTemplates]);
  const saveTextBoxAsTemplate = useCallback((textBox: TextBox) => {
    const label = textBox.title?.trim() || textBox.content?.trim().slice(0, 20) || "תבנית";
    const newTpl: CustomTextBoxTemplate = {
      id: Date.now().toString(),
      label,
      title: textBox.title,
      content: textBox.content,
      position: textBox.position,
      style: textBox.style,
      customBg: textBox.customBg,
      customBorder: textBox.customBorder,
      createdAt: new Date().toISOString(),
    };
    setCustomTextBoxTemplates((prev) => [newTpl, ...prev]);
    toast({ title: "נשמר כתבנית", description: `"${label}" נוספה לתבניות המוכנות` });
  }, [toast]);
  const deleteCustomTemplate = useCallback((id: string) => {
    setCustomTextBoxTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const [customColors, setCustomColors] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_COLORS_LS_KEY);
      if (raw) return JSON.parse(raw) as string[];
    } catch {}
    return [];
  });
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_COLORS_LS_KEY, JSON.stringify(customColors));
    } catch {}
  }, [customColors]);
  const addCustomColor = useCallback((color: string) => {
    if (!color) return;
    setCustomColors((prev) => prev.includes(color) ? prev : [color, ...prev].slice(0, 16));
  }, []);
  const removeCustomColor = useCallback((color: string) => {
    setCustomColors((prev) => prev.filter((c) => c !== color));
  }, []);
  const editCustomColor = useCallback((oldColor: string, newColor: string) => {
    setCustomColors((prev) => prev.map((c) => c === oldColor ? newColor : c));
  }, []);
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
    if (saved && typeof saved === 'object' && (saved.clientName || saved.clientId || saved.gush || saved.helka || saved.address || saved.projectType || saved.stageTemplateId)) {
      return {
        clientId: saved.clientId || "",
        clientName: saved.clientName || "",
        gush: saved.gush || "",
        helka: saved.helka || "",
        migrash: saved.migrash || "",
        taba: saved.taba || "",
        address: saved.address || "",
        projectType: saved.projectType || "",
        stageTemplateId: saved.stageTemplateId || "",
        stageTemplateName: saved.stageTemplateName || "",
      };
    }
    return {
      clientId: "",
      clientName: "",
      gush: "",
      helka: "",
      migrash: "",
      taba: "",
      address: "",
      projectType: "",
      stageTemplateId: "",
      stageTemplateName: "",
    };
  });
  const [stageTemplates, setStageTemplates] = useState<StageTemplateOption[]>([]);
  const [isLoadingStageTemplates, setIsLoadingStageTemplates] = useState(false);
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

  // === Autosave (טיוטה אוטומטית: localStorage מיידי + ענן כל 2 שניות) ===
  const draftKey = template.id || `new::${template.name || "draft"}`;
  const draftSnapshot = useMemo(
    () => ({
      editedTemplate,
      paymentSteps,
      designSettings,
      textBoxes,
      upgrades,
      pricingTiers,
      projectDetails,
      selectedTier,
    }),
    [
      editedTemplate,
      paymentSteps,
      designSettings,
      textBoxes,
      upgrades,
      pricingTiers,
      projectDetails,
      selectedTier,
    ],
  );
  const {
    status: autosaveStatus,
    lastSavedAt: autosaveLastSavedAt,
    loadLocalDraft,
    loadCloudDraft,
    clearDraft,
  } = useQuoteDraftAutosave({
    key: draftKey,
    snapshot: draftSnapshot,
    enabled: open,
  });

  // שחזור אוטומטי בפתיחה - LS מיידי, ענן אם חדש יותר
  const restoredRef = useRef(false);
  useEffect(() => {
    if (!open) {
      restoredRef.current = false;
      return;
    }
    if (restoredRef.current) return;
    restoredRef.current = true;

    const applyDraft = (data: any, source: "local" | "cloud") => {
      if (!data || typeof data !== "object") return;
      try {
        if (data.editedTemplate) setEditedTemplate(data.editedTemplate);
        if (Array.isArray(data.paymentSteps)) setPaymentSteps(data.paymentSteps);
        if (data.designSettings) setDesignSettings(data.designSettings);
        if (Array.isArray(data.textBoxes)) setTextBoxes(data.textBoxes);
        if (Array.isArray(data.upgrades)) setUpgrades(data.upgrades);
        if (Array.isArray(data.pricingTiers)) setPricingTiers(data.pricingTiers);
        if (data.projectDetails) setProjectDetails(data.projectDetails);
        if (typeof data.selectedTier === "string") setSelectedTier(data.selectedTier);
        toast({
          title: source === "cloud" ? "טיוטה שוחזרה מהענן" : "טיוטה שוחזרה",
          description: "הצעת המחיר שוחזרה למצב שבו עזבת אותה",
        });
      } catch (err) {
        console.warn("Could not restore quote draft:", err);
      }
    };

    const local = loadLocalDraft();
    if (local) applyDraft(local, "local");

    // Cloud restore - אם יש בענן ושונה ממה ששוחזר מקומי
    (async () => {
      const cloud = await loadCloudDraft();
      if (cloud && JSON.stringify(cloud) !== JSON.stringify(local)) {
        applyDraft(cloud, "cloud");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);


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
  const embeddedVectorEditorFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Backward compatibility if an old state still points to the removed tab id.
    if (activeTab === "strip-maker") {
      setActiveTab("logo-strip");
      setLogoStripMode("maker");
    }
  }, [activeTab]);

  useEffect(() => {
    const handleVectorEditorApply = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const payload = event.data as {
        type?: string;
        dataUrl?: string;
        svgXml?: string;
      };

      if (!payload || payload.type !== "vector-logo-strip:apply") return;

      const incomingLogoUrl =
        typeof payload.dataUrl === "string" && payload.dataUrl.startsWith("data:image/svg+xml")
          ? payload.dataUrl
          : typeof payload.svgXml === "string"
            ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(payload.svgXml)}`
            : "";

      if (!incomingLogoUrl) return;

      setDesignSettings((prev) => ({
        ...prev,
        logoUrl: incomingLogoUrl,
        logoPosition: "custom-strip",
        showLogo: true,
        stripProcessed: false,
        stripLayers: undefined,
        originalLogoUrl: prev.originalLogoUrl || prev.logoUrl || incomingLogoUrl,
      }));

      setStripSourceImage(incomingLogoUrl);
      setActiveTab("logo-strip");
      setLogoStripMode("logo");

      const img = new window.Image();
      img.onload = () => {
        setStripSourceDimensions({
          w: img.width,
          h: img.height,
        });
      };
      img.src = incomingLogoUrl;

      toast({
        title: "לוגו עודכן מהעורך הווקטורי",
        description: "העיצוב הוחל על הסטריפ בהצעה",
      });
    };

    window.addEventListener("message", handleVectorEditorApply);
    return () => window.removeEventListener("message", handleVectorEditorApply);
  }, [toast]);

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
        const pageSize = 1000;
        let from = 0;
        const allRows: any[] = [];

        while (true) {
          const { data, error } = await supabase
            .from("clients")
            .select("id, name, email, phone, gush, helka, migrash, taba, address")
            .order("name")
            .range(from, from + pageSize - 1);

          if (error) {
            console.error("Error fetching clients:", error);
            return;
          }

          if (!data || data.length === 0) break;
          allRows.push(...data);

          if (data.length < pageSize) break;
          from += pageSize;
        }

        console.log("Fetched clients:", allRows.length);
        setExtendedClients(allRows);
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
        source: c.source || null,
        notes: c.notes || null,
      }));
    return [];
  }, [extendedClients, clients]);

  useEffect(() => {
    if (!open) return;

    const loadStageTemplates = async () => {
      setIsLoadingStageTemplates(true);
      try {
        const [templatesRes, stagesRes, tasksRes] = await Promise.all([
          (supabase as any)
            .from("stage_templates")
            .select("id, name, description")
            .order("name", { ascending: true }),
          (supabase as any)
            .from("stage_template_stages")
            .select("id, template_id, stage_name, sort_order")
            .order("sort_order", { ascending: true }),
          (supabase as any)
            .from("stage_template_tasks")
            .select("id, template_id, template_stage_id, title, sort_order")
            .order("sort_order", { ascending: true }),
        ]);

        if (templatesRes.error) throw templatesRes.error;
        if (stagesRes.error) throw stagesRes.error;
        if (tasksRes.error) throw tasksRes.error;

        const stagesByTemplate = new Map<string, any[]>();
        for (const stage of stagesRes.data || []) {
          const list = stagesByTemplate.get(stage.template_id) || [];
          list.push(stage);
          stagesByTemplate.set(stage.template_id, list);
        }

        const tasksByStage = new Map<string, any[]>();
        for (const task of tasksRes.data || []) {
          const key = task.template_stage_id || "";
          const list = tasksByStage.get(key) || [];
          list.push(task);
          tasksByStage.set(key, list);
        }

        const mappedTemplates: StageTemplateOption[] = (templatesRes.data || []).map((tpl: any) => {
          const stageList = (stagesByTemplate.get(tpl.id) || [])
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .map((stage) => ({
              id: stage.id,
              stage_name: stage.stage_name,
              sort_order: stage.sort_order || 0,
              tasks: (tasksByStage.get(stage.id) || [])
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                .map((task) => ({
                  id: task.id,
                  title: task.title,
                  template_stage_id: task.template_stage_id,
                })),
            }));

          return {
            id: tpl.id,
            name: tpl.name,
            description: tpl.description,
            stages: stageList,
          };
        });

        setStageTemplates(mappedTemplates);
      } catch (error) {
        console.error("Failed loading stage templates:", error);
      } finally {
        setIsLoadingStageTemplates(false);
      }
    };

    loadStageTemplates();
  }, [open]);

  const selectedStageTemplate = useMemo(
    () => stageTemplates.find((t) => t.id === projectDetails.stageTemplateId) || null,
    [stageTemplates, projectDetails.stageTemplateId],
  );

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
          vatRate: s.vatRate,
          useCustomVat: s.useCustomVat || false,
          linkSource:
            s.linkSource || (s.quoteTemplateItemId ? "quote_template" : "stage_template"),
          templateStageId: s.templateStageId || "",
          templateStageName: s.templateStageName || "",
          templateTaskId: s.templateTaskId || "",
          templateTaskName: s.templateTaskName || "",
          quoteTemplateStageId: s.quoteTemplateStageId || "",
          quoteTemplateStageName: s.quoteTemplateStageName || "",
          quoteTemplateItemId: s.quoteTemplateItemId || "",
          quoteTemplateItemText: s.quoteTemplateItemText || "",
          triggerMode: s.triggerMode || "manual",
          triggerDate: s.triggerDate || null,
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
    if (pd && typeof pd === 'object' && (pd.clientName || pd.clientId || pd.gush || pd.helka || pd.address || pd.projectType || pd.stageTemplateId)) {
      setProjectDetails({
        clientId: pd.clientId || "",
        clientName: pd.clientName || "",
        gush: pd.gush || "",
        helka: pd.helka || "",
        migrash: pd.migrash || "",
        taba: pd.taba || "",
        address: pd.address || "",
        projectType: pd.projectType || "",
        stageTemplateId: pd.stageTemplateId || "",
        stageTemplateName: pd.stageTemplateName || "",
      });
    }
  }, [template]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      let resolvedProjectDetails: any = { ...projectDetails };

      const normalizeClientName = (value: string) =>
        value.trim().replace(/\s+/g, " ").toLowerCase();

      // Auto-link existing client or create a new quote-lead client when user typed a name manually.
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const typedName = (resolvedProjectDetails.clientName || "").trim();
        if (user && typedName && !resolvedProjectDetails.clientId) {
          const localExisting = allClients.find(
            (c: any) =>
              normalizeClientName(c?.name || "") ===
              normalizeClientName(typedName),
          );

          if (localExisting?.id) {
            resolvedProjectDetails = {
              ...resolvedProjectDetails,
              clientId: localExisting.id,
              clientName: localExisting.name || typedName,
            };
          } else {
            const quoteLeadNote = `סטטוס ליד: הצעת מחיר (טרם נסגר)\nנוצר אוטומטית מהצעת מחיר: ${editedTemplate.name || "הצעת מחיר"}\nסוג פרויקט: ${resolvedProjectDetails.projectType || "לא צוין"}`;

            const { data: newClient, error: createError } = await (
              supabase as any
            )
              .from("clients")
              .insert({
                name: typedName,
                gush: resolvedProjectDetails.gush || null,
                helka: resolvedProjectDetails.helka || null,
                migrash: resolvedProjectDetails.migrash || null,
                taba: resolvedProjectDetails.taba || null,
                address: resolvedProjectDetails.address || null,
                phone: resolvedProjectDetails.phone || null,
                email: resolvedProjectDetails.email || null,
                user_id: user.id,
                created_by: user.id,
                source: "הצעת מחיר",
                status: "active",
                notes: quoteLeadNote,
              })
              .select("id, name")
              .single();

            if (createError) throw createError;

            resolvedProjectDetails = {
              ...resolvedProjectDetails,
              clientId: newClient.id,
              clientName: newClient.name || typedName,
            };

            toast({
              title: "ליד חדש נשמר מההצעה",
              description: `${resolvedProjectDetails.clientName} סומן כ"הצעת מחיר"`,
            });
          }

          if (
            resolvedProjectDetails.clientId !== projectDetails.clientId ||
            resolvedProjectDetails.clientName !== projectDetails.clientName
          ) {
            setProjectDetails((prev: any) => ({
              ...prev,
              clientId: resolvedProjectDetails.clientId,
              clientName: resolvedProjectDetails.clientName,
            }));
          }
        }
      } catch (linkErr) {
        console.warn("Could not auto-link client on save:", linkErr);
      }

      const templatePayload = {
        ...editedTemplate,
        payment_schedule: paymentSteps.map((s) => ({
          id: s.id,
          percentage: s.percentage,
          description: s.description || s.name,
          vatRate: s.vatRate,
          useCustomVat: s.useCustomVat,
          linkSource: s.linkSource || "stage_template",
          templateStageId: s.templateStageId || null,
          templateStageName: s.templateStageName || null,
          templateTaskId: s.templateTaskId || null,
          templateTaskName: s.templateTaskName || null,
          quoteTemplateStageId: s.quoteTemplateStageId || null,
          quoteTemplateStageName: s.quoteTemplateStageName || null,
          quoteTemplateItemId: s.quoteTemplateItemId || null,
          quoteTemplateItemText: s.quoteTemplateItemText || null,
          triggerMode: s.triggerMode || "manual",
          triggerDate: s.triggerDate || null,
        })),
        design_settings: designSettings as any,
        text_boxes: textBoxes,
        upgrades: upgrades,
        project_details: resolvedProjectDetails,
        base_price: editedTemplate.base_price || 0,
        pricing_tiers: pricingTiers,
      };

      // 1. Save template as before
      await onSave(templatePayload as any);

      // 2. Also save to saved_quotes table
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          let previousTemplateId: string | null = null;
          if (resolvedProjectDetails.clientId) {
            const { data: latestClientQuote } = await (supabase as any)
              .from("saved_quotes")
              .select("project_details, updated_at")
              .eq("client_id", resolvedProjectDetails.clientId)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            const latestProjectDetails =
              latestClientQuote?.project_details &&
              typeof latestClientQuote.project_details === "object"
                ? latestClientQuote.project_details
                : null;

            previousTemplateId =
              latestProjectDetails?.stageTemplateId ||
              latestProjectDetails?.stage_template_id ||
              null;
          }

          const basePrice = editedTemplate.base_price || 0;
          const vatRate = editedTemplate.vat_rate || 17;
          const totalWithVat = Math.round(basePrice * (1 + vatRate / 100));

          const savedQuoteData = {
            user_id: user.id,
            client_id: resolvedProjectDetails.clientId || null,
            template_id: editedTemplate.id || null,
            title: editedTemplate.name || "הצעת מחיר",
            description: editedTemplate.description || "",
            status: "draft",
            base_price: basePrice,
            vat_rate: vatRate,
            total_with_vat: totalWithVat,
            template_data: templatePayload as any,
            project_details: resolvedProjectDetails as any,
            payment_schedule: templatePayload.payment_schedule as any,
            design_settings: designSettings as any,
            text_boxes: textBoxes as any,
            upgrades: upgrades as any,
            pricing_tiers: pricingTiers as any,
            notes: editedTemplate.notes || "",
          };

          // Check if already saved (by template_id + user)
          const { data: existing } = await (supabase as any)
            .from("saved_quotes")
            .select("id")
            .eq("user_id", user.id)
            .eq("template_id", editedTemplate.id)
            .maybeSingle();

          if (existing?.id) {
            await (supabase as any)
              .from("saved_quotes")
              .update(savedQuoteData)
              .eq("id", existing.id);
          } else {
            await (supabase as any)
              .from("saved_quotes")
              .insert(savedQuoteData);
          }

          if (
            resolvedProjectDetails.clientId &&
            resolvedProjectDetails.stageTemplateId
          ) {
            try {
              const syncResult = await syncClientStagesFromTemplate({
                clientId: resolvedProjectDetails.clientId,
                templateId: resolvedProjectDetails.stageTemplateId,
                previousTemplateId,
                clearAllOnTemplateChange: true,
              });

              if (
                syncResult.clearedAll ||
                syncResult.addedStages > 0 ||
                syncResult.addedTasks > 0
              ) {
                toast({
                  title: "עודכן כרטיס הלקוח",
                  description: syncResult.clearedAll
                    ? `הוחלפה תבנית: בוצע איפוס ונוספו ${syncResult.addedStages} שלבים ו-${syncResult.addedTasks} משימות`
                    : `נוספו ${syncResult.addedStages} שלבים ו-${syncResult.addedTasks} משימות מהתבנית המשויכת`,
                });
              }
            } catch (syncError) {
              console.error("Could not sync client stages from quote save:", syncError);
            }
          }
        }
      } catch (sqErr) {
        console.warn("Could not save to saved_quotes:", sqErr);
      }

      toast({ title: "נשמר בהצלחה ☁️", description: "ההצעה נשמרה בתבנית ובהצעות השמורות" });
      // ניקוי טיוטת autosave אחרי שמירה מפורשת מוצלחת
      try { await clearDraft(); } catch { /* no-op */ }
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
    allClients,
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
          const tbLineHeight = tb.lineHeight ? `line-height: ${tb.lineHeight};` : "";
          const tbLetterSpacing = tb.letterSpacing ? `letter-spacing: ${tb.letterSpacing}px;` : "";
          const borderW = tb.borderWidth ?? 2;
          return `<div style="margin: 15px 0; padding: 15px; background: ${bgColor}; border: ${borderW}px solid ${borderColor}; border-radius: ${designSettings.borderRadius}px;">
          ${tb.title ? `<h4 data-editable="textbox.${tb.id}.title" style="margin: 0 0 8px 0; color: ${designSettings.primaryColor}; font-family: ${fontFamily};">${s.icon} ${tb.title}</h4>` : ""}
          <div data-editable="textbox.${tb.id}.content" style="color: ${textColor}; white-space: pre-wrap; font-size: ${fontSize}px; font-family: ${fontFamily}; ${fontWeight} ${fontStyle} ${textDecor} ${textAlign} ${tbLineHeight} ${tbLetterSpacing}">${tb.content}</div>
        </div>`;
        })
        .join("");
    };

    const fd: FrameDesignSettings = { ...DEFAULT_FRAME_SETTINGS, ...(designSettings.frameDesign || {}) };
    const stageCornersHtml = decorativeCornersHtml(fd.stageBorder);

    const stages = editedTemplate.stages
      .map(
        (stage) => {
          if (stage.isSection) {
            return sectionTitleHtml(stage.name, fd.sectionTitle, "margin: 28px 0 10px;");
          }
          return `
      <div class="stage-card" style="margin-bottom: 20px;">
        ${stageCornersHtml}
        <h3 style="color: ${designSettings.primaryColor}; font-family: ${designSettings.fontFamily};">${stage.icon ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;margin-left:6px;${stage.iconColor ? `background:${stage.iconColor}20;border:1px solid ${stage.iconColor};` : ""}">${stage.icon}</span>` : ""} <span data-editable="stage.${stage.id}.name">${stage.name}</span></h3>
        <ul style="list-style: none; padding: 0;">
          ${stage.items
            .map((item) => {
              if (item.isSpacer) {
                return `<li style="padding: 0; list-style: none;"><div style="height: 10px;"></div></li>`;
              }
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
              let itemIcon: string;
              if (item.icon !== undefined) {
                itemIcon = item.icon;
              } else {
                const mode = stage.itemDisplayMode ?? "check";
                const itemIdx = stage.items.indexOf(item);
                itemIcon = mode === "numbered" ? `${itemIdx + 1}.` : mode === "bullet" ? "•" : mode === "none" ? "" : "✓";
              }
              const itemIconColor = item.iconColor || stage.itemDisplayColor || itemColor;
              const iconHtml = itemIcon
                ? `<span style="color:${itemIconColor};margin-left:6px;">${itemIcon}</span>`
                : "";
              return `<li style="padding: 5px 0; color: ${itemColor}; font-family: '${itemFont}', sans-serif; font-size: ${itemSize}px; ${itemBold} ${itemItalic} ${itemUnderline} ${itemAlign}">${iconHtml}<span data-editable="stage.${stage.id}.item.${item.id}.text">${item.text}</span></li>`;
            })
            .join("")}
        </ul>
      </div>
    `;
        }
      )
      .join("");

    const vatRate = editedTemplate.vat_rate || 17;
    const isVatBreakdown = designSettings.vatDisplayMode !== "plus-vat";
    
    const basePrice = editedTemplate.base_price || 35000;
    const payments = paymentSteps
      .map(
        (step) => {
          const stepAmount = Math.round((basePrice * step.percentage) / 100);
          const stepEffectiveVat = step.useCustomVat ? (step.vatRate ?? vatRate) : vatRate;
          const stepVat = Math.round(stepAmount * stepEffectiveVat / 100);
          const stepGross = stepAmount + stepVat;
          const vatLabel = step.useCustomVat && stepEffectiveVat !== vatRate ? ` (${stepEffectiveVat}%)` : ` (${stepEffectiveVat}%)`;
          if (isVatBreakdown) {
            return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><span data-editable="paystep.${step.id}.name">${step.name}</span></td>
        <td style="padding: 10px; text-align: center;">${step.percentage}%</td>
        <td style="padding: 10px; text-align: left;">₪${stepAmount.toLocaleString()}</td>
        <td style="padding: 10px; text-align: left; color: #666; font-size: 13px;">₪${stepVat.toLocaleString()}${vatLabel}</td>
        <td style="padding: 10px; text-align: left; font-weight: 600;">₪${stepGross.toLocaleString()}</td>
      </tr>`;
          } else {
            return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><span data-editable="paystep.${step.id}.name">${step.name}</span></td>
        <td style="padding: 10px; text-align: center;">${step.percentage}%</td>
        <td style="padding: 10px; text-align: left;">₪${stepAmount.toLocaleString()}</td>
      </tr>`;
          }
        },
      )
      .join("");

    // Calculate totals with per-step VAT
    const totalVat = paymentSteps.reduce((sum, step) => {
      const stepAmount = Math.round((basePrice * step.percentage) / 100);
      const stepEffectiveVat = step.useCustomVat ? (step.vatRate ?? vatRate) : vatRate;
      return sum + Math.round(stepAmount * stepEffectiveVat / 100);
    }, 0);
    const totalGross = basePrice + totalVat;
    const hasCustomVat = paymentSteps.some(s => s.useCustomVat && (s.vatRate ?? vatRate) !== vatRate);

    // Compute print border overlay values
    const docBorder = fd.documentBorder;
    const hasFrameOverlay = !!(docBorder && docBorder.style !== "none" && (docBorder.width ?? 0) > 0);
    const frameOverlayBorderCss = hasFrameOverlay
      ? `${docBorder!.width}px ${docBorder!.style} ${docBorder!.color}`
      : "";

    // Page size
    const { cssSize: pageCssSize } = getPageDimensions(fd.pageSize);

    // Repeat header/footer on every page
    const repeatHeader = designSettings.repeatHeaderOnAllPages === true;
    const repeatFooter = designSettings.repeatFooterOnAllPages !== false; // default ON
    const headerHeightPx = (designSettings.headerStripHeight || 150) + 10;
    const footerHeightPx = 90; // approx: padding 30px*2 + text lines

    return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&family=Assistant:wght@200;300;400;500;600;700;800&family=Rubik:wght@300;400;500;600;700&family=Alef:wght@400;700&family=David+Libre:wght@400;500;700&family=Frank+Ruhl+Libre:wght@300;400;500;700&family=Varela+Round&family=Noto+Sans+Hebrew:wght@300;400;500;600;700&family=Secular+One&family=Suez+One&family=Amatic+SC:wght@400;700&display=swap" rel="stylesheet">
  <title>${editedTemplate.name}</title>
  <style>
    body { font-family: '${designSettings.fontFamily}', sans-serif; font-size: ${designSettings.fontSize}px; margin: 0; padding: 0; ${backgroundToBodyCss(fd.background)} }
    .container { max-width: 800px; margin: 0 auto; background: white; position: relative; ${borderToCss(fd.documentBorder)} }
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
    .stage-card { position: relative; ${borderToCss(fd.stageBorder)} }
    .summary-card { position: relative; margin-top: 30px; ${borderToCss(fd.summaryBorder)} }
    @page {
      margin: 0;
      size: ${pageCssSize};
    }
    @media print {
      html {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
      }
      .container {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
      .content {
        padding-bottom: ${repeatFooter ? footerHeightPx + 20 : 40}px !important;
        ${repeatHeader ? `padding-top: ${headerHeightPx + 20}px !important;` : ""}
      }
      .footer {
        ${repeatFooter ? `
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        margin: 0 !important;
        z-index: 50 !important;
        background: #f9f9f9 !important;
        ` : ""}
      }
      ${repeatHeader ? `
      .header {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 40 !important;
        margin: 0 !important;
      }
      ` : ""}
      .quote-fixed-header { position: fixed; top: 0; left: 0; right: 0; }
      .quote-fixed-footer { position: fixed; bottom: 0; left: 0; right: 0; }
      .print-frame-overlay {
        display: block !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        pointer-events: none !important;
        z-index: 9999 !important;
        border-radius: 0 !important;
      }
    }
  </style>
</head>
<body>
  ${hasFrameOverlay ? `<div class="print-frame-overlay" style="display:none; border: ${frameOverlayBorderCss};"></div>` : ""}
  ${fixedHeaderHtml(fd.fixedHeader, designSettings.logoUrl)}
  <div class="container">
    ${decorativeCornersHtml(fd.documentBorder)}
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
      designSettings.logoPosition === "custom-strip"
        ? (() => {
            const stripBg = designSettings.stripBgColor || "#1a1a2e";
            const stripHeight = designSettings.headerStripHeight || 150;
            const layers = designSettings.stripLayers;
            const isProcessed = designSettings.stripProcessed && layers;
            
            if (isProcessed) {
              // Render 3 separate layers
              let layersHtml = "";
              if (layers?.lines?.url) {
                layersHtml += `<img src="${layers.lines.url}" alt="Lines" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center;opacity:${(layers.lines.opacity ?? 100) / 100};">`;
              }
              if (layers?.windows?.url) {
                layersHtml += `<img src="${layers.windows.url}" alt="Windows" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center;opacity:${(layers.windows.opacity ?? 100) / 100};">`;
              }
              if (layers?.text?.url) {
                layersHtml += `<img src="${layers.text.url}" alt="Text" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center;opacity:${(layers.text.opacity ?? 100) / 100};">`;
              }
              return `
    <div style="position: relative; width: 100%; height: ${stripHeight}px; background-color: ${stripBg}; overflow: hidden;">
      ${layersHtml}
    </div>`;
            } else {
              const stripOpacity = (designSettings.stripLineOpacity ?? 100) / 100;
              const logoSrc = designSettings.logoUrl || "";
              return `
    <div style="position: relative; width: 100%; height: ${stripHeight}px; background-color: ${stripBg}; overflow: hidden;">
      <img src="${logoSrc}" alt="Header Strip" style="width: 100%; height: 100%; object-fit: cover; object-position: center; opacity: ${stripOpacity}; mix-blend-mode: multiply;">
    </div>`;
            }
          })()
        : designSettings.showHeaderStrip !== false
        ? `
    <div class="header${designSettings.logoPosition === "full-width" ? " full-width-header" : ""}">
      ${designSettings.showLogo && designSettings.logoUrl && designSettings.logoPosition === "full-width" ? `<img src="${designSettings.logoUrl}" alt="Logo">` : ""}
      ${designSettings.showLogo && designSettings.logoUrl && (!designSettings.logoPosition || designSettings.logoPosition === "inside-header") ? `<img src="${designSettings.logoUrl}" alt="Logo" style="width: ${designSettings.logoWidth || designSettings.logoSize || 120}px; ${designSettings.logoHeight ? `height: ${designSettings.logoHeight}px; object-fit: contain;` : "height: auto;"} margin-bottom: 15px;">` : ""}
      ${
        designSettings.logoPosition !== "full-width"
          ? `<h1 data-editable="template.name" style="margin: 0; font-size: 32px;">${editedTemplate.name}</h1>
      <p data-editable="template.description" style="opacity: 0.9; margin: 10px 0 0;">${editedTemplate.description || ""}</p>`
          : ""
      }
    </div>`
        : `
    <div style="padding: 40px; text-align: center; border-bottom: 2px solid ${designSettings.primaryColor};">
      ${designSettings.showLogo && designSettings.logoUrl && designSettings.logoPosition !== "full-width" ? `<img src="${designSettings.logoUrl}" alt="Logo" style="width: ${designSettings.logoWidth || designSettings.logoSize || 120}px; ${designSettings.logoHeight ? `height: ${designSettings.logoHeight}px; object-fit: contain;` : "height: auto;"} margin-bottom: 15px;">` : ""}
      ${
        designSettings.logoPosition !== "full-width"
          ? `<h1 data-editable="template.name" style="margin: 0; font-size: 32px; color: ${designSettings.primaryColor};">${editedTemplate.name}</h1>
      <p data-editable="template.description" style="opacity: 0.7; margin: 10px 0 0;">${editedTemplate.description || ""}</p>`
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
      
      ${sectionTitleHtml(editedTemplate.stagesTitle || "שלבי העבודה", fd.sectionTitle, "margin: 30px 0 16px;")}
      ${stages}
      
      ${renderTextBoxes("after-stages")}
      
      ${sectionTitleHtml("סדר תשלומים", fd.sectionTitle, "margin: 40px 0 16px;")}
      <div class="summary-card">
        ${decorativeCornersHtml(fd.summaryBorder)}
        <table class="payments">
          <thead><tr><th>שלב</th><th>אחוז</th><th>סכום (נטו)</th>${isVatBreakdown ? "<th>מע״מ</th><th>סה״כ (ברוטו)</th>" : ""}</tr></thead>
          <tbody>${payments}</tbody>
          <tfoot>
            <tr style="font-weight: bold; background: #f0f0f0;">
              <td style="padding: 12px;">סה"כ</td>
              <td style="padding: 12px; text-align: center;">100%</td>
              <td style="padding: 12px; text-align: left;">₪${basePrice.toLocaleString()}</td>
              ${isVatBreakdown ? `
              <td style="padding: 12px; text-align: left; color: #666;">₪${totalVat.toLocaleString()}</td>
              <td style="padding: 12px; text-align: left; font-weight: bold; font-size: 1.1em;">₪${totalGross.toLocaleString()}</td>` : ""}
            </tr>
          </tfoot>
        </table>
        ${isVatBreakdown ? `<p style="margin-top: 8px; font-size: 12px; color: #888;">* המע״מ יחושב בכל שלב תשלום בהתאם לשיעור המע״מ התקף במועד התשלום בפועל.</p>` : ""}
      </div>
      
      ${renderTextBoxes("after-payments")}
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">* ${isVatBreakdown ? `המחירים מוצגים עם פירוט מע״מ לכל שלב.${hasCustomVat ? " שימו לב: חלק מהשלבים כוללים שיעור מע״מ שונה." : ""}` : "המחירים אינם כוללים מע\"מ."} תוקף ההצעה: ${editedTemplate.validity_days || 30} יום.</p>
      
      ${renderTextBoxes("footer")}
    </div>
    <div class="footer">
      <strong>${designSettings.companyName}</strong><br>
      ${designSettings.companyAddress} | ${designSettings.companyPhone} | ${designSettings.companyEmail}
    </div>
  </div>
  ${fixedFooterHtml(fd.fixedFooter)}
</body>
</html>`;
  }, [editedTemplate, designSettings, paymentSteps, projectDetails, textBoxes]);

  // Memoize live HTML output to avoid rebuilding identical string on unrelated renders
  const liveHtml = useMemo(() => generateHtmlContent(), [generateHtmlContent]);
  // Debounce the HTML fed into the preview iframe to prevent flicker while typing
  const debouncedPreviewHtml = useDebouncedValue(liveHtml, 300);

  // Inline-edit dispatcher: maps a data-editable path coming from the preview
  // iframe back to the relevant editor state. Paths used:
  //   template.name | template.description
  //   stage.<id>.name | stage.<id>.item.<itemId>.text
  //   paystep.<id>.name
  //   textbox.<id>.title | textbox.<id>.content
  const handleInlineEdit = useCallback(({ path, value }: InlineEditPayload) => {
    const v = (value ?? "").replace(/\u00A0/g, " ");
    if (path === "template.name") {
      setEditedTemplate((prev: any) => ({ ...prev, name: v }));
      return;
    }
    if (path === "template.description") {
      setEditedTemplate((prev: any) => ({ ...prev, description: v }));
      return;
    }
    const stageMatch = path.match(/^stage\.([^.]+)\.name$/);
    if (stageMatch) {
      const sid = stageMatch[1];
      setEditedTemplate((prev: any) => ({
        ...prev,
        stages: (prev.stages || []).map((s: any) =>
          String(s.id) === sid ? { ...s, name: v } : s,
        ),
      }));
      return;
    }
    const itemMatch = path.match(/^stage\.([^.]+)\.item\.([^.]+)\.text$/);
    if (itemMatch) {
      const sid = itemMatch[1];
      const iid = itemMatch[2];
      setEditedTemplate((prev: any) => ({
        ...prev,
        stages: (prev.stages || []).map((s: any) =>
          String(s.id) === sid
            ? {
                ...s,
                items: (s.items || []).map((it: any) =>
                  String(it.id) === iid ? { ...it, text: v } : it,
                ),
              }
            : s,
        ),
      }));
      return;
    }
    const payMatch = path.match(/^paystep\.([^.]+)\.name$/);
    if (payMatch) {
      const pid = payMatch[1];
      setPaymentSteps((prev: any[]) =>
        prev.map((p) => (String(p.id) === pid ? { ...p, name: v } : p)),
      );
      return;
    }
    const tbMatch = path.match(/^textbox\.([^.]+)\.(title|content)$/);
    if (tbMatch) {
      const tid = tbMatch[1];
      const field = tbMatch[2];
      setTextBoxes((prev: any[]) =>
        prev.map((tb) => (String(tb.id) === tid ? { ...tb, [field]: v } : tb)),
      );
    }
  }, []);


  // Helper: convert image URL to base64 data URL for standalone exports
  const convertImageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!url || url.startsWith('data:')) {
        resolve(url || '');
        return;
      }
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(url);
        }
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });
  };

  // Generate HTML with embedded base64 images for standalone export
  const generateExportHtml = async (): Promise<string> => {
    let html = generateHtmlContent();
    // Find all image src attributes and convert to base64
    const logoUrl = designSettings.logoUrl;
    if (logoUrl && !logoUrl.startsWith('data:')) {
      try {
        const base64 = await convertImageToBase64(logoUrl);
        if (base64.startsWith('data:')) {
          html = html.replaceAll(logoUrl, base64);
        }
      } catch (e) {
        console.warn('Could not convert logo to base64:', e);
      }
    }
    return html;
  };

  // Word-compatible HTML (clean, no gradients or fixed positioning)
  const generateWordHtml = async (): Promise<string> => {
    const primary = designSettings.primaryColor || '#B8860B';
    const ff = 'Arial, Helvetica, sans-serif';
    const tier = pricingTiers.find((t: any) => t.name === selectedTier) ?? pricingTiers[0];
    const basePrice = tier?.price ?? 0;
    const vatRate = 18;
    const vatAmt = Math.round((basePrice * vatRate) / 100);

    // Logo as base64 if possible
    let logoHtml = '';
    if (designSettings.logoUrl) {
      try {
        const b64 = await convertImageToBase64(designSettings.logoUrl);
        const src = b64.startsWith('data:') ? b64 : designSettings.logoUrl;
        logoHtml = `<img src="${src}" style="max-width:520px;max-height:90px;display:block;margin:0 auto 8px auto;" alt="Logo">`;
      } catch { /* skip */ }
    }

    // Project detail rows
    const details: [string, string][] = [
      ['לקוח', projectDetails.clientName || ''],
      ['כתובת', projectDetails.address || ''],
      ['גוש', projectDetails.gush || ''],
      ['חלקה', projectDetails.helka || ''],
      ['מגרש', projectDetails.migrash || ''],
      ['סוג פרוייקט', projectDetails.projectType || ''],
    ].filter(([, v]) => !!v) as [string, string][];

    const detailRows = details.map(([k, v]) =>
      `<tr><td style="font-weight:bold;padding:4px 8px;width:90px;background:#f5f5f5;border:1px solid #ddd;">${k}</td><td style="padding:4px 8px;border:1px solid #ddd;">${v}</td></tr>`
    ).join('');

    // Stages
    const stagesHtml = (editedTemplate.stages || []).map((stage: any) => {
      if (stage.isSection) {
        return `<h3 style="color:${primary};font-family:${ff};border-bottom:1px solid ${primary};padding-bottom:3px;margin-top:14px;">${stage.name}</h3>`;
      }
      const itemsHtml = (stage.items || [])
        .filter((it: any) => !it.isSpacer)
        .map((it: any) => `<li style="padding:2px 0;font-size:11pt;">${it.text || ''}</li>`)
        .join('');
      return `<div style="margin-bottom:14px;padding:10px;border:1px solid #e0e0e0;border-right:3px solid ${primary};">
  <h4 style="color:${primary};font-family:${ff};margin:0 0 8px 0;">${stage.icon ? stage.icon + ' ' : ''}${stage.name}</h4>
  ${itemsHtml ? `<ul style="margin:0;padding-right:18px;">${itemsHtml}</ul>` : ''}
</div>`;
    }).join('');

    // Payment rows
    const paymentRows = paymentSteps.map((step: any) => {
      const amt = Math.round((basePrice * step.percentage) / 100);
      return `<tr>
  <td style="padding:5px 8px;border:1px solid #ddd;">${step.name}</td>
  <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">${step.percentage}%</td>
  <td style="padding:5px 8px;border:1px solid #ddd;text-align:left;">&#8362;${amt.toLocaleString()}</td>
</tr>`;
    }).join('');

    // Text boxes by position
    const tbAt = (pos: string) =>
      textBoxes
        .filter((tb) => tb.position === pos)
        .map((tb) => `<div style="margin:10px 0;padding:10px;background:${tb.customBg || '#f9f9f9'};border:${tb.borderWidth ?? 1}px solid ${tb.customBorder || '#ddd'};">
  ${tb.title ? `<strong style="color:${primary};display:block;margin-bottom:5px;">${tb.title}</strong>` : ''}
  <div style="color:${tb.customTextColor || '#444'};white-space:pre-wrap;font-size:${tb.fontSize || 11}pt;">${tb.content}</div>
</div>`)
        .join('');

    const footerLine = [designSettings.companyAddress, designSettings.companyPhone, designSettings.companyEmail]
      .filter(Boolean)
      .join(' | ');

    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40"
      dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]><xml>
<w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>90</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml><![endif]-->
<style>
@page WordSection1 {
  size: 21cm 29.7cm;
  margin: 2cm 2.5cm 2cm 2.5cm;
  mso-header-margin: 0cm;
  mso-footer-margin: 0cm;
}
div.WordSection1 { page: WordSection1; }
body { direction: rtl; font-family: ${ff}; font-size: 12pt; margin: 0; padding: 0; color: #222; }
h1, h2, h3, h4 { font-family: ${ff}; }
table { border-collapse: collapse; width: 100%; }
p { margin: 5px 0; }
ul { margin: 4px 0; }
li { margin: 2px 0; }
</style>
</head>
<body dir="rtl">
<div class="WordSection1">

<!-- Header strip -->
<div style="background:${primary};padding:16px 20px;text-align:center;margin-bottom:20px;">
  ${logoHtml}
  <h1 style="color:white;margin:6px 0 3px;font-size:18pt;">${designSettings.companyName || ''}</h1>
  ${designSettings.companyAddress ? `<p style="color:#eee;margin:0;font-size:9pt;">${designSettings.companyAddress}</p>` : ''}
</div>

<!-- Quote title -->
<h2 style="color:${primary};border-bottom:2px solid ${primary};padding-bottom:5px;margin-bottom:16px;">${editedTemplate.name || 'הצעת מחיר'}</h2>

${tbAt('header')}

${detailRows ? `<h3 style="color:${primary};margin-bottom:8px;">פרטי הפרוייקט</h3>
<table style="margin-bottom:18px;">${detailRows}</table>` : ''}

${tbAt('before-stages')}

${(editedTemplate.stages || []).length > 0 ? `<h2 style="color:${primary};border-bottom:2px solid ${primary};padding-bottom:5px;margin-bottom:14px;">${editedTemplate.stagesTitle || 'שלבי העבודה'}</h2>
${stagesHtml}` : ''}

${tbAt('after-stages')}

<!-- Payment table -->
<h2 style="color:${primary};border-bottom:2px solid ${primary};padding-bottom:5px;margin-top:22px;margin-bottom:12px;">סדר תשלומים</h2>
<table>
  <thead>
    <tr style="background:${primary};color:white;">
      <th style="padding:6px 8px;text-align:right;border:1px solid #bbb;">שלב</th>
      <th style="padding:6px 8px;text-align:center;border:1px solid #bbb;">אחוז</th>
      <th style="padding:6px 8px;text-align:left;border:1px solid #bbb;">סכום</th>
    </tr>
  </thead>
  <tbody>${paymentRows}</tbody>
  <tfoot>
    <tr style="background:#f5f5f5;font-weight:bold;">
      <td colspan="2" style="padding:5px 8px;border:1px solid #ddd;">סה"כ לפני מע"מ</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:left;">&#8362;${basePrice.toLocaleString()}</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:5px 8px;border:1px solid #ddd;">מע"מ (${vatRate}%)</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:left;">&#8362;${vatAmt.toLocaleString()}</td>
    </tr>
    <tr style="background:${primary};color:white;font-weight:bold;font-size:13pt;">
      <td colspan="2" style="padding:7px 8px;border:1px solid #999;">סה"כ כולל מע"מ</td>
      <td style="padding:7px 8px;border:1px solid #999;text-align:left;">&#8362;${(basePrice + vatAmt).toLocaleString()}</td>
    </tr>
  </tfoot>
</table>

${tbAt('before-payments')}
${tbAt('after-payments')}

<!-- Footer -->
<div style="margin-top:28px;padding:12px;background:#f5f5f5;border-top:2px solid ${primary};text-align:center;font-size:10pt;color:#555;">
  <strong>${designSettings.companyName || ''}</strong><br>
  ${footerLine}
</div>

${tbAt('footer')}

</div>
</body>
</html>`;
  };

  const handleExportWord = async () => {
    toast({ title: 'מכין קובץ Word...' });
    try {
      const html = await generateWordHtml();
      const blob = new Blob(['﻿', html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editedTemplate.name || 'הצעת-מחיר'}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'קובץ Word הורד בהצלחה' });
    } catch (err) {
      console.error('Word export error:', err);
      toast({ title: 'שגיאה ביצוא Word', variant: 'destructive' });
    }
  };

  const handleExportPdf = async () => {
    const html = await generateExportHtml();
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

  const handleExportHtml = async () => {
    toast({ title: "מכין קובץ HTML...", description: "ממיר תמונות" });
    const html = await generateExportHtml();
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
        {
          id: Date.now().toString(),
          name: "שלב חדש",
          icon: "📋",
          items: [{ id: (Date.now() + 1).toString(), text: "פריט חדש" }],
          itemDisplayMode: "check",
        },
      ],
    });
  const addSectionHeader = () =>
    setEditedTemplate({
      ...editedTemplate,
      stages: [
        ...editedTemplate.stages,
        {
          id: Date.now().toString(),
          name: "כותרת חדשה",
          icon: "",
          items: [],
          isSection: true,
        },
      ],
    });
  const addStageAfterSection = (sectionId: string) => {
    const idx = editedTemplate.stages.findIndex(s => s.id === sectionId);
    const newStage: TemplateStage = {
      id: Date.now().toString(),
      name: "שלב חדש",
      icon: "📋",
      items: [{ id: (Date.now() + 1).toString(), text: "פריט חדש" }],
      itemDisplayMode: "check",
    };
    const next = [...editedTemplate.stages];
    next.splice(idx + 1, 0, newStage);
    setEditedTemplate({ ...editedTemplate, stages: next });
  };
  const insertStageAt = (insertIndex: number) => {
    const newStage: TemplateStage = {
      id: Date.now().toString(),
      name: "שלב חדש",
      icon: "📋",
      items: [],
      itemDisplayMode: "check",
    };
    const next = [...editedTemplate.stages];
    next.splice(insertIndex, 0, newStage);
    setEditedTemplate({ ...editedTemplate, stages: next });
  };
  const insertSectionHeaderAt = (insertIndex: number) => {
    const newSection: TemplateStage = {
      id: Date.now().toString(),
      name: "כותרת חדשה",
      icon: "",
      items: [],
      isSection: true,
    };
    const next = [...editedTemplate.stages];
    next.splice(insertIndex, 0, newSection);
    setEditedTemplate({ ...editedTemplate, stages: next });
  };
  const addSectionHeaderAfter = (stageId: string) => {
    const idx = editedTemplate.stages.findIndex(s => s.id === stageId);
    insertSectionHeaderAt(idx + 1);
  };
  const addPaymentStep = () =>
    setPaymentSteps([
      ...paymentSteps,
      {
        id: Date.now().toString(),
        name: "שלב תשלום חדש",
        percentage: 0,
        description: "",
        useCustomVat: false,
        linkSource: "stage_template",
        templateStageId: "",
        templateStageName: "",
        templateTaskId: "",
        templateTaskName: "",
        quoteTemplateStageId: "",
        quoteTemplateStageName: "",
        quoteTemplateItemId: "",
        quoteTemplateItemText: "",
        triggerMode: "manual",
        triggerDate: null,
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

  // AI-powered logo layer processing
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [processingLayer, setProcessingLayer] = useState<string | null>(null);

  // Convert any image src (relative path, URL, or base64) to base64 data URL
  const convertToBase64 = useCallback(async (src: string): Promise<string | null> => {
    if (src.startsWith("data:")) return src;
    try {
      // For any URL or path, load via canvas
      return await new Promise<string>((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("No canvas context"));
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = src;
      });
    } catch {
      return null;
    }
  }, []);

  const processLogoLayer = useCallback(async (layer: string, color: string) => {
    const logoSrc = designSettings.originalLogoUrl || designSettings.logoUrl;
    if (!logoSrc) return;
    
    setProcessingLayer(layer);
    try {
      // Always convert to base64 before sending to edge function
      const base64Data = await convertToBase64(logoSrc);
      if (!base64Data) {
        toast({ title: "❌ שגיאה", description: "לא ניתן לטעון את תמונת הלוגו", variant: "destructive" });
        return null;
      }

      const { data, error } = await supabase.functions.invoke("process-logo", {
        body: { image_base64: base64Data, layer, color },
      });
      
      if (error) {
        toast({ title: "❌ שגיאה בעיבוד", description: error.message, variant: "destructive" });
        return null;
      }
      
      if (data?.success && data?.image) {
        return data.image;
      } else {
        toast({ title: "❌ שגיאה", description: data?.error || "AI לא החזיר תמונה", variant: "destructive" });
        return null;
      }
    } catch (err: any) {
      toast({ title: "❌ שגיאה", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setProcessingLayer(null);
    }
  }, [designSettings.logoUrl, designSettings.originalLogoUrl, toast, convertToBase64]);

  // Upload base64 image to storage and return public URL
  const uploadLayerToStorage = useCallback(async (base64Data: string, layerName: string): Promise<string | null> => {
    try {
      // Convert base64 to blob
      const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, "");
      const byteChars = atob(base64Clean);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: "image/png" });
      
      const fileName = `${editedTemplate.id || "draft"}_${layerName}_${Date.now()}.png`;
      
      const { data, error } = await supabase.storage
        .from("logo-layers")
        .upload(fileName, blob, { contentType: "image/png", upsert: true });
      
      if (error) {
        console.error("Storage upload error:", error);
        return base64Data; // Fallback to base64
      }
      
      const { data: urlData } = supabase.storage
        .from("logo-layers")
        .getPublicUrl(data.path);
      
      return urlData.publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      return base64Data; // Fallback to base64
    }
  }, [editedTemplate.id]);

  const handleProcessAllLayers = useCallback(async () => {
    const logoSrc = designSettings.originalLogoUrl || designSettings.logoUrl;
    if (!logoSrc) {
      toast({ title: "❌ אין לוגו", description: "יש להעלות לוגו קודם" });
      return;
    }
    
    setIsProcessingLogo(true);
    const defaultColors = {
      lines: designSettings.stripLayers?.lines?.color || "#000000",
      windows: designSettings.stripLayers?.windows?.color || "#000000",
      text: designSettings.stripLayers?.text?.color || "#000000",
    };
    
    toast({ title: "🔄 מעבד לוגו עם AI...", description: "מזהה קווים, חלונות וטקסט - אנא המתן" });
    
    // Process all 3 layers sequentially (to avoid rate limits)
    const linesImg = await processLogoLayer("lines", defaultColors.lines);
    const windowsImg = await processLogoLayer("windows", defaultColors.windows);
    const textImg = await processLogoLayer("text", defaultColors.text);
    
    // Upload to storage for persistence
    const [linesUrl, windowsUrl, textUrl] = await Promise.all([
      linesImg ? uploadLayerToStorage(linesImg, "lines") : Promise.resolve(""),
      windowsImg ? uploadLayerToStorage(windowsImg, "windows") : Promise.resolve(""),
      textImg ? uploadLayerToStorage(textImg, "text") : Promise.resolve(""),
    ]);
    
    setDesignSettings(prev => ({
      ...prev,
      originalLogoUrl: prev.originalLogoUrl || prev.logoUrl,
      stripProcessed: true,
      stripLayers: {
        lines: { url: linesUrl || "", color: defaultColors.lines, opacity: 100 },
        windows: { url: windowsUrl || "", color: defaultColors.windows, opacity: 100 },
        text: { url: textUrl || "", color: defaultColors.text, opacity: 100 },
      },
    }));
    
    setIsProcessingLogo(false);
    toast({ title: "✅ עיבוד הושלם!", description: "3 שכבות זוהו ונשמרו - לחץ 'שמור' לשמירה בענן" });
  }, [designSettings, processLogoLayer, uploadLayerToStorage, toast]);

  const handleRecolorLayer = useCallback(async (layer: "lines" | "windows" | "text", newColor: string) => {
    // Update color immediately in state
    setDesignSettings(prev => ({
      ...prev,
      stripLayers: {
        ...prev.stripLayers,
        [layer]: { ...(prev.stripLayers?.[layer] || { url: "", opacity: 100 }), color: newColor },
      },
    }));
    
    // Then process with AI
    const newImage = await processLogoLayer(layer, newColor);
    if (newImage) {
      // Upload to storage
      const storedUrl = await uploadLayerToStorage(newImage, layer);
      setDesignSettings(prev => ({
        ...prev,
        stripLayers: {
          ...prev.stripLayers,
          [layer]: { ...(prev.stripLayers?.[layer] || { opacity: 100, color: newColor }), url: storedUrl || newImage, color: newColor },
        },
      }));
    }
  }, [processLogoLayer, uploadLayerToStorage]);

  const [isRemovingBg, setIsRemovingBg] = useState(false);

  // Legacy background removal (simple Canvas-based fallback)
  const removeLogoBackground = useCallback((logoSrc: string, threshold: number = 220) => {
    return new Promise<string>((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(logoSrc); return; }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (r > threshold && g > threshold && b > threshold) {
            data[i + 3] = 0;
          } else {
            const darkness = 1 - (r + g + b) / (3 * 255);
            data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
            data[i + 3] = Math.round(darkness * 255);
          }
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(logoSrc);
      img.src = logoSrc;
    });
  }, []);

  const handleRemoveBackground = useCallback(async () => {
    if (!designSettings.logoUrl) return;
    setIsRemovingBg(true);
    try {
      const cleaned = await removeLogoBackground(designSettings.logoUrl);
      setDesignSettings((prev) => ({ ...prev, logoUrl: cleaned }));
      toast({ title: "✅ רקע הוסר בהצלחה", description: "הקווים זוהו והרקע הלבן הוסר" });
    } catch (err) {
      toast({ title: "❌ שגיאה", description: "לא ניתן להסיר רקע", variant: "destructive" });
    }
    setIsRemovingBg(false);
  }, [designSettings.logoUrl, removeLogoBackground, toast]);

  const totalPaymentPercentage = paymentSteps.reduce(
    (sum, s) => sum + s.percentage,
    0,
  );
  // המחיר הפעיל: עדיפות לחבילה הנבחרת בטאב "תוכן" -> סיכום ההצעה
  const selectedTierObj = (pricingTiers as any[]).find((t) => t?.name === selectedTier);
  const basePrice = (selectedTierObj && Number(selectedTierObj.price) > 0)
    ? Number(selectedTierObj.price)
    : (editedTemplate.base_price || 35000);

  // סנכרון אוטומטי - המחיר של החבילה הנבחרת נשמר ב-base_price כדי שיישמר ויעבור הלאה (חוזה/חתימה)
  useEffect(() => {
    if (selectedTierObj && Number(selectedTierObj.price) > 0) {
      const tierPrice = Number(selectedTierObj.price);
      if ((editedTemplate.base_price || 0) !== tierPrice) {
        setEditedTemplate((prev: any) => ({ ...prev, base_price: tierPrice }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTier, selectedTierObj?.price]);

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
  const [showCreateClientDialog, setShowCreateClientDialog] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const [calculationResult, setCalculationResult] =
    useState<CalculationResult | null>(null);

  // Versioning system - cloud-based
  const [quoteVersions, setQuoteVersions] = useState<QuoteVersion[]>([]);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [comparingVersion, setComparingVersion] = useState<QuoteVersion | null>(
    null,
  );
  const [viewingVersion, setViewingVersion] = useState<QuoteVersion | null>(null);
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
          .limit(MAX_QUOTE_VERSIONS);
        if (error) {
          console.error("Error loading versions:", error);
          return;
        }
        setQuoteVersions(
          (data || []).map((v: any) => ({
            id: v.id,
            timestamp: v.created_at,
            label: v.label || `גרסה ${v.version_number}`,
            data: v.snapshot || {},
          })),
        );
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
      const versionLabel =
        label?.trim() ||
        buildAutoVersionLabel(nextNum, snapshot, quoteVersions[0] || null);

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

      // Keep only the newest N versions in cloud
      const { data: allVersions, error: allVersionsError } = await (supabase as any)
        .from("quote_template_versions")
        .select("id, version_number")
        .eq("template_id", editedTemplate.id)
        .order("version_number", { ascending: false });

      if (allVersionsError) throw allVersionsError;

      const versionsRows = allVersions || [];
      if (versionsRows.length > MAX_QUOTE_VERSIONS) {
        const deleteIds = versionsRows
          .slice(MAX_QUOTE_VERSIONS)
          .map((v: any) => v.id)
          .filter(Boolean);

        if (deleteIds.length > 0) {
          const { error: pruneError } = await (supabase as any)
            .from("quote_template_versions")
            .delete()
            .in("id", deleteIds);

          if (pruneError) throw pruneError;
        }
      }

      // Add to local state
      const newVersion: QuoteVersion = {
        id: inserted.id,
        timestamp: inserted.created_at,
        label: versionLabel,
        data: snapshot,
      };
      setQuoteVersions((prev) => [newVersion, ...prev].slice(0, MAX_QUOTE_VERSIONS));
      toast({
        title: "גרסה נשמרה בענן ☁️",
        description: `${versionLabel} (נשמרות עד ${MAX_QUOTE_VERSIONS} גרסאות אחרונות)`,
      });
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
    if (version.data.upgrades) setUpgrades(version.data.upgrades);
    if (version.data.pricingTiers) setPricingTiers(version.data.pricingTiers);
    if (version.data.projectDetails)
      setProjectDetails(version.data.projectDetails);
    toast({ title: "גרסה שוחזרה", description: version.label });
    setViewingVersion(null);
    setComparingVersion(null);
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
      if (comparingVersion?.id === versionId) setComparingVersion(null);
      if (viewingVersion?.id === versionId) setViewingVersion(null);
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
  const handleExportSignedPdf = async () => {
    const html = await generateExportHtml();
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

  // Create Client File from quote data
  const handleCreateClientFile = async (linkExisting: string | null) => {
    setIsCreatingClient(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("לא מחובר");

      let clientId = linkExisting;

      if (!clientId) {
        // Create new client with all project details
        if (!projectDetails.clientName?.trim()) {
          toast({ title: "חסר שם לקוח", description: "הזן שם לקוח בפרטי הפרויקט", variant: "destructive" });
          setIsCreatingClient(false);
          return;
        }

        const { data: newClient, error: clientError } = await (supabase as any)
          .from("clients")
          .insert({
            name: projectDetails.clientName,
            gush: projectDetails.gush || null,
            helka: projectDetails.helka || null,
            migrash: projectDetails.migrash || null,
            taba: projectDetails.taba || null,
            address: projectDetails.address || null,
            phone: (projectDetails as any).phone || null,
            email: (projectDetails as any).email || null,
            user_id: user.id,
            created_by: user.id,
            source: "הצעת מחיר",
            status: "active",
            notes: `סטטוס ליד: הצעת מחיר (טרם נסגר)\nנוצר מהצעת מחיר: ${editedTemplate.name}\nסוג פרויקט: ${projectDetails.projectType || "לא צוין"}`,
          })
          .select("id")
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      } else {
        // Update existing client with project details
        const updateData: any = {};
        if (projectDetails.gush) updateData.gush = projectDetails.gush;
        if (projectDetails.helka) updateData.helka = projectDetails.helka;
        if (projectDetails.migrash) updateData.migrash = projectDetails.migrash;
        if (projectDetails.taba) updateData.taba = projectDetails.taba;
        if (projectDetails.address) updateData.address = projectDetails.address;
        
        if (Object.keys(updateData).length > 0) {
          await (supabase as any).from("clients").update(updateData).eq("id", clientId);
        }
      }

      // Create contract from the quote
      const basePrice = editedTemplate.base_price || 0;
      const vatRate = editedTemplate.vat_rate || 17;
      const totalWithVat = Math.round(basePrice * (1 + vatRate / 100));

      // Generate contract number
      const year = new Date().getFullYear();
      const { count } = await (supabase as any)
        .from("contracts")
        .select("id", { count: "exact", head: true });
      const contractNumber = `C${year}-${String((count || 0) + 1).padStart(4, "0")}`;

      const { error: contractError } = await (supabase as any)
        .from("contracts")
        .insert({
          contract_number: contractNumber,
          client_id: clientId,
          title: editedTemplate.name || "חוזה מהצעת מחיר",
          description: editedTemplate.description || "",
          contract_type: "fixed_price",
          contract_value: totalWithVat,
          start_date: new Date().toISOString().split("T")[0],
          signed_date: new Date().toISOString().split("T")[0],
          payment_terms: editedTemplate.terms || "",
          terms_and_conditions: editedTemplate.notes || "",
          notes: `נוצר מהצעת מחיר: ${editedTemplate.name}\nמחיר בסיס: ₪${basePrice.toLocaleString()}\nמע״מ ${vatRate}%: ₪${Math.round(basePrice * vatRate / 100).toLocaleString()}\nסה״כ: ₪${totalWithVat.toLocaleString()}`,
          created_by: user.id,
          status: "active",
        });

      if (contractError) throw contractError;

      // Sync stages from template if one is linked
      let stagesAdded = 0;
      if (projectDetails.stageTemplateId) {
        try {
          const syncResult = await syncClientStagesFromTemplate({
            clientId,
            templateId: projectDetails.stageTemplateId,
            clearAllOnTemplateChange: false,
          });
          stagesAdded = syncResult.addedStages;
        } catch (stageErr) {
          console.error("Stage sync failed:", stageErr);
        }
      }

      setShowCreateClientDialog(false);
      toast({
        title: "✅ תיק לקוח נוצר בהצלחה!",
        description: stagesAdded > 0
          ? `${projectDetails.clientName || "לקוח"} - נוספו ${stagesAdded} שלבים מהתבנית`
          : `${projectDetails.clientName || "לקוח"} - כולל חוזה וכל הפרטים`,
      });

      // Open client profile in new tab
      window.open(`/clients/${clientId}`, "_blank");
    } catch (err: any) {
      console.error("Create client file error:", err);
      toast({
        title: "שגיאה ביצירת תיק לקוח",
        description: err?.message || "נסה שוב",
        variant: "destructive",
      });
    } finally {
      setIsCreatingClient(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose} modal={false}>
      <SheetContent
        side="right"
        hideClose
        dir="rtl"
        className="flex flex-col gap-0 overflow-hidden border-0 p-0 !duration-0 !transition-none data-[state=open]:!animate-none data-[state=closed]:!animate-none"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: "var(--app-sidebar-offset, 0px)",
          bottom: 0,
          width: "calc(100vw - var(--app-sidebar-offset, 0px))",
          height: "100vh",
          maxWidth: "none",
          zIndex: 300,
        }}
      >
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
          className={`shrink-0 text-white ${designSettings.logoPosition === "full-width" || designSettings.logoPosition === "custom-strip" ? "p-0 overflow-hidden relative" : "p-6"} ${designSettings.showHeaderStrip === false && designSettings.logoPosition !== "full-width" && designSettings.logoPosition !== "custom-strip" ? "bg-white border-b-2" : ""}`}
          style={{
            background:
              designSettings.logoPosition === "full-width" || designSettings.logoPosition === "custom-strip"
                ? designSettings.logoPosition === "custom-strip"
                  ? designSettings.stripBgColor || "#1a1a2e"
                  : "transparent"
                : designSettings.showHeaderStrip !== false
                  ? designSettings.headerBackground
                  : "white",
            borderColor:
              designSettings.logoPosition !== "full-width" && designSettings.logoPosition !== "custom-strip"
                ? designSettings.primaryColor
                : undefined,
          }}
        >
          {/* Custom Strip - Company header with AI-separated layers */}
          {designSettings.logoPosition === "custom-strip" && (
            <div
              className="relative w-full overflow-hidden"
              style={{
                height: designSettings.headerStripHeight || 150,
                backgroundColor: designSettings.stripBgColor || "#1a1a2e",
              }}
            >
              {designSettings.stripProcessed && designSettings.stripLayers ? (
                <>
                  {/* Layer 1: Lines & Buildings */}
                  {designSettings.stripLayers.lines?.url && (
                    <img
                      src={designSettings.stripLayers.lines.url}
                      alt="Lines layer"
                      style={{
                        position: "absolute",
                        top: 0, left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        opacity: (designSettings.stripLayers.lines.opacity ?? 100) / 100,
                      }}
                    />
                  )}
                  {/* Layer 2: Windows */}
                  {designSettings.stripLayers.windows?.url && (
                    <img
                      src={designSettings.stripLayers.windows.url}
                      alt="Windows layer"
                      style={{
                        position: "absolute",
                        top: 0, left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        opacity: (designSettings.stripLayers.windows.opacity ?? 100) / 100,
                      }}
                    />
                  )}
                  {/* Layer 3: Text */}
                  {designSettings.stripLayers.text?.url && (
                    <img
                      src={designSettings.stripLayers.text.url}
                      alt="Text layer"
                      style={{
                        position: "absolute",
                        top: 0, left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        opacity: (designSettings.stripLayers.text.opacity ?? 100) / 100,
                      }}
                    />
                  )}
                </>
              ) : (
                <img
                  src={designSettings.logoUrl || companyHeaderImg}
                  alt="Company Header Strip"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    opacity: (designSettings.stripLineOpacity ?? 100) / 100,
                    mixBlendMode: "multiply",
                  }}
                />
              )}
            </div>
          )}
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
          {/* Regular header content - only show when not full-width or custom-strip logo */}
          {designSettings.logoPosition !== "full-width" && designSettings.logoPosition !== "custom-strip" && (
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
                    {designSettings.vatDisplayMode !== "plus-vat" ? (
                      <span className="text-base opacity-80">כולל מע״מ</span>
                    ) : (
                      <span className="text-base opacity-80">+ מע״מ</span>
                    )}
                  </div>
                  {/* VAT breakdown */}
                  {(() => {
                    const bp = editedTemplate.base_price || 35000;
                    const vr = editedTemplate.vat_rate || 17;
                    const vatAmt = Math.round(bp * vr / 100);
                    const totalWithVat = bp + vatAmt;
                    return designSettings.vatDisplayMode !== "plus-vat" ? (
                      <div className="text-xs opacity-70 mt-1 space-y-0.5 text-left">
                        <div>מחיר לפני מע״מ: ₪{bp.toLocaleString()}</div>
                        <div>מע״מ {vr}%: ₪{vatAmt.toLocaleString()}</div>
                        <div className="font-semibold text-sm">סה״כ כולל מע״מ: ₪{totalWithVat.toLocaleString()}</div>
                      </div>
                    ) : (
                      <div className="text-xs opacity-70 mt-1 space-y-0.5 text-left">
                        <div>מע״מ {vr}%: ₪{vatAmt.toLocaleString()}</div>
                        <div className="font-semibold text-sm">סה״כ כולל מע״מ: ₪{totalWithVat.toLocaleString()}</div>
                      </div>
                    );
                  })()}
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
          onValueChange={(nextTab) => {
            if (nextTab === "strip-maker") {
              setLogoStripMode("maker");
              setActiveTab("logo-strip");
              return;
            }

            if (nextTab === "logo-strip") {
              setLogoStripMode("logo");
            }

            setActiveTab(nextTab);
          }}
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
                לוגו
              </TabsTrigger>
              <TabsTrigger
                value="text-boxes"
                className="data-[state=active]:bg-[#DAA520]/10 data-[state=active]:text-[#B8860B]"
              >
                <Type className="h-4 w-4 ml-2" />
                טקסט
              </TabsTrigger>
              <TabsTrigger
                value="tools"
                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
              >
                <Wrench className="h-4 w-4 ml-2" />
                כלים
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
                  stageTemplates={stageTemplates}
                  onTemplateChange={(template) => {
                    const templateStageIds = new Set(
                      (template?.stages || []).map((stage) => stage.id),
                    );
                    const templateTaskIds = new Set(
                      (template?.stages || [])
                        .flatMap((stage) => stage.tasks || [])
                        .map((task) => task.id),
                    );

                    setPaymentSteps((prev) =>
                      prev.map((step) => {
                        if (step.linkSource === "quote_template") {
                          return step;
                        }

                        if (!step.templateStageId && !step.templateTaskId) {
                          return step;
                        }

                        const keepStage =
                          !!step.templateStageId &&
                          templateStageIds.has(step.templateStageId);
                        const keepTask =
                          !!step.templateTaskId &&
                          templateTaskIds.has(step.templateTaskId);

                        if (keepStage && keepTask) {
                          return step;
                        }

                        return {
                          ...step,
                          linkSource: keepTask || keepStage ? "stage_template" : step.linkSource,
                          templateStageId: keepStage ? step.templateStageId : "",
                          templateStageName: keepStage ? step.templateStageName : "",
                          templateTaskId: keepTask ? step.templateTaskId : "",
                          templateTaskName: keepTask ? step.templateTaskName : "",
                          triggerMode:
                            step.triggerMode === "task_completion" && !keepTask
                              ? "manual"
                              : step.triggerMode,
                        };
                      }),
                    );
                  }}
                />
                {isLoadingStageTemplates && (
                  <p className="text-xs text-muted-foreground mt-2">
                    טוען תבניות שלבים...
                  </p>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">💡 טיפ</h3>
                  <p className="text-sm text-blue-700">
                    לחץ על שדה "שם הלקוח" כדי לפתוח רשימת לקוחות מלאה ולשייך
                    בלחיצה אחת. תוכל גם להזין את הפרטים ידנית.
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
                  <div className="flex items-center justify-between gap-2">
                    {/* Editable main stages title */}
                    {editingStagesTitle ? (
                      <input
                        autoFocus
                        value={editedTemplate.stagesTitle ?? "שלבי העבודה"}
                        onChange={(e) => setEditedTemplate({ ...editedTemplate, stagesTitle: e.target.value })}
                        onBlur={() => setEditingStagesTitle(false)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingStagesTitle(false); }}
                        className="text-xl font-bold bg-transparent border-b-2 border-[#DAA520] outline-none flex-1"
                        dir="rtl"
                      />
                    ) : (
                      <h2
                        className="text-xl font-bold cursor-pointer hover:text-[#B8860B] flex items-center gap-1 group"
                        onClick={() => setEditingStagesTitle(true)}
                        title="לחץ לעריכת כותרת"
                      >
                        {editedTemplate.stagesTitle || "שלבי העבודה"}
                        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                      </h2>
                    )}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#DAA520] text-[#B8860B]"
                        onClick={addStage}
                      >
                        <Plus className="h-4 w-4 ml-1" />
                        הוסף שלב
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                        onClick={addSectionHeader}
                        title="הוסף כותרת ראשית בין השלבים"
                      >
                        <Heading2 className="h-4 w-4 ml-1" />
                        הוסף כותרת
                      </Button>
                    </div>
                  </div>
                  <StagesDndProvider
                    stages={editedTemplate.stages}
                    onChange={(newStages) => setEditedTemplate((prev) => ({ ...prev, stages: newStages }))}
                  >
                    <SortableContext items={editedTemplate.stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                      {editedTemplate.stages.map((stage, index) => {
                        const blockEl = stage.isSection ? (
                          <SortableStageBlock key={stage.id} id={stage.id} isSection>
                            <SectionHeaderRow
                              stage={stage}
                              onUpdate={(updated) => updateStage(stage.id, updated)}
                              onDelete={() => deleteStage(stage.id)}
                              onMoveUp={() => moveStage(stage.id, "up")}
                              onMoveDown={() => moveStage(stage.id, "down")}
                              onAddStageBelow={() => addStageAfterSection(stage.id)}
                              onAddSectionBelow={() => addSectionHeaderAfter(stage.id)}
                              isFirst={index === 0}
                              isLast={index === editedTemplate.stages.length - 1}
                            />
                          </SortableStageBlock>
                        ) : (() => {
                          const parentSectionIdx = (() => {
                            for (let i = index - 1; i >= 0; i--) {
                              if (editedTemplate.stages[i].isSection) return i;
                            }
                            return -1;
                          })();
                          const isUnderSection = parentSectionIdx >= 0;
                          return (
                            <SortableStageBlock key={stage.id} id={stage.id}>
                              <div className={isUnderSection ? "mr-6 border-r-2 border-[#DAA520]/20 pr-1" : ""}>
                                <StageEditor
                                  stage={stage}
                                  onUpdate={(updated) => updateStage(stage.id, updated)}
                                  onDelete={() => deleteStage(stage.id)}
                                  onDuplicate={() => duplicateStage(stage.id)}
                                  onMoveUp={() => moveStage(stage.id, "up")}
                                  onMoveDown={() => moveStage(stage.id, "down")}
                                  isFirst={index === 0}
                                  isLast={index === editedTemplate.stages.length - 1}
                                  allStages={editedTemplate.stages}
                                  onAddStagesAfter={(newStages) => {
                                    setEditedTemplate((prev) => {
                                      const idx = prev.stages.findIndex((s) => s.id === stage.id);
                                      if (idx < 0) return prev;
                                      const next = [...prev.stages];
                                      next.splice(idx + 1, 0, ...newStages);
                                      return { ...prev, stages: next };
                                    });
                                  }}
                                  onMoveToStage={(itemIds, targetStageId, position) => {
                                    setEditedTemplate(prev => {
                                      const itemsToMove = (prev.stages.find(s => s.id === stage.id)?.items ?? []).filter(i => itemIds.includes(i.id));
                                      return {
                                        ...prev,
                                        stages: prev.stages.map(s => {
                                          if (s.id === stage.id) return { ...s, items: s.items.filter(i => !itemIds.includes(i.id)) };
                                          if (s.id === targetStageId) return { ...s, items: position === "start" ? [...itemsToMove, ...s.items] : [...s.items, ...itemsToMove] };
                                          return s;
                                        }),
                                      };
                                    });
                                  }}
                                  onCreateTextBox={(items, format) => {
                                    const texts = items.map(i => i.text);
                                    const content = format === "numbered"
                                      ? texts.map((t, i) => `${i + 1}. ${t}`).join("\n")
                                      : format === "checkmarks"
                                      ? texts.map(t => `✓ ${t}`).join("\n")
                                      : texts.join("\n");
                                    setTextBoxes(prev => [...prev, {
                                      id: Date.now().toString(),
                                      title: "תיבת טקסט חדשה",
                                      content,
                                      position: "after-stages" as const,
                                      style: "default" as const,
                                    }]);
                                  }}
                                />
                              </div>
                            </SortableStageBlock>
                          );
                        })();
                        return (
                          <React.Fragment key={stage.id}>
                            {index === 0 && (
                              <InsertBetweenStages
                                onInsertStage={() => insertStageAt(0)}
                                onInsertSection={() => insertSectionHeaderAt(0)}
                              />
                            )}
                            {blockEl}
                            <InsertBetweenStages
                              onInsertStage={() => insertStageAt(index + 1)}
                              onInsertSection={() => insertSectionHeaderAt(index + 1)}
                            />
                          </React.Fragment>
                        );
                      })}
                    </SortableContext>
                  </StagesDndProvider>

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
                      {/* VAT Display Mode Toggle */}
                      <div className="flex items-center gap-2 border rounded-lg p-1">
                        <button
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            (designSettings.vatDisplayMode || "breakdown") === "plus-vat"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => setDesignSettings({ ...designSettings, vatDisplayMode: "plus-vat" })}
                        >
                          + מע״מ
                        </button>
                        <button
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            designSettings.vatDisplayMode !== "plus-vat"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => setDesignSettings({ ...designSettings, vatDisplayMode: "breakdown" })}
                        >
                          פירוט מע״מ
                        </button>
                      </div>
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
                  {selectedStageTemplate ? (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                      תבנית שלבים משויכת: <strong>{selectedStageTemplate.name}</strong>. אפשר ללחוץ "שיוך" בכל שלב תשלום כדי לבחור משימה מתוך השלבים.
                    </div>
                  ) : (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                      כדי לשייך תשלום למשימה, בחר קודם תבנית ב"פרטי הפרויקט והלקוח".
                    </div>
                  )}
                  <div className="space-y-3">
                    {paymentSteps.map((step) => (
                      <PaymentStepEditor
                        key={step.id}
                        step={step}
                        templateKey={editedTemplate.id || editedTemplate.name || "draft-template"}
                        defaultVatRate={editedTemplate.vat_rate || 17}
                        templateStages={selectedStageTemplate?.stages || []}
                        templateName={selectedStageTemplate?.name}
                        quoteTemplateStages={editedTemplate.stages || []}
                        onPreferenceChange={saveToCloud}
                        basePrice={basePrice}
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
                        {paymentSteps.map((step) => {
                          const stepAmount = Math.round((basePrice * step.percentage) / 100);
                          const defaultVat = editedTemplate.vat_rate || 17;
                          const effectiveVat = step.useCustomVat ? (step.vatRate ?? defaultVat) : defaultVat;
                          const stepVat = Math.round(stepAmount * effectiveVat / 100);
                          const isCustom = step.useCustomVat && effectiveVat !== defaultVat;
                          const hasQuoteSource =
                            !!(step.quoteTemplateItemId || step.quoteTemplateStageId);
                          const hasStageSource = !!(step.templateTaskId || step.templateStageId);
                          return (
                            <div key={step.id} className="flex justify-between">
                              <span className="flex items-center gap-2">
                                <span>
                                  {step.name} ({step.percentage}%)
                                </span>
                                {hasQuoteSource && (
                                  <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700">
                                    תבנית ההצעה
                                  </Badge>
                                )}
                                {!hasQuoteSource && hasStageSource && (
                                  <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
                                    תבנית שלבי לקוח
                                  </Badge>
                                )}
                                {!hasQuoteSource && !hasStageSource && (
                                  <Badge variant="outline" className="text-[10px]">
                                    ללא שיוך
                                  </Badge>
                                )}
                              </span>
                              <div className="text-left">
                                <span className="font-semibold">
                                  ₪{stepAmount.toLocaleString()}
                                </span>
                                {designSettings.vatDisplayMode !== "plus-vat" && (
                                  <span className={`text-xs mr-2 ${isCustom ? "text-orange-500" : "text-muted-foreground"}`}>
                                    (+ ₪{stepVat.toLocaleString()} מע״מ{isCustom ? ` ${effectiveVat}%` : ""})
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-between pt-2 border-t font-bold text-lg">
                          <span>סה"כ</span>
                          <span>₪{basePrice.toLocaleString()}</span>
                        </div>
                        {designSettings.vatDisplayMode !== "plus-vat" && (() => {
                          const defaultVat = editedTemplate.vat_rate || 17;
                          const totalVat = paymentSteps.reduce((sum, step) => {
                            const stepAmount = Math.round((basePrice * step.percentage) / 100);
                            const effVat = step.useCustomVat ? (step.vatRate ?? defaultVat) : defaultVat;
                            return sum + Math.round(stepAmount * effVat / 100);
                          }, 0);
                          const hasCustomVat = paymentSteps.some(s => s.useCustomVat && (s.vatRate ?? defaultVat) !== defaultVat);
                          return (
                            <>
                              <div className="flex justify-between text-muted-foreground">
                                <span>מע״מ {hasCustomVat ? "(מעורב)" : `${defaultVat}%`}</span>
                                <span>₪{totalVat.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t font-bold text-lg text-primary">
                                <span>סה"כ כולל מע״מ</span>
                                <span>₪{(basePrice + totalVat).toLocaleString()}</span>
                              </div>
                            </>
                          );
                        })()}
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
              {/* Sticky sub-navigation for design sections */}
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b shadow-sm" dir="rtl">
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto">
                  <span className="text-xs font-semibold text-gray-500 ml-2 shrink-0">קפיצה לקטגוריה:</span>
                  {[
                    { id: "design-logo", label: "לוגו וסטריפ", icon: "🖼️" },
                    { id: "design-themes", label: "ערכות צבעים", icon: "🎨" },
                    { id: "design-colors", label: "צבעים מותאמים", icon: "🎯" },
                    { id: "design-3d", label: "אפקטי 3D", icon: "✨" },
                    { id: "design-typography", label: "טיפוגרפיה", icon: "🔤" },
                    { id: "design-frame", label: "מסגרת ופריסה", icon: "🧱" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 hover:border-[#d8ac27] hover:bg-[#d8ac27]/10 hover:text-[#B8860B] transition-colors text-gray-700 flex items-center gap-1.5"
                    >
                      <span>{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
                {/* 1. Logo with AI Generation */}
                <div id="design-logo" className="bg-white rounded-xl border p-6 shadow-sm scroll-mt-24">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-[#B8860B] bg-[#d8ac27]/10 px-2 py-0.5 rounded-full">1 / 6</span>
                    <span className="text-xs text-gray-400">לוגו, סטריפ ראש מסמך</span>
                  </div>
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
                          onChange={(e) => {
                            const newPosition = e.target.value as any;
                            const updates: any = {
                              ...designSettings,
                              logoPosition: newPosition,
                            };
                            // Auto-load company header for custom-strip mode
                            if (newPosition === "custom-strip" && !designSettings.logoUrl) {
                              updates.logoUrl = companyHeaderImg;
                              updates.stripBgColor = designSettings.stripBgColor || "#B8860B";
                            }
                            setDesignSettings(updates);
                          }}
                          className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                        >
                          <option value="inside-header">בתוך הסטריפ</option>
                          <option value="above-header">מעל הסטריפ</option>
                          <option value="centered-above">
                            ממורכז מעל הסטריפ
                          </option>
                          <option value="full-width">רוחב מלא בסטריפ</option>
                          <option value="custom-strip">סטריפ מותאם (לוגו חברה)</option>
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

                      {/* Custom Strip Settings */}
                      {designSettings.logoPosition === "custom-strip" && (
                        <div className="space-y-3 mt-3 p-3 border rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground font-medium">הגדרות סטריפ מותאם</p>
                          
                          {/* AI Process Button */}
                          <Button
                            size="sm"
                            variant={designSettings.stripProcessed ? "outline" : "default"}
                            className="w-full"
                            disabled={isProcessingLogo || !designSettings.logoUrl}
                            onClick={handleProcessAllLayers}
                          >
                            {isProcessingLogo ? (
                              <>
                                <RotateCcw className="h-3 w-3 ml-1 animate-spin" />
                                {processingLayer ? `מעבד שכבת ${processingLayer === "lines" ? "קווים" : processingLayer === "windows" ? "חלונות" : "טקסט"}...` : "מעבד..."}
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 ml-1" />
                                {designSettings.stripProcessed ? "עבד מחדש עם AI" : "🤖 זהה חלקים עם AI"}
                              </>
                            )}
                          </Button>

                          {/* Background Color */}
                          <div>
                            <Label className="text-sm text-gray-600">צבע רקע</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="color"
                                value={designSettings.stripBgColor || "#1a1a2e"}
                                onChange={(e) =>
                                  setDesignSettings({
                                    ...designSettings,
                                    stripBgColor: e.target.value,
                                  })
                                }
                                className="w-10 h-8 rounded border cursor-pointer"
                              />
                              <Input
                                value={designSettings.stripBgColor || "#1a1a2e"}
                                onChange={(e) =>
                                  setDesignSettings({
                                    ...designSettings,
                                    stripBgColor: e.target.value,
                                  })
                                }
                                className="flex-1 h-8 text-xs"
                              />
                            </div>
                          </div>

                          {/* AI Layer Controls - shown after processing */}
                          {designSettings.stripProcessed && designSettings.stripLayers ? (
                            <div className="space-y-3 p-2 bg-background rounded border">
                              <p className="text-xs font-medium text-primary flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                שכבות AI - צבע נפרד לכל חלק
                              </p>
                              
                              {/* Lines & Buildings */}
                              <div>
                                <Label className="text-xs text-gray-600">🏗️ קווים ובניינים</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="color"
                                    value={designSettings.stripLayers.lines?.color || "#000000"}
                                    onChange={(e) => handleRecolorLayer("lines", e.target.value)}
                                    disabled={!!processingLayer}
                                    className="w-8 h-6 rounded border cursor-pointer"
                                  />
                                  <Input
                                    value={designSettings.stripLayers.lines?.color || "#000000"}
                                    onChange={(e) => handleRecolorLayer("lines", e.target.value)}
                                    className="flex-1 h-7 text-xs"
                                    disabled={!!processingLayer}
                                  />
                                  <Slider
                                    value={[designSettings.stripLayers.lines?.opacity ?? 100]}
                                    onValueChange={([v]) =>
                                      setDesignSettings(prev => ({
                                        ...prev,
                                        stripLayers: {
                                          ...prev.stripLayers,
                                          lines: { ...(prev.stripLayers?.lines || { url: "", color: "#000000" }), opacity: v },
                                        },
                                      }))
                                    }
                                    min={0}
                                    max={100}
                                    step={5}
                                    className="w-20"
                                  />
                                  {processingLayer === "lines" && <RotateCcw className="h-3 w-3 animate-spin text-muted-foreground" />}
                                </div>
                              </div>

                              {/* Windows */}
                              <div>
                                <Label className="text-xs text-gray-600">🪟 חלונות/ריבועים</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="color"
                                    value={designSettings.stripLayers.windows?.color || "#000000"}
                                    onChange={(e) => handleRecolorLayer("windows", e.target.value)}
                                    disabled={!!processingLayer}
                                    className="w-8 h-6 rounded border cursor-pointer"
                                  />
                                  <Input
                                    value={designSettings.stripLayers.windows?.color || "#000000"}
                                    onChange={(e) => handleRecolorLayer("windows", e.target.value)}
                                    className="flex-1 h-7 text-xs"
                                    disabled={!!processingLayer}
                                  />
                                  <Slider
                                    value={[designSettings.stripLayers.windows?.opacity ?? 100]}
                                    onValueChange={([v]) =>
                                      setDesignSettings(prev => ({
                                        ...prev,
                                        stripLayers: {
                                          ...prev.stripLayers,
                                          windows: { ...(prev.stripLayers?.windows || { url: "", color: "#000000" }), opacity: v },
                                        },
                                      }))
                                    }
                                    min={0}
                                    max={100}
                                    step={5}
                                    className="w-20"
                                  />
                                  {processingLayer === "windows" && <RotateCcw className="h-3 w-3 animate-spin text-muted-foreground" />}
                                </div>
                              </div>

                              {/* Text */}
                              <div>
                                <Label className="text-xs text-gray-600">✏️ טקסט</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="color"
                                    value={designSettings.stripLayers.text?.color || "#000000"}
                                    onChange={(e) => handleRecolorLayer("text", e.target.value)}
                                    disabled={!!processingLayer}
                                    className="w-8 h-6 rounded border cursor-pointer"
                                  />
                                  <Input
                                    value={designSettings.stripLayers.text?.color || "#000000"}
                                    onChange={(e) => handleRecolorLayer("text", e.target.value)}
                                    className="flex-1 h-7 text-xs"
                                    disabled={!!processingLayer}
                                  />
                                  <Slider
                                    value={[designSettings.stripLayers.text?.opacity ?? 100]}
                                    onValueChange={([v]) =>
                                      setDesignSettings(prev => ({
                                        ...prev,
                                        stripLayers: {
                                          ...prev.stripLayers,
                                          text: { ...(prev.stripLayers?.text || { url: "", color: "#000000" }), opacity: v },
                                        },
                                      }))
                                    }
                                    min={0}
                                    max={100}
                                    step={5}
                                    className="w-20"
                                  />
                                  {processingLayer === "text" && <RotateCcw className="h-3 w-3 animate-spin text-muted-foreground" />}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Legacy single color control (before AI processing) */}
                              <div>
                                <Label className="text-sm text-gray-600">צבע קווים/טקסטורה</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="color"
                                    value={designSettings.stripLineColor || "#d4af37"}
                                    onChange={(e) =>
                                      setDesignSettings({
                                        ...designSettings,
                                        stripLineColor: e.target.value,
                                      })
                                    }
                                    className="w-10 h-8 rounded border cursor-pointer"
                                  />
                                  <Input
                                    value={designSettings.stripLineColor || "#d4af37"}
                                    onChange={(e) =>
                                      setDesignSettings({
                                        ...designSettings,
                                        stripLineColor: e.target.value,
                                      })
                                    }
                                    className="flex-1 h-8 text-xs"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm text-gray-600">
                                  שקיפות קווים: {designSettings.stripLineOpacity ?? 100}%
                                </Label>
                                <Slider
                                  value={[designSettings.stripLineOpacity ?? 100]}
                                  onValueChange={([v]) =>
                                    setDesignSettings({
                                      ...designSettings,
                                      stripLineOpacity: v,
                                    })
                                  }
                                  min={10}
                                  max={100}
                                  step={5}
                                  className="mt-2"
                                />
                              </div>
                            </>
                          )}

                          {/* Strip Height */}
                          <div>
                            <Label className="text-sm text-gray-600">
                              גובה סטריפ: {designSettings.headerStripHeight || 150}px
                            </Label>
                            <Slider
                              value={[designSettings.headerStripHeight || 150]}
                              onValueChange={([v]) =>
                                setDesignSettings({
                                  ...designSettings,
                                  headerStripHeight: v,
                                })
                              }
                              min={80}
                              max={300}
                              step={10}
                              className="mt-2"
                            />
                          </div>

                          {/* Color Presets */}
                          <div className="flex gap-2 flex-wrap">
                            {[
                              { bg: "#1a1a2e", line: "#d4af37", label: "כחול-זהב" },
                              { bg: "#ffffff", line: "#B8860B", label: "לבן-זהב" },
                              { bg: "#0a0a0a", line: "#ffffff", label: "שחור-לבן" },
                              { bg: "#1e3a5f", line: "#c0c0c0", label: "כחול-כסף" },
                              { bg: "#2d1b0e", line: "#d4af37", label: "חום-זהב" },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-accent transition-colors"
                                onClick={() =>
                                  setDesignSettings({
                                    ...designSettings,
                                    stripBgColor: preset.bg,
                                    stripLineColor: preset.line,
                                  })
                                }
                              >
                                <span
                                  className="w-3 h-3 rounded-full border"
                                  style={{ background: preset.bg }}
                                />
                                <span
                                  className="w-3 h-3 rounded-full border"
                                  style={{ background: preset.line }}
                                />
                                <span>{preset.label}</span>
                              </button>
                            ))}
                          </div>
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

                {/* Frame Design Panel - מסגרות, רקע, כותרות, header/footer */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <FrameDesignPanel
                    value={designSettings.frameDesign || DEFAULT_FRAME_SETTINGS}
                    onChange={(v) => setDesignSettings({ ...designSettings, frameDesign: v })}
                  />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Logo & Strip Tab */}
          <TabsContent
            value="logo-strip"
            className={logoStripMode === "logo" ? "flex-1 m-0 overflow-hidden" : "hidden"}
          >
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={logoStripMode === "logo" ? "default" : "outline"}
                      onClick={() => setLogoStripMode("logo")}
                    >
                      <Crop className="h-4 w-4 ml-2" />
                      לוגו וסטריפ
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={logoStripMode === "maker" ? "default" : "outline"}
                      onClick={() => setLogoStripMode("maker")}
                    >
                      <Layers className="h-4 w-4 ml-2" />
                      מכין סטריפים
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={showEmbeddedVectorEditor ? "default" : "outline"}
                      onClick={() => setShowEmbeddedVectorEditor((prev) => !prev)}
                    >
                      <Columns className="h-4 w-4 ml-2" />
                      {showEmbeddedVectorEditor ? "הסתר עורך פנימי" : "פתח עורך פנימי"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          "/vector-logo-strip-editor.html",
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4 ml-2" />
                      עורך בעמוד נפרד
                    </Button>
                  </div>
                </div>

                {showEmbeddedVectorEditor && (
                  <div className="bg-white rounded-xl border p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">
                        עורך וקטורי מתקדם (מוטמע בתוך הטאב)
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEmbeddedVectorEditor(false)}
                      >
                        סגור
                      </Button>
                    </div>
                    <iframe
                      title="Embedded Vector Logo Strip Editor"
                      ref={embeddedVectorEditorFrameRef}
                      src="/vector-logo-strip-editor.html?host=quote-editor"
                      className="w-full rounded-lg border"
                      style={{ height: "68vh" }}
                    />
                  </div>
                )}

                {/* Repeat header/footer on every page */}
                <div className="bg-white rounded-xl border p-4 shadow-sm space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#B8860B]" />
                    חזרה על כותרת ותחתית בכל עמוד
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">לוגו / סטריפ עליון בכל עמוד</Label>
                      <p className="text-xs text-gray-500 mt-0.5">הסטריפ העליון יופיע בראש כל עמוד בהדפסה</p>
                    </div>
                    <Switch
                      checked={designSettings.repeatHeaderOnAllPages === true}
                      onCheckedChange={(v) =>
                        setDesignSettings((prev) => ({ ...prev, repeatHeaderOnAllPages: v }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <div>
                      <Label className="text-sm font-medium">פרטי חברה בתחתית כל עמוד</Label>
                      <p className="text-xs text-gray-500 mt-0.5">שם החברה, כתובת וטלפון יופיעו בתחתית כל עמוד</p>
                    </div>
                    <Switch
                      checked={designSettings.repeatFooterOnAllPages !== false}
                      onCheckedChange={(v) =>
                        setDesignSettings((prev) => ({ ...prev, repeatFooterOnAllPages: v }))
                      }
                    />
                  </div>
                  {(designSettings.repeatHeaderOnAllPages || designSettings.repeatFooterOnAllPages !== false) && (
                    <p className="text-xs text-[#B8860B] bg-[#FFF8E1] rounded p-2">
                      ✓ הטקסט ירד אוטומטית כדי לא לשבת מתחת לכותרת / התחתית
                    </p>
                  )}
                </div>

                {/* Company Logo Strip - Prominent Upload Section */}
                <div className="bg-gradient-to-l from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Image className="h-6 w-6 text-amber-600" />
                    לוגו חברה כסטריפ עליון
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    העלה את הלוגו/סטריפ של החברה שלך - הוא יתפרס על כל רוחב ההצעה בחלק העליון עם שליטה מלאה בצבעים
                  </p>

                  {/* Quick action buttons */}
                  <div className="flex gap-3 mb-4 flex-wrap">
                    <Button
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 ml-2" />
                      העלה לוגו חברה
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDesignSettings((prev) => ({
                          ...prev,
                          logoUrl: companyHeaderImg,
                          logoPosition: "custom-strip" as const,
                          stripBgColor: prev.stripBgColor || "#B8860B",
                          stripLineColor: prev.stripLineColor || "#d4af37",
                        }));
                      }}
                    >
                      <Sparkles className="h-4 w-4 ml-2" />
                      השתמש בלוגו ברירת מחדל
                    </Button>
                    {designSettings.logoPosition === "custom-strip" && designSettings.logoUrl && (
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() =>
                          setDesignSettings((prev) => ({
                            ...prev,
                            logoPosition: "inside-header" as const,
                          }))
                        }
                      >
                        <X className="h-4 w-4 ml-2" />
                        חזור לסטריפ רגיל
                      </Button>
                    )}
                    {designSettings.logoUrl && !designSettings.stripProcessed && (
                      <Button
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                        onClick={handleRemoveBackground}
                        disabled={isRemovingBg}
                      >
                        {isRemovingBg ? (
                          <div className="h-4 w-4 ml-2 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 ml-2" />
                        )}
                        {isRemovingBg ? "מנקה רקע..." : "נקה רקע (בסיסי)"}
                      </Button>
                    )}
                    {designSettings.logoUrl && (
                      <Button
                        variant={designSettings.stripProcessed ? "outline" : "default"}
                        className={designSettings.stripProcessed ? "border-green-200 text-green-700" : "bg-gradient-to-r from-purple-600 to-blue-600 text-white"}
                        onClick={handleProcessAllLayers}
                        disabled={isProcessingLogo}
                      >
                        {isProcessingLogo ? (
                          <>
                            <RotateCcw className="h-4 w-4 ml-2 animate-spin" />
                            {processingLayer ? `מעבד ${processingLayer === "lines" ? "קווים" : processingLayer === "windows" ? "חלונות" : "טקסט"}...` : "מעבד..."}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 ml-2" />
                            {designSettings.stripProcessed ? "✅ עבד מחדש עם AI" : "🤖 זהה חלקים עם AI"}
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Preview of current strip */}
                  {designSettings.logoPosition === "custom-strip" && designSettings.logoUrl && (
                    <div className="space-y-4">
                      <div
                        className="rounded-lg overflow-hidden border-2 border-amber-300"
                        style={{
                          height: `${Math.min(designSettings.headerStripHeight || 150, 200)}px`,
                          backgroundColor: designSettings.stripBgColor || "#1a1a2e",
                          position: "relative",
                        }}
                      >
                      {/* Show layers if AI processed, otherwise show original logo */}
                      {designSettings.stripProcessed && designSettings.stripLayers ? (
                        <>
                          {designSettings.stripLayers.lines?.url && (
                            <img
                              src={designSettings.stripLayers.lines.url}
                              alt="Lines layer"
                              style={{
                                position: "absolute",
                                top: 0, left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center",
                                opacity: (designSettings.stripLayers.lines.opacity ?? 100) / 100,
                              }}
                            />
                          )}
                          {designSettings.stripLayers.windows?.url && (
                            <img
                              src={designSettings.stripLayers.windows.url}
                              alt="Windows layer"
                              style={{
                                position: "absolute",
                                top: 0, left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center",
                                opacity: (designSettings.stripLayers.windows.opacity ?? 100) / 100,
                              }}
                            />
                          )}
                          {designSettings.stripLayers.text?.url && (
                            <img
                              src={designSettings.stripLayers.text.url}
                              alt="Text layer"
                              style={{
                                position: "absolute",
                                top: 0, left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center",
                                opacity: (designSettings.stripLayers.text.opacity ?? 100) / 100,
                              }}
                            />
                          )}
                        </>
                      ) : (
                        <img
                          src={designSettings.logoUrl}
                          alt="Company Strip Preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center",
                            opacity: (designSettings.stripLineOpacity ?? 100) / 100,
                            mixBlendMode: "multiply",
                          }}
                        />
                      )}
                      </div>

                      {/* AI Layer Controls - shown after AI processing */}
                      {designSettings.stripProcessed && designSettings.stripLayers ? (
                        <div className="space-y-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                          <p className="text-sm font-medium flex items-center gap-1 text-purple-700">
                            <Layers className="h-4 w-4" />
                            שכבות AI - צבע נפרד לכל חלק
                          </p>
                          
                          {/* Background Color */}
                          <div>
                            <Label className="text-sm font-medium">צבע רקע</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="color"
                                value={designSettings.stripBgColor || "#1a1a2e"}
                                onChange={(e) =>
                                  setDesignSettings({ ...designSettings, stripBgColor: e.target.value })
                                }
                                className="w-10 h-8 rounded border cursor-pointer"
                              />
                              <Input
                                value={designSettings.stripBgColor || "#1a1a2e"}
                                onChange={(e) =>
                                  setDesignSettings({ ...designSettings, stripBgColor: e.target.value })
                                }
                                className="flex-1 h-8 text-xs"
                              />
                            </div>
                          </div>
                          
                          {/* Lines & Buildings */}
                          <div>
                            <Label className="text-sm font-medium">🏗️ קווים ובניינים</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="color"
                                value={designSettings.stripLayers.lines?.color || "#000000"}
                                onChange={(e) => handleRecolorLayer("lines", e.target.value)}
                                disabled={!!processingLayer}
                                className="w-10 h-8 rounded border cursor-pointer"
                              />
                              <Input
                                value={designSettings.stripLayers.lines?.color || "#000000"}
                                className="flex-1 h-8 text-xs"
                                readOnly
                              />
                              {processingLayer === "lines" && <RotateCcw className="h-4 w-4 animate-spin text-purple-500" />}
                            </div>
                          </div>
                          
                          {/* Windows */}
                          <div>
                            <Label className="text-sm font-medium">🪟 חלונות / ריבועים</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="color"
                                value={designSettings.stripLayers.windows?.color || "#000000"}
                                onChange={(e) => handleRecolorLayer("windows", e.target.value)}
                                disabled={!!processingLayer}
                                className="w-10 h-8 rounded border cursor-pointer"
                              />
                              <Input
                                value={designSettings.stripLayers.windows?.color || "#000000"}
                                className="flex-1 h-8 text-xs"
                                readOnly
                              />
                              {processingLayer === "windows" && <RotateCcw className="h-4 w-4 animate-spin text-purple-500" />}
                            </div>
                          </div>
                          
                          {/* Text */}
                          <div>
                            <Label className="text-sm font-medium">✏️ טקסט</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="color"
                                value={designSettings.stripLayers.text?.color || "#000000"}
                                onChange={(e) => handleRecolorLayer("text", e.target.value)}
                                disabled={!!processingLayer}
                                className="w-10 h-8 rounded border cursor-pointer"
                              />
                              <Input
                                value={designSettings.stripLayers.text?.color || "#000000"}
                                className="flex-1 h-8 text-xs"
                                readOnly
                              />
                              {processingLayer === "text" && <RotateCcw className="h-4 w-4 animate-spin text-purple-500" />}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Legacy color controls (before AI processing) */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">צבע רקע</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="color"
                                  value={designSettings.stripBgColor || "#1a1a2e"}
                                  onChange={(e) =>
                                    setDesignSettings({ ...designSettings, stripBgColor: e.target.value })
                                  }
                                  className="w-10 h-8 rounded border cursor-pointer"
                                />
                                <Input
                                  value={designSettings.stripBgColor || "#1a1a2e"}
                                  onChange={(e) =>
                                    setDesignSettings({ ...designSettings, stripBgColor: e.target.value })
                                  }
                                  className="flex-1 h-8 text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">צבע קווים</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="color"
                                  value={designSettings.stripLineColor || "#d4af37"}
                                  onChange={(e) =>
                                    setDesignSettings({ ...designSettings, stripLineColor: e.target.value })
                                  }
                                  className="w-10 h-8 rounded border cursor-pointer"
                                />
                                <Input
                                  value={designSettings.stripLineColor || "#d4af37"}
                                  onChange={(e) =>
                                    setDesignSettings({ ...designSettings, stripLineColor: e.target.value })
                                  }
                                  className="flex-1 h-8 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">שקיפות: {designSettings.stripLineOpacity ?? 100}%</Label>
                          <Slider
                            value={[designSettings.stripLineOpacity ?? 100]}
                            onValueChange={([v]) =>
                              setDesignSettings({ ...designSettings, stripLineOpacity: v })
                            }
                            min={10}
                            max={100}
                            step={5}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">גובה: {designSettings.headerStripHeight || 150}px</Label>
                          <Slider
                            value={[designSettings.headerStripHeight || 150]}
                            onValueChange={([v]) =>
                              setDesignSettings({ ...designSettings, headerStripHeight: v })
                            }
                            min={80}
                            max={300}
                            step={10}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Color presets */}
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { bg: "#1a1a2e", line: "#d4af37", label: "כחול-זהב" },
                          { bg: "#ffffff", line: "#B8860B", label: "לבן-זהב" },
                          { bg: "#0a0a0a", line: "#ffffff", label: "שחור-לבן" },
                          { bg: "#1e3a5f", line: "#c0c0c0", label: "כחול-כסף" },
                          { bg: "#2d1b0e", line: "#d4af37", label: "חום-זהב" },
                          { bg: "#B8860B", line: "#ffffff", label: "זהב-לבן" },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-accent transition-colors"
                            onClick={() =>
                              setDesignSettings({
                                ...designSettings,
                                stripBgColor: preset.bg,
                                stripLineColor: preset.line,
                              })
                            }
                          >
                            <span className="w-3 h-3 rounded-full border" style={{ background: preset.bg }} />
                            <span className="w-3 h-3 rounded-full border" style={{ background: preset.line }} />
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

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

          {/* Strip Maker (merged into Logo & Strips tab) */}
          <TabsContent
            value="logo-strip"
            className={logoStripMode === "maker" ? "flex-1 m-0 overflow-hidden" : "hidden"}
          >
            <ScrollArea className="h-full bg-gray-50">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={logoStripMode === "logo" ? "default" : "outline"}
                      onClick={() => setLogoStripMode("logo")}
                    >
                      <Crop className="h-4 w-4 ml-2" />
                      לוגו וסטריפ
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={logoStripMode === "maker" ? "default" : "outline"}
                      onClick={() => setLogoStripMode("maker")}
                    >
                      <Layers className="h-4 w-4 ml-2" />
                      מכין סטריפים
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={showEmbeddedVectorEditor ? "default" : "outline"}
                      onClick={() => setShowEmbeddedVectorEditor((prev) => !prev)}
                    >
                      <Columns className="h-4 w-4 ml-2" />
                      {showEmbeddedVectorEditor ? "הסתר עורך פנימי" : "פתח עורך פנימי"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          "/vector-logo-strip-editor.html",
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4 ml-2" />
                      עורך בעמוד נפרד
                    </Button>
                  </div>
                </div>

                {showEmbeddedVectorEditor && (
                  <div className="bg-white rounded-xl border p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">
                        עורך וקטורי מתקדם (מוטמע בתוך הטאב)
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEmbeddedVectorEditor(false)}
                      >
                        סגור
                      </Button>
                    </div>
                    <iframe
                      title="Embedded Vector Logo Strip Editor"
                      ref={embeddedVectorEditorFrameRef}
                      src="/vector-logo-strip-editor.html?host=quote-editor"
                      className="w-full rounded-lg border"
                      style={{ height: "68vh" }}
                    />
                  </div>
                )}

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
                      {/* User's saved custom templates */}
                      {customTextBoxTemplates.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-[#B8860B] font-medium mb-1.5 flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            התבניות שלי
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {customTextBoxTemplates.map((tmpl) => (
                              <div
                                key={tmpl.id}
                                className="flex items-center gap-0.5 bg-[#FFFBEA] border border-[#DAA520]/40 rounded-md h-7 pl-1 pr-2 text-xs"
                              >
                                <button
                                  className="hover:text-[#B8860B] transition-colors truncate max-w-[120px]"
                                  title={tmpl.label}
                                  onClick={() =>
                                    setTextBoxes([
                                      ...textBoxes,
                                      {
                                        id: Date.now().toString(),
                                        title: tmpl.title,
                                        content: tmpl.content,
                                        position: tmpl.position,
                                        style: tmpl.style,
                                        customBg: tmpl.customBg,
                                        customBorder: tmpl.customBorder,
                                      },
                                    ])
                                  }
                                >
                                  ⭐ {tmpl.label}
                                </button>
                                <button
                                  className="mr-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                                  onClick={() => deleteCustomTemplate(tmpl.id)}
                                  title="מחק תבנית"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="border-t my-2" />
                        </div>
                      )}
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
                          {selectedTextBoxIds.size > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs mb-2">
                              <span className="font-medium text-blue-700">{selectedTextBoxIds.size} תיבות נבחרו</span>
                              <Select onValueChange={applyFontToSelectedTextBoxes}>
                                <SelectTrigger className="h-6 w-28 text-xs"><SelectValue placeholder="שנה גופן" /></SelectTrigger>
                                <SelectContent>
                                  {HEBREW_FONTS.slice(0, 12).map((f) => (
                                    <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <button onClick={deleteSelectedTextBoxes} className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium">
                                <Trash2 className="h-3 w-3" /> מחק
                              </button>
                              <button onClick={() => setSelectedTextBoxIds(new Set())} className="text-gray-400 hover:text-gray-600 mr-auto">
                                בטל
                              </button>
                            </div>
                          )}
                          <div className="space-y-3">
                            {textBoxes.map((tb) => (
                              <SortableTextBox
                                key={tb.id}
                                textBox={tb}
                                isSelected={selectedTextBoxIds.has(tb.id)}
                                onToggleSelect={() => toggleTextBoxSelect(tb.id)}
                                onSaveAsTemplate={() => saveTextBoxAsTemplate(tb)}
                                customColors={customColors}
                                onAddCustomColor={addCustomColor}
                                onRemoveCustomColor={removeCustomColor}
                                onEditCustomColor={editCustomColor}
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
                    <PreviewIframe
                      html={debouncedPreviewHtml}
                      title="תצוגה מקדימה"
                      className="w-full h-full border-0"
                      style={{ minHeight: "100%" }}
                      onInlineEdit={handleInlineEdit}
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
                      onChange={(e) => {
                        const pos = e.target.value as any;
                        const updates: any = { ...designSettings, logoPosition: pos };
                        if (pos === "custom-strip" && !designSettings.logoUrl) {
                          updates.logoUrl = companyHeaderImg;
                          updates.stripBgColor = designSettings.stripBgColor || "#B8860B";
                        }
                        setDesignSettings(updates);
                      }}
                      className="h-7 text-xs border rounded px-1"
                    >
                      <option value="inside-header">לוגו בסטריפ</option>
                      <option value="above-header">מעל הסטריפ</option>
                      <option value="centered-above">ממורכז מעל</option>
                      <option value="full-width">רוחב מלא</option>
                      <option value="custom-strip">סטריפ לוגו חברה</option>
                    </select>
                    {designSettings.logoPosition === "custom-strip" && (
                      <input
                        type="color"
                        value={designSettings.stripBgColor || "#B8860B"}
                        onChange={(e) =>
                          setDesignSettings({ ...designSettings, stripBgColor: e.target.value })
                        }
                        className="h-7 w-7 rounded cursor-pointer border-0"
                        title="צבע רקע סטריפ"
                      />
                    )}
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
                                  <th className="p-2 text-left">
                                    סכום (נטו)
                                  </th>
                                  {designSettings.vatDisplayMode !== "plus-vat" && (
                                    <>
                                      <th className="p-2 text-left">מע״מ</th>
                                      <th className="p-2 text-left rounded-tl-lg">סה״כ (ברוטו)</th>
                                    </>
                                  )}
                                  {designSettings.vatDisplayMode === "plus-vat" && (
                                    <th className="p-2 text-left rounded-tl-lg" style={{ display: 'none' }}></th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {paymentSteps.map((step, i) => {
                                  const bp = editedTemplate.base_price || 35000;
                                  const stepAmount = Math.round((bp * step.percentage) / 100);
                                  const defaultVat = editedTemplate.vat_rate || 17;
                                  const effVat = step.useCustomVat ? (step.vatRate ?? defaultVat) : defaultVat;
                                  const vatAmt = Math.round(stepAmount * effVat / 100);
                                  const isCustom = step.useCustomVat && effVat !== defaultVat;
                                  return (
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
                                      ₪{stepAmount.toLocaleString()}
                                    </td>
                                    {designSettings.vatDisplayMode !== "plus-vat" && (
                                      <>
                                        <td className={`p-2 text-left text-xs ${isCustom ? "text-orange-500 font-semibold" : "text-muted-foreground"}`}>
                                          ₪{vatAmt.toLocaleString()} ({effVat}%)
                                        </td>
                                        <td className="p-2 text-left font-bold">
                                          ₪{(stepAmount + vatAmt).toLocaleString()}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                  );
                                })}
                                {/* Totals */}
                                {(() => {
                                  const bp = editedTemplate.base_price || 35000;
                                  const defaultVat = editedTemplate.vat_rate || 17;
                                  const totVat = paymentSteps.reduce((sum, step) => {
                                    const sa = Math.round((bp * step.percentage) / 100);
                                    const ev = step.useCustomVat ? (step.vatRate ?? defaultVat) : defaultVat;
                                    return sum + Math.round(sa * ev / 100);
                                  }, 0);
                                  return (
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
                                          {bp.toLocaleString()}
                                        </span>
                                      </td>
                                      {designSettings.vatDisplayMode !== "plus-vat" && (
                                        <>
                                          <td className="p-2 text-left text-muted-foreground">₪{totVat.toLocaleString()}</td>
                                          <td className="p-2 text-left text-primary font-bold text-base">₪{(bp + totVat).toLocaleString()}</td>
                                        </>
                                      )}
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                            {designSettings.vatDisplayMode !== "plus-vat" && (
                              <p className="text-xs text-muted-foreground mt-2">* המע״מ יחושב בכל שלב תשלום בהתאם לשיעור המע״מ התקף במועד התשלום בפועל.</p>
                            )}
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
                    <PreviewIframe
                      html={debouncedPreviewHtml}
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
                      onInlineEdit={handleInlineEdit}
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

                    {/* Logo Strip Quick Control */}
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 shadow-sm">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                        <Image className="h-4 w-4 text-amber-600" />
                        סטריפ לוגו חברה
                      </h3>
                      <div className="flex gap-2 flex-wrap items-center">
                        <Button
                          size="sm"
                          variant={designSettings.logoPosition === "custom-strip" ? "default" : "outline"}
                          className={`h-8 text-xs ${designSettings.logoPosition === "custom-strip" ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                          onClick={() => {
                            if (designSettings.logoPosition === "custom-strip") {
                              setDesignSettings((prev) => ({ ...prev, logoPosition: "inside-header" as const }));
                            } else {
                              setDesignSettings((prev) => ({
                                ...prev,
                                logoPosition: "custom-strip" as const,
                                logoUrl: prev.logoUrl || companyHeaderImg,
                                stripBgColor: prev.stripBgColor || "#B8860B",
                              }));
                            }
                          }}
                        >
                          {designSettings.logoPosition === "custom-strip" ? "✓ מופעל" : "הפעל סטריפ"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload className="h-3 w-3 ml-1" />
                          העלה לוגו
                        </Button>
                        {designSettings.logoPosition === "custom-strip" && (
                          <>
                            <input
                              type="color"
                              value={designSettings.stripBgColor || "#B8860B"}
                              onChange={(e) => setDesignSettings({ ...designSettings, stripBgColor: e.target.value })}
                              className="h-7 w-7 rounded cursor-pointer border"
                              title="צבע רקע"
                            />
                            <span className="text-[10px] text-gray-500">רקע</span>
                            <input
                              type="range"
                              value={designSettings.headerStripHeight || 150}
                              onChange={(e) => setDesignSettings({ ...designSettings, headerStripHeight: Number(e.target.value) })}
                              min={80}
                              max={300}
                              step={10}
                              className="w-16 h-2"
                              title={`גובה: ${designSettings.headerStripHeight || 150}px`}
                            />
                            <span className="text-[10px] text-gray-500">{designSettings.headerStripHeight || 150}px</span>
                          </>
                        )}
                      </div>
                      {designSettings.logoPosition === "custom-strip" && designSettings.logoUrl && (
                        <div
                          className="mt-3 rounded-lg overflow-hidden border border-amber-300"
                          style={{
                            height: `${Math.min((designSettings.headerStripHeight || 150) * 0.5, 80)}px`,
                            backgroundColor: designSettings.stripBgColor || "#B8860B",
                          }}
                        >
                          <img
                            src={designSettings.logoUrl}
                            alt="Strip preview"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              mixBlendMode: "multiply",
                              opacity: (designSettings.stripLineOpacity ?? 100) / 100,
                            }}
                          />
                        </div>
                      )}
                    </div>

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
                    <PreviewIframe
                      html={debouncedPreviewHtml}
                      title="תצוגה מקדימה חיה"
                      className="w-full h-full border-0"
                      style={{ minHeight: "100%" }}
                      onInlineEdit={handleInlineEdit}
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

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2" title="טיוטה אוטומטית - נשמרת בענן תוך כדי עריכה">
                {autosaveStatus === "saving" && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    שומר...
                  </span>
                )}
                {autosaveStatus === "saved" && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    נשמר ✓
                    {autosaveLastSavedAt && (
                      <span className="opacity-70">
                        {autosaveLastSavedAt.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </span>
                )}
                {autosaveStatus === "error" && (
                  <span className="flex items-center gap-1 text-destructive">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                    שגיאה בשמירה אוטומטית
                  </span>
                )}
              </div>
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
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
                onClick={() => setShowCreateClientDialog(true)}
                disabled={isCreatingClient}
              >
                {isCreatingClient ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <FolderPlus className="h-4 w-4 ml-1" />
                )}
                {isCreatingClient ? "יוצר..." : "צור תיק לקוח"}
              </Button>
            </div>
          </div>
        </div>

        {/* Create Client File Dialog */}
        <Dialog open={showCreateClientDialog} onOpenChange={setShowCreateClientDialog}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-blue-600" />
                צור תיק לקוח מההצעה
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Summary of what will be created */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm text-blue-800">מה ייווצר:</h4>
                <div className="text-sm space-y-1 text-blue-700">
                  <p>📋 <strong>תיק לקוח</strong> עם הפרטים:</p>
                  <ul className="mr-5 space-y-0.5 text-xs">
                    {projectDetails.clientName && <li>👤 שם: {projectDetails.clientName}</li>}
                    {projectDetails.gush && <li>📍 גוש: {projectDetails.gush}</li>}
                    {projectDetails.helka && <li>📍 חלקה: {projectDetails.helka}</li>}
                    {projectDetails.migrash && <li>📍 מגרש: {projectDetails.migrash}</li>}
                    {projectDetails.taba && <li>📄 תב"ע: {projectDetails.taba}</li>}
                    {projectDetails.address && <li>🏠 כתובת: {projectDetails.address}</li>}
                    {projectDetails.projectType && <li>🏗️ סוג: {projectDetails.projectType}</li>}
                  </ul>
                  <p className="mt-2">📝 <strong>חוזה</strong> על סך ₪{(() => {
                    const bp = editedTemplate.base_price || 0;
                    const vr = editedTemplate.vat_rate || 17;
                    return Math.round(bp * (1 + vr / 100)).toLocaleString();
                  })()} (כולל מע״מ)</p>
                </div>
              </div>

              {/* Check if client exists */}
              {allClients.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">לקוח קיים במערכת?</Label>
                  <div className="border rounded-lg max-h-32 overflow-y-auto">
                    {allClients
                      .filter(c => 
                        projectDetails.clientName && 
                        c.name?.toLowerCase().includes(projectDetails.clientName.toLowerCase())
                      )
                      .map((client: any) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleCreateClientFile(client.id)}
                          disabled={isCreatingClient}
                          className="w-full text-right px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b last:border-0 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-medium">{client.name}</span>
                            {client.phone && <span className="text-xs text-gray-400 mr-2">{client.phone}</span>}
                          </div>
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </button>
                      ))
                    }
                    {allClients.filter(c => 
                      projectDetails.clientName && 
                      c.name?.toLowerCase().includes(projectDetails.clientName.toLowerCase())
                    ).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">לא נמצא לקוח תואם</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowCreateClientDialog(false)}>
                ביטול
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleCreateClientFile(null)}
                disabled={isCreatingClient || !projectDetails.clientName?.trim()}
              >
                {isCreatingClient ? (
                  <span className="animate-spin ml-1">⏳</span>
                ) : (
                  <UserPlus className="h-4 w-4 ml-1" />
                )}
                {isCreatingClient ? "יוצר תיק..." : "צור לקוח חדש + חוזה"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Version History Dialog */}
        <Dialog
          open={showVersionDialog}
          onOpenChange={(isOpen) => {
            setShowVersionDialog(isOpen);
            if (!isOpen) {
              setComparingVersion(null);
              setViewingVersion(null);
            }
          }}
        >
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-[#B8860B]" />
                היסטוריית גרסאות (עד {MAX_QUOTE_VERSIONS}){" "}
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
                              setViewingVersion(
                                viewingVersion?.id === version.id ? null : version,
                              )
                            }
                          >
                            <Eye className="h-3 w-3 ml-1" />
                            {viewingVersion?.id === version.id ? "סגור" : "צפה"}
                          </Button>
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
                      {viewingVersion?.id === version.id && (
                        <div className="mt-3 pt-3 border-t text-xs space-y-2">
                          <p className="font-medium text-gray-700">תצוגת גרסה:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 rounded p-2">
                              <p className="font-medium mb-1">פרויקט</p>
                              <p>לקוח: {version.data.projectDetails?.clientName || "-"}</p>
                              <p>סוג: {version.data.projectDetails?.projectType || "-"}</p>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                              <p className="font-medium mb-1">כספים</p>
                              <p>מחיר בסיס: ₪{(version.data.basePrice || 0).toLocaleString()}</p>
                              <p>שלבי תשלום: {version.data.paymentSteps?.length || 0}</p>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded p-2">
                            <p className="font-medium mb-1">שלבי עבודה</p>
                            <p className="text-gray-600">
                              {(version.data.stages || []).map((s: any) => s.name).filter(Boolean).slice(0, 5).join(" • ") || "אין שלבים"}
                            </p>
                            {(version.data.stages?.length || 0) > 5 && (
                              <p className="text-gray-500 mt-1">
                                ועוד {(version.data.stages?.length || 0) - 5} שלבים...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
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
