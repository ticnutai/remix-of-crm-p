// Quote Document Editor Types

// Section text styling
export interface SectionTextStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  textAlign: "right" | "center" | "left";
  fontWeight: "normal" | "bold";
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
};

export const HEBREW_FONTS = [
  { value: "Heebo", label: "Heebo" },
  { value: "Assistant", label: "Assistant" },
  { value: "Rubik", label: "Rubik" },
  { value: "Alef", label: "Alef" },
  { value: "David Libre", label: "David Libre" },
  { value: "Frank Ruhl Libre", label: "Frank Ruhl Libre" },
  { value: "Varela Round", label: "Varela Round" },
  { value: "Open Sans Hebrew", label: "Open Sans" },
  { value: "Noto Sans Hebrew", label: "Noto Sans Hebrew" },
  { value: "Secular One", label: "Secular One" },
  { value: "Suez One", label: "Suez One" },
  { value: "Amatic SC", label: "Amatic SC" },
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

  // Section-specific text styles
  sectionStyles?: Partial<Record<SectionKey, SectionTextStyle>>;

  // Custom Fields
  customFields?: CustomField[];

  // Hidden Elements
  hiddenElements?: string[];

  // Logo settings
  logoSize?: number; // Width in pixels (default: 120)
  logoPosition?: 'inside-header' | 'above-header' | 'centered-above' | 'full-width';
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
