// Quote Document Editor Types

// Section text styling
export interface SectionTextStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  textAlign: "right" | "center" | "left" | "justify";
  fontWeight: "normal" | "bold";
  // Advanced typography
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  lineHeight?: number; // 1.0 - 3.0
  letterSpacing?: number; // px
  paragraphSpacing?: number; // px (margin-bottom)
  textIndent?: number; // px
  backgroundColor?: string; // highlight color, "" = none
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
}

export type SectionKey =
  | "header"
  | "companyInfo"
  | "quoteInfo"
  | "clientInfo"
  | "introduction"
  | "itemsTable"
  | "totals"
  | "terms"
  | "notes"
  | "signature";

export const DEFAULT_SECTION_STYLE: SectionTextStyle = {
  fontFamily: "Heebo",
  fontSize: 14,
  fontColor: "#000000",
  textAlign: "right",
  fontWeight: "normal",
  italic: false,
  underline: false,
  strikethrough: false,
  lineHeight: 1.6,
  letterSpacing: 0,
  paragraphSpacing: 0,
  textIndent: 0,
  backgroundColor: "",
  textTransform: "none",
};

// Style presets for quick formatting
export interface SectionStylePreset {
  id: string;
  label: string;
  description: string;
  style: Partial<SectionTextStyle>;
}

export const SECTION_STYLE_PRESETS: SectionStylePreset[] = [
  {
    id: "formal",
    label: "פורמלי",
    description: "מסמך עסקי קלאסי",
    style: {
      fontFamily: "Frank Ruhl Libre",
      fontSize: 14,
      fontColor: "#1a1a1a",
      fontWeight: "normal",
      lineHeight: 1.7,
      letterSpacing: 0,
    },
  },
  {
    id: "modern",
    label: "מודרני",
    description: "נקי ואוורירי",
    style: {
      fontFamily: "Heebo",
      fontSize: 14,
      fontColor: "#222222",
      fontWeight: "normal",
      lineHeight: 1.8,
      letterSpacing: 0.3,
    },
  },
  {
    id: "bold-title",
    label: "כותרת בולטת",
    description: "מודגש וגדול",
    style: {
      fontFamily: "Heebo",
      fontSize: 24,
      fontColor: "#162C58",
      fontWeight: "bold",
      lineHeight: 1.2,
      letterSpacing: -0.5,
    },
  },
  {
    id: "minimal",
    label: "מינימלי",
    description: "קטן ועדין",
    style: {
      fontFamily: "Assistant",
      fontSize: 12,
      fontColor: "#555555",
      fontWeight: "normal",
      lineHeight: 1.5,
      letterSpacing: 0,
    },
  },
];

