// Quotes Pro — מודל הנתונים (block-based, schema-driven)
// מנותק לחלוטין מהמערכת הישנה. ראו docs/quotes-pro/00-spec.md

// ============================================================
// קטגוריות
// ============================================================
export type QPCategory =
  | "construction"
  | "development"
  | "design"
  | "renovation"
  | "consulting"
  | "other";

export const QP_CATEGORIES: Array<{ value: QPCategory; label: string }> = [
  { value: "construction", label: "בנייה" },
  { value: "development", label: "היתר בנייה" },
  { value: "design", label: "תכנון פנים" },
  { value: "renovation", label: "שיפוץ" },
  { value: "consulting", label: "פיקוח / ייעוץ" },
  { value: "other", label: "אחר" },
];

// ============================================================
// Theme — עיצוב גלובלי למסמך
// ============================================================
export interface QPTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  /** מפתח legacy ("default"/"modern"/"classic"/"elegant") או font-family CSS מלא */
  fontFamily: string;
  fontScale: "small" | "medium" | "large";
  borderStyle: "none" | "simple" | "rounded" | "shadow";
  tableStyle: "simple" | "striped" | "bordered" | "modern";
  sectionDivider: "none" | "line" | "dots" | "gradient";
  backgroundPattern: "none" | "dots" | "lines" | "grid" | "geometric";
  watermark?: { text: string; opacity: number } | null;
  footer: "minimal" | "detailed" | "branded";
}

export interface QPPageSettings {
  size: "A4";
  orientation: "portrait" | "landscape";
  // שוליים במ"מ
  margins: { top: number; right: number; bottom: number; left: number };
}

// ============================================================
// קטלוג גופנים — מערכת (ללא טעינה) + Google Fonts עבריים
// value = font-family CSS; google = שם המשפחה לטעינה מ-Google Fonts
// ============================================================
export interface QPFontOption {
  value: string;
  label: string;
  google?: string;
}

export const QP_FONTS: QPFontOption[] = [
  { value: "default", label: "ברירת מחדל (Assistant)" },
  // Google Fonts עבריים
  { value: "'Heebo', sans-serif", label: "Heebo", google: "Heebo" },
  { value: "'Assistant', sans-serif", label: "Assistant", google: "Assistant" },
  { value: "'Rubik', sans-serif", label: "Rubik", google: "Rubik" },
  { value: "'Alef', sans-serif", label: "Alef", google: "Alef" },
  { value: "'Varela Round', sans-serif", label: "Varela Round", google: "Varela+Round" },
  { value: "'Noto Sans Hebrew', sans-serif", label: "Noto Sans Hebrew", google: "Noto+Sans+Hebrew" },
  { value: "'Miriam Libre', sans-serif", label: "Miriam Libre", google: "Miriam+Libre" },
  { value: "'M PLUS Rounded 1c', sans-serif", label: "M PLUS Rounded", google: "M+PLUS+Rounded+1c" },
  { value: "'David Libre', serif", label: "David Libre", google: "David+Libre" },
  { value: "'Frank Ruhl Libre', serif", label: "Frank Ruhl Libre", google: "Frank+Ruhl+Libre" },
  { value: "'Noto Serif Hebrew', serif", label: "Noto Serif Hebrew", google: "Noto+Serif+Hebrew" },
  { value: "'Secular One', sans-serif", label: "Secular One", google: "Secular+One" },
  { value: "'Suez One', serif", label: "Suez One", google: "Suez+One" },
  { value: "'Amatic SC', cursive", label: "Amatic SC", google: "Amatic+SC" },
  { value: "'Karantina', sans-serif", label: "Karantina", google: "Karantina" },
  { value: "'Bellefair', serif", label: "Bellefair", google: "Bellefair" },
  // גופני מערכת (ללא טעינה)
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'David', serif", label: "David (מערכת)" },
  { value: "'Narkisim', serif", label: "Narkisim" },
  { value: "'Miriam', sans-serif", label: "Miriam" },
  { value: "'Courier New', monospace", label: "Courier New" },
];

// ============================================================
// סטריפים — פסי כותרת עליון/תחתון החוזרים בכל עמוד A4
// ============================================================
export interface QPStrip {
  enabled: boolean;
  height: number; // מ"מ
  bgColor: string;
  logoUrl?: string | null;
  logoHeight?: number; // px
  logoAlign?: QPTextAlign;
  text?: string;
  textColor?: string;
  showPageNumber?: boolean; // הצגת מספור עמוד (בעיקר בפוטר)
}

export interface QPStrips {
  header: QPStrip;
  footer: QPStrip;
}

// ============================================================
// תצורת תמחור ומטא-דאטה
// ============================================================
export interface QPPricingConfig {
  currency: string; // "₪"
  showVat: boolean;
  vatRate: number; // 18
  /** breakdown = פירוט מע"מ (ביניים/מע"מ/סה"כ) ; plus-vat = מחיר + "מע"מ" */
  vatDisplay: "breakdown" | "plus-vat";
}

export interface QPDocMeta {
  quoteNumber?: string;
  clientId?: string | null;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientCompany?: string;
  projectName?: string;
  projectAddress?: string;
  gush?: string;
  helka?: string;
  migrash?: string;
  taba?: string; // תב"ע
  issueDate?: string; // ISO
}

// ============================================================
// בלוקים
// ============================================================
export type QPBlockType =
  | "header"
  | "stages"
  | "priceTable"
  | "paymentSchedule"
  | "timeline"
  | "richText"
  | "importantNotes"
  | "pricingTiers"
  | "upgrades"
  | "signature"
  | "spacer"
  | "image"
  | "html";

export type QPTextAlign = "right" | "center" | "left";

