// Advanced Document Editor Types
// Unified types for both Quotes and Contracts

export type DocumentType = 'quote' | 'contract';

// === ITEM TYPES ===
export interface DocumentItem {
  id: string;
  order: number;
  description: string;
  details?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  upgradePrice?: number; // תוספת מחיר אופציונלית
}

// === PRICING TIERS (חבילות מחיר) ===
export interface PricingTier {
  id: string;
  order: number;
  name: string;
  price: number;
  description?: string;
  features: string[];
  isRecommended?: boolean;
}

// === UPGRADES (שידרוגים ותוספות) ===
export interface Upgrade {
  id: string;
  order: number;
  name: string;
  price: number;
  description?: string;
}

// === SECTIONS (סעיפים) ===
export interface DocumentSection {
  id: string;
  order: number;
  title: string;
  icon?: string; // emoji or icon name
  items: DocumentItem[];
}

// === TIMELINE (לוח זמנים) ===
export interface TimelineStep {
  id: string;
  order: number;
  description: string;
  duration?: string;
}

export interface DocumentParty {
  id: string;
  type: 'company' | 'client' | 'contractor' | 'other';
  name: string;
  idNumber?: string;
  company?: string;
  address?: string;
  phone?: string;
  email?: string;
  role?: string; // e.g., "מזמין", "קבלן", "ערב"
}

export interface PaymentStep {
  id: string;
  order: number;
  description: string;
  percentage?: number;
  amount?: number;
  dueDate?: string;
  condition?: string;
  status?: 'pending' | 'paid' | 'overdue';
  paidAt?: string;
}

export interface SignatureData {
  id: string;
  partyId?: string;
  name: string;
  role?: string;
  signatureType: 'drawn' | 'typed' | 'image';
  signatureData: string;
  signedAt?: string;
  ipAddress?: string;
}

export interface DocumentSettings {
  // Display
  showLogo: boolean;
  showCompanyDetails: boolean;
  showClientDetails: boolean;
  showItemNumbers: boolean;
  showVat: boolean;
  showPaymentTerms: boolean;
  showSignatures: boolean;
  showWatermark: boolean;
  
  // Styling
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  
  // Layout
  paperSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: 'normal' | 'narrow' | 'wide';
}

export interface DocumentData {
  // Identity
  id?: string;
  type: DocumentType;
  number: string;
  title: string;
  subtitle?: string;
  location?: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'cancelled' | 'active' | 'completed';
  
  // Dates
  date: string;
  validUntil?: string;
  startDate?: string;
  endDate?: string;
  
  // Parties
  parties: DocumentParty[];
  
  // === PRICING STRUCTURE (מבנה תמחור מתקדם) ===
  pricingTiers: PricingTier[];   // חבילות מחיר
  upgrades: Upgrade[];           // שידרוגים ותוספות
  sections: DocumentSection[];   // סעיפים עם פריטים
  timeline: TimelineStep[];      // לוח זמנים
  importantNotes: string[];      // הערות חשובות
  
  // Financial (Legacy - for simple quotes)
  items: DocumentItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  discount: number;
  discountType: 'percent' | 'fixed';
  total: number;
  currency: string;
  
  // Payment
  paymentSteps: PaymentStep[];
  paymentTerms?: string;
  paymentMethod?: string;
  
  // Content
  introduction?: string;
  terms?: string;
  specialClauses?: string;
  notes?: string;
  footer?: string;
  
  // Signatures
  signatures: SignatureData[];
  
  // Branding
  branding: CompanyBranding;
  
  // Settings
  settings: DocumentSettings;
  
  // Template reference
  templateId?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  category: string;
  data: Partial<DocumentData>;
  thumbnail?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'edit' | 'preview' | 'split';

export type EditorPanel = 'branding' | 'settings' | 'pricing' | 'content' | 'items' | 'parties' | 'payments' | 'signatures';

export interface CompanyBranding {
  logo?: string;
  logoPosition: 'left' | 'center' | 'right';
  logoSize: 'small' | 'medium' | 'large';
  name: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  registrationNumber?: string; // ח.פ / ע.מ
  taxId?: string; // מספר עוסק
  bankDetails?: string;
}

export interface EditorState {
  viewMode: ViewMode;
  activePanel: EditorPanel;
  scale: number;
  sidebarCollapsed: boolean;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
}

// Default values
export const defaultCompanyBranding: CompanyBranding = {
  logo: '',
  logoPosition: 'right',
  logoSize: 'medium',
  name: '',
  tagline: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  registrationNumber: '',
  taxId: '',
  bankDetails: '',
};

export const defaultDocumentSettings: DocumentSettings = {
  showLogo: true,
  showCompanyDetails: true,
  showClientDetails: true,
  showItemNumbers: true,
  showVat: true,
  showPaymentTerms: true,
  showSignatures: true,
  showWatermark: false,
  primaryColor: '#1e3a5f',
  secondaryColor: '#d4a84b',
  accentColor: '#3b82f6',
  fontFamily: 'Heebo',
  fontSize: 'medium',
  paperSize: 'A4',
  orientation: 'portrait',
  margins: 'normal',
};

export const defaultDocumentData: DocumentData = {
  type: 'quote',
  number: '',
  title: '',
  subtitle: '',
  location: '',
  status: 'draft',
  date: new Date().toISOString().split('T')[0],
  parties: [],
  // New pricing structure
  pricingTiers: [],
  upgrades: [],
  sections: [],
  timeline: [],
  importantNotes: [],
  // Legacy items
  items: [],
  subtotal: 0,
  vatRate: 17,
  vatAmount: 0,
  discount: 0,
  discountType: 'percent',
  total: 0,
  currency: 'ILS',
  paymentSteps: [],
  signatures: [],
  branding: defaultCompanyBranding,
  settings: defaultDocumentSettings,
};
