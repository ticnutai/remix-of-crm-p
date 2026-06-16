// טיפוסים למערכת תבניות הצעות מחיר מתקדמת

export interface TemplateItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface TemplateStage {
  id: string;
  name: string;
  icon?: string;
  iconColor?: string;
  items: TemplateStageItem[];
  isExpanded?: boolean;
}

export interface TemplateStageItem {
  id: string;
  text: string;
  isEditing?: boolean;
  // Text formatting options
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlign?: "right" | "center" | "left";
}

export interface PaymentStep {
  id: string;
  percentage: number;
  description: string;
}

export interface TimelineStep {
  id: string;
  title: string;
  duration?: string;
}

export interface DesignSettings {
  logo_url: string | null;
  company_name: string;
  company_subtitle: string;
  primary_color: string;
  secondary_color: string;
  header_style: "gradient" | "solid" | "minimal" | "modern" | "classic";
  // New design options
  font_family: "default" | "modern" | "classic" | "elegant";
  font_size: "small" | "medium" | "large";
  border_style: "none" | "simple" | "rounded" | "shadow";
  accent_color: string;
  background_pattern: "none" | "dots" | "lines" | "grid" | "geometric";
  show_watermark: boolean;
  watermark_text: string;
  header_height: "compact" | "normal" | "large";
  table_style: "simple" | "striped" | "bordered" | "modern";
  section_divider: "none" | "line" | "dots" | "gradient";
  footer_style: "minimal" | "detailed" | "branded";
  contact_info: {
    phone: string;
    email: string;
    address: string;
    website: string;
  };
}

export interface QuoteTemplateFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  parent_id?: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  folder_id?: string | null;
  items: TemplateItem[];
  stages: TemplateStage[];
  payment_schedule: PaymentStep[];
  timeline: TimelineStep[];
  terms?: string;
  notes?: string;
  important_notes: string[];
  validity_days: number;
  design_settings: DesignSettings;
  show_vat: boolean;
  vat_rate: number;
  base_price: number; // סכום בסיס לתשלום
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // HTML template content for visual editing
  html_content?: string;
  // Cloud-saved fields
  text_boxes?: any[];
  upgrades?: any[];
  project_details?: any;
  pricing_tiers?: any[];
}

// צבעי תיקיות
export const FOLDER_COLORS = [
  "#d8ac27",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#6366f1",
  "#84cc16",
];

// קטגוריות - values must match DB CHECK constraint on quote_templates.category
export const CATEGORIES = [
  { value: "construction", label: "בנייה" },
  { value: "development", label: "היתר בניה" },
  { value: "design", label: "תכנון פנים" },
  { value: "marketing", label: "שיפוץ" },
  { value: "consulting", label: "פיקוח / ייעוץ" },
  { value: "other", label: "אחר" },
];

// יחידות מידה
export const UNITS = [
  { value: "יח׳", label: "יחידה" },
  { value: "מ״ר", label: "מטר מרובע" },
  { value: "מ״א", label: "מטר אורך" },
  { value: "שעה", label: "שעה" },
  { value: "יום", label: "יום" },
  { value: "קומפלט", label: "קומפלט" },
  { value: "חודש", label: "חודש" },
];

// הגדרות עיצוב ברירת מחדל
export const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  logo_url: null,
  company_name: "",
  company_subtitle: "",
  primary_color: "#d8ac27",
  secondary_color: "#1a365d",
  header_style: "gradient",
  font_family: "default",
  font_size: "medium",
  border_style: "rounded",
  accent_color: "#10b981",
  background_pattern: "none",
  show_watermark: false,
  watermark_text: "",
  header_height: "normal",
  table_style: "modern",
  section_divider: "line",
  footer_style: "detailed",
  contact_info: {
    phone: "",
    email: "",
    address: "",
    website: "",
  },
};

// סגנונות כותרת
export const HEADER_STYLES = [
  { value: "gradient", label: "גרדיאנט", icon: "🎨" },
  { value: "solid", label: "צבע אחיד", icon: "🟨" },
  { value: "minimal", label: "מינימלי", icon: "⬜" },
  { value: "modern", label: "מודרני", icon: "💎" },
  { value: "classic", label: "קלאסי", icon: "📜" },
];

// גופנים
export const FONT_FAMILIES = [
  { value: "default", label: "ברירת מחדל", sample: "אבגדה" },
  { value: "modern", label: "מודרני", sample: "אבגדה" },
  { value: "classic", label: "קלאסי", sample: "אבגדה" },
  { value: "elegant", label: "אלגנטי", sample: "אבגדה" },
];

// סגנונות טבלה
export const TABLE_STYLES = [
  { value: "simple", label: "פשוט" },
  { value: "striped", label: "פסים" },
  { value: "bordered", label: "עם מסגרת" },
  { value: "modern", label: "מודרני" },
];

// תבניות רקע
export const BACKGROUND_PATTERNS = [
  { value: "none", label: "ללא" },
  { value: "dots", label: "נקודות" },
  { value: "lines", label: "קווים" },
  { value: "grid", label: "רשת" },
  { value: "geometric", label: "גיאומטרי" },
];

// תבנית ריקה
export const createEmptyTemplate = (): Partial<QuoteTemplate> => ({
  id: "",
  name: "",
  description: "",
  category: "construction",
  items: [],
  stages: [],
  payment_schedule: [
    { id: crypto.randomUUID(), percentage: 50, description: "חתימת חוזה" },
    { id: crypto.randomUUID(), percentage: 50, description: "סיום העבודה" },
  ],
  timeline: [],
  terms: "ההצעה בתוקף ל-30 יום מיום הפקתה.",
  notes: "",
  important_notes: [],
  validity_days: 30,
  design_settings: { ...DEFAULT_DESIGN_SETTINGS },
  show_vat: true,
  vat_rate: 17,
  base_price: 0,
  is_active: true,
});
