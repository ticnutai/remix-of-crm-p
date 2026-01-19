// Quote Document Editor Types

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
  fontFamily: string;
  
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
