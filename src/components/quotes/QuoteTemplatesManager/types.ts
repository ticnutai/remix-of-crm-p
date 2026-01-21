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
  items: TemplateStageItem[];
  isExpanded?: boolean;
}

export interface TemplateStageItem {
  id: string;
  text: string;
  isEditing?: boolean;
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
  header_style: 'gradient' | 'solid' | 'minimal';
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// קטגוריות
export const CATEGORIES = [
  { value: 'construction', label: 'בנייה' },
  { value: 'היתר_בניה', label: 'היתר בניה' },
  { value: 'תכנון_פנים', label: 'תכנון פנים' },
  { value: 'שיפוץ', label: 'שיפוץ' },
  { value: 'פיקוח', label: 'פיקוח' },
  { value: 'ייעוץ', label: 'ייעוץ' },
  { value: 'אחר', label: 'אחר' },
];

// יחידות מידה
export const UNITS = [
  { value: 'יח׳', label: 'יחידה' },
  { value: 'מ״ר', label: 'מטר מרובע' },
  { value: 'מ״א', label: 'מטר אורך' },
  { value: 'שעה', label: 'שעה' },
  { value: 'יום', label: 'יום' },
  { value: 'קומפלט', label: 'קומפלט' },
  { value: 'חודש', label: 'חודש' },
];

// הגדרות עיצוב ברירת מחדל
export const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  logo_url: null,
  company_name: '',
  company_subtitle: '',
  primary_color: '#d8ac27',
  secondary_color: '#1a365d',
  header_style: 'gradient',
};

// תבנית ריקה
export const createEmptyTemplate = (): Partial<QuoteTemplate> => ({
  id: '',
  name: '',
  description: '',
  category: 'construction',
  items: [],
  stages: [],
  payment_schedule: [
    { id: crypto.randomUUID(), percentage: 50, description: 'חתימת חוזה' },
    { id: crypto.randomUUID(), percentage: 50, description: 'סיום העבודה' },
  ],
  timeline: [],
  terms: 'ההצעה בתוקף ל-30 יום מיום הפקתה.',
  notes: '',
  important_notes: [],
  validity_days: 30,
  design_settings: { ...DEFAULT_DESIGN_SETTINGS },
  show_vat: true,
  vat_rate: 17,
  is_active: true,
});
