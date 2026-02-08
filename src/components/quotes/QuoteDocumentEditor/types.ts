// Quote Document Editor Types

export interface DesignSettings3D {
  enabled: boolean;
  shadowDepth: number;
  shadowColor: string;
  borderRadius: number;
  gradient: boolean;
  gradientDirection: 'to-right' | 'to-left' | 'to-bottom' | 'to-top' | 'diagonal';
  elevation: 'none' | 'low' | 'medium' | 'high';
}

export interface AdvancedFontSettings {
  titleSize: number;
  bodySize: number;
  headerSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'number' | 'date' | 'textarea';
  position: 'header' | 'client' | 'footer' | 'items';
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
  discountType: 'percent' | 'fixed';
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
  
  // Custom Fields
  customFields?: CustomField[];
  
  // Hidden Elements
  hiddenElements?: string[];
  
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

export type ViewMode = 'edit' | 'preview' | 'split';