export const HEBREW_FONTS: { value: string; label: string; category?: string }[] = [
  // System fonts (always available)
  { value: "Arial, sans-serif", label: "Arial", category: "מערכת" },
  { value: "'Times New Roman', serif", label: "Times New Roman", category: "מערכת" },
  { value: "Tahoma, sans-serif", label: "Tahoma", category: "מערכת" },
  { value: "Verdana, sans-serif", label: "Verdana", category: "מערכת" },
  { value: "Georgia, serif", label: "Georgia", category: "מערכת" },
  { value: "'David', serif", label: "David", category: "מערכת" },
  { value: "'Narkisim', serif", label: "Narkisim", category: "מערכת" },
  { value: "'FrankRuehl', serif", label: "Frank Ruehl (System)", category: "מערכת" },
  { value: "'Miriam', sans-serif", label: "Miriam", category: "מערכת" },
  { value: "'Courier New', monospace", label: "Courier New", category: "מערכת" },
  // Google Fonts - Sans-serif Hebrew
  { value: "Heebo", label: "Heebo", category: "Google Sans" },
  { value: "Assistant", label: "Assistant", category: "Google Sans" },
  { value: "Rubik", label: "Rubik", category: "Google Sans" },
  { value: "Alef", label: "Alef", category: "Google Sans" },
  { value: "Varela Round", label: "Varela Round", category: "Google Sans" },
  { value: "Open Sans Hebrew", label: "Open Sans Hebrew", category: "Google Sans" },
  { value: "Noto Sans Hebrew", label: "Noto Sans Hebrew", category: "Google Sans" },
  { value: "Miriam Libre", label: "Miriam Libre", category: "Google Sans" },
  { value: "M PLUS Rounded 1c", label: "M PLUS Rounded", category: "Google Sans" },
  // Google Fonts - Serif Hebrew
  { value: "David Libre", label: "David Libre", category: "Google Serif" },
  { value: "Frank Ruhl Libre", label: "Frank Ruhl Libre", category: "Google Serif" },
  { value: "Noto Serif Hebrew", label: "Noto Serif Hebrew", category: "Google Serif" },
  // Display / Decorative
  { value: "Secular One", label: "Secular One", category: "דקורטיבי" },
  { value: "Suez One", label: "Suez One", category: "דקורטיבי" },
  { value: "Amatic SC", label: "Amatic SC", category: "דקורטיבי" },
  { value: "Karantina", label: "Karantina", category: "דקורטיבי" },
  { value: "Bellefair", label: "Bellefair", category: "דקורטיבי" },
];

export interface DesignSettings3D {
  enabled: boolean;
  shadowDepth: number;
  shadowColor: string;
  borderRadius: number;
  gradient: boolean;
  gradientDirection:
    | "to-right"
    | "to-left"
    | "to-bottom"
    | "to-top"
    | "diagonal";
  elevation: "none" | "low" | "medium" | "high";
}

export interface AdvancedFontSettings {
  titleSize: number;
  bodySize: number;
  headerSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: "normal" | "medium" | "semibold" | "bold";
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: "text" | "number" | "date" | "textarea";
  position: "header" | "client" | "footer" | "items";
  visible: boolean;
}

export interface QuoteDocumentData {
  id?: string;
  title: string;
  quoteNumber: string;
  date: string;
  validUntil: string;

  // Company Info
  companyName: string;
  companyLogo?: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;

  // Client Info
  clientName: string;
  clientCompany?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;

  // Items
  items: QuoteDocumentItem[];

  // Totals
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  discount: number;
  discountType: "percent" | "fixed";
  total: number;

  // Content
  introduction?: string;
  terms?: string;
  notes?: string;
  footer?: string;

  // Styling
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily: string;

  // Advanced Design
  design3D?: DesignSettings3D;
  fontSettings?: AdvancedFontSettings;
  // Frame design (borders, background, section titles, fixed header/footer) - per-quote override
  frameDesign?: import("../QuoteTemplatesManager/frameStyles").FrameDesignSettings;

  // Section-specific text styles
  sectionStyles?: Partial<Record<SectionKey, SectionTextStyle>>;

  // Custom Fields
  customFields?: CustomField[];

  // Hidden Elements
  hiddenElements?: string[];

  // Logo settings
  logoSize?: number; // Width in pixels (default: 120)
  logoPosition?:
    | "inside-header"
    | "above-header"
    | "centered-above"
    | "full-width";
  showHeaderStrip?: boolean; // Show/hide the colored header strip

  // Sections visibility
  showLogo: boolean;
  showCompanyDetails: boolean;
  showClientDetails: boolean;
  showItemNumbers: boolean;
  showVat: boolean;
  showPaymentTerms: boolean;
  showSignature: boolean;
}

export interface QuoteDocumentItem {
  id: string;
  number: number;
  description: string;
  details?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  data: Partial<QuoteDocumentData>;
  isDefault?: boolean;
  createdAt: string;
}

export interface EditorTool {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  action: () => void;
  isActive?: boolean;
}

export type ViewMode = "edit" | "preview" | "split";