/** override עיצוב ספציפי לבלוק (יורש מ-theme אם חסר) */
export interface QPBlockStyle {
  backgroundColor: string;
  textColor: string;
  paddingTop: number; // px
  paddingBottom: number; // px
  align: QPTextAlign;
}

export interface QPBlockBase {
  id: string;
  type: QPBlockType;
  style?: Partial<QPBlockStyle>;
  keepTogether?: boolean; // break-inside: avoid
  pageBreakBefore?: boolean; // התחל בעמוד חדש
  hidden?: boolean;
}

// ---- Header ----
export interface QPHeaderBlock extends QPBlockBase {
  type: "header";
  logoUrl?: string | null;
  companyName: string;
  subtitle?: string;
  contact: {
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
  };
  variant: "gradient" | "solid" | "minimal" | "modern" | "classic";
  height: "compact" | "normal" | "large";
}

// ---- Stages ----
export interface QPStageItemFmt {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: QPTextAlign;
}

export interface QPStageItem {
  id: string;
  text: string;
  isSpacer?: boolean;
  icon?: string;
  iconColor?: string;
  fmt?: QPStageItemFmt;
}

export interface QPStage {
  id: string;
  name: string;
  icon?: string;
  iconColor?: string;
  isSection?: boolean;
  itemDisplayMode: "check" | "numbered" | "bullet" | "none";
  itemDisplayColor?: string;
  items: QPStageItem[];
}

export interface QPStagesBlock extends QPBlockBase {
  type: "stages";
  title?: string;
  stages: QPStage[];
}

// ---- PriceTable ----
export interface QPPriceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface QPPriceTableBlock extends QPBlockBase {
  type: "priceTable";
  title?: string;
  showVat: boolean;
  columns: { qty: boolean; unit: boolean; unitPrice: boolean; total: boolean };
  items: QPPriceItem[];
}

// ---- PaymentSchedule ----
export interface QPPaymentStep {
  id: string;
  percentage: number;
  description: string;
  /** קישור לשלב עבודה מבלוק ה-stages (חיבור לשלבי תשלום) */
  stageId?: string | null;
  stageName?: string;
  /** מתי התשלום נדרש: ידני / עם השלמת השלב */
  triggerMode?: "manual" | "stage_completion";
}

export interface QPPaymentScheduleBlock extends QPBlockBase {
  type: "paymentSchedule";
  title?: string;
  /** הצג סכום בכסף לצד האחוז (מחושב מסך הבסיס) */
  showAmounts?: boolean;
  steps: QPPaymentStep[];
}

// ---- Timeline ----
export interface QPTimelineStep {
  id: string;
  title: string;
  duration?: string;
}

export interface QPTimelineBlock extends QPBlockBase {
  type: "timeline";
  title?: string;
  steps: QPTimelineStep[];
}

// ---- RichText ----
export interface QPRichTextBlock extends QPBlockBase {
  type: "richText";
  html: string; // sanitized HTML, לא מסמך שלם
}

// ---- ImportantNotes ----
export interface QPImportantNotesBlock extends QPBlockBase {
  type: "importantNotes";
  title?: string;
  notes: string[];
}

// ---- PricingTiers ----
export interface QPPricingTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  highlighted?: boolean;
}

export interface QPPricingTiersBlock extends QPBlockBase {
  type: "pricingTiers";
  title?: string;
  tiers: QPPricingTier[];
}

// ---- Upgrades ----
export interface QPUpgradeItem {
  id: string;
  name: string;
  price: number;
  selected?: boolean;
}

export interface QPUpgradesBlock extends QPBlockBase {
  type: "upgrades";
  title?: string;
  items: QPUpgradeItem[];
}

// ---- Signature ----
export interface QPSignatureParty {
  label: string;
  nameLine?: boolean;
  dateLine?: boolean;
}

export interface QPSignatureBlock extends QPBlockBase {
  type: "signature";
  parties: QPSignatureParty[];
}

// ---- Spacer / Image / Html ----
export interface QPSpacerBlock extends QPBlockBase {
  type: "spacer";
  height: number; // מ"מ
}

export interface QPImageBlock extends QPBlockBase {
  type: "image";
  url: string;
  width?: number; // px
  align?: QPTextAlign;
}

export interface QPHtmlBlock extends QPBlockBase {
  type: "html";
  html: string; // מילוט מלא (תאימות-לאחור / מקרי קצה)
}

export type QPBlock =
  | QPHeaderBlock
  | QPStagesBlock
  | QPPriceTableBlock
  | QPPaymentScheduleBlock
  | QPTimelineBlock
  | QPRichTextBlock
  | QPImportantNotesBlock
  | QPPricingTiersBlock
  | QPUpgradesBlock
  | QPSignatureBlock
  | QPSpacerBlock
  | QPImageBlock
  | QPHtmlBlock;

// ============================================================
// מסמך + תיקייה + גרסה
// ============================================================
export interface QPDocument {
  id: string;
  name: string;
  description?: string;
  category: QPCategory;
  folder_id: string | null;

  blocks: QPBlock[];

  theme_id: string | null;
  theme: QPTheme;
  page: QPPageSettings;
  strips: QPStrips;

  pricing: QPPricingConfig;
  validity_days: number;
  meta: QPDocMeta;

  is_active: boolean;
  is_public?: boolean;
  share_token?: string;
  created_at: string;
  updated_at: string;
}

export interface QPFolder {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface QPThemePreset {
  id: string;
  name: string;
  theme: QPTheme;
  created_at: string;
}

export interface QPVersion {
  id: string;
  document_id: string;
  version_number: number;
  label: string;
  snapshot: Partial<QPDocument>;
  created_at: string;
}
