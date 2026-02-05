// סוגי נתונים לעורך חוזים מתקדם

// מצב תצוגה
export type ViewMode = 'edit' | 'preview' | 'split';

// ערכת צבעים
export type ColorScheme = 'gold' | 'blue' | 'green' | 'purple';

// תבנית עיצוב
export type DesignTemplate = 'classic' | 'modern' | 'minimal';

// סוג בלוק
export type BlockType = 
  | 'header'
  | 'parties'
  | 'section'
  | 'items'
  | 'payments'
  | 'timeline'
  | 'terms'
  | 'signatures'
  | 'notes'
  | 'custom';

// בלוק במסמך
export interface ContractBlock {
  id: string;
  type: BlockType;
  title: string;
  content: any; // תוכן משתנה לפי סוג הבלוק
  visible: boolean;
  order: number;
  style?: BlockStyle;
}

// סגנון בלוק
export interface BlockStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  fontSize?: 'sm' | 'md' | 'lg';
  alignment?: 'right' | 'center' | 'left';
  padding?: 'sm' | 'md' | 'lg';
}

// תוכן כותרת
export interface HeaderContent {
  title: string;
  subtitle?: string;
  contractNumber?: string;
  date?: string;
  logoUrl?: string;
  location?: string;
}

// צד להסכם
export interface ContractParty {
  id: string;
  type: 'client' | 'provider' | 'other';
  name: string;
  idNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  representative?: string;
}

// תוכן צדדים
export interface PartiesContent {
  parties: ContractParty[];
}

// פריט בחוזה
export interface ContractItem {
  id: string;
  description: string;
  details?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  isOptional?: boolean;
  isUpgrade?: boolean;
}

// סעיף
export interface SectionContent {
  items: ContractItem[];
  showPrices?: boolean;
  showCheckmarks?: boolean;
}

// חבילת מחירים
export interface PricingTier {
  id: string;
  name: string;
  price: number;
  description?: string;
  features: string[];
  isRecommended?: boolean;
}

// תוכן פריטים/מחירים
export interface ItemsContent {
  tiers?: PricingTier[];
  items: ContractItem[];
  upgrades?: ContractItem[];
  totalPrice?: number;
  includesVat?: boolean;
}

// שלב תשלום
export interface PaymentStep {
  id: string;
  percentage: number;
  description: string;
  dueDate?: string;
  daysOffset?: number;
}

// תוכן תשלומים
export interface PaymentsContent {
  steps: PaymentStep[];
  paymentTerms?: string;
  currency?: string;
}

// שלב בלוח זמנים
export interface TimelineStep {
  id: string;
  number: number;
  title: string;
  description?: string;
  duration?: string;
}

// תוכן לוח זמנים
export interface TimelineContent {
  steps: TimelineStep[];
}

// תוכן תנאים
export interface TermsContent {
  terms: string[];
  specialClauses?: string[];
}

// חתימה
export interface SignatureField {
  id: string;
  label: string;
  partyId?: string;
  signed?: boolean;
  signedAt?: string;
  signatureUrl?: string;
}

// תוכן חתימות
export interface SignaturesContent {
  fields: SignatureField[];
  showDate?: boolean;
}

// הערה
export interface ContractNote {
  id: string;
  text: string;
  type?: 'info' | 'warning' | 'important';
}

// תוכן הערות
export interface NotesContent {
  notes: ContractNote[];
}

// תוכן מותאם אישית
export interface CustomContent {
  html: string;
}

// מסמך חוזה מלא
export interface ContractDocument {
  id?: string;
  title: string;
  colorScheme: ColorScheme;
  designTemplate: DesignTemplate;
  blocks: ContractBlock[];
  metadata: {
    createdAt?: string;
    updatedAt?: string;
    version?: number;
    status?: 'draft' | 'sent' | 'signed' | 'cancelled';
    validUntil?: string;
    clientId?: string;
    projectId?: string;
  };
  settings: {
    showHeader?: boolean;
    showFooter?: boolean;
    showPageNumbers?: boolean;
    darkMode?: boolean;
  };
}

// הגדרות צבעים
export const COLOR_SCHEMES: Record<ColorScheme, {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  gradient: string;
}> = {
  gold: {
    name: 'זהב',
    primary: '#DAA520',
    secondary: '#B8860B',
    accent: '#FFD700',
    background: '#FFFAF0',
    text: '#333333',
    gradient: 'linear-gradient(to left, #B8860B, #DAA520)',
  },
  blue: {
    name: 'כחול',
    primary: '#3B82F6',
    secondary: '#1D4ED8',
    accent: '#60A5FA',
    background: '#F0F9FF',
    text: '#1E3A5F',
    gradient: 'linear-gradient(to left, #1D4ED8, #3B82F6)',
  },
  green: {
    name: 'ירוק',
    primary: '#10B981',
    secondary: '#059669',
    accent: '#34D399',
    background: '#ECFDF5',
    text: '#064E3B',
    gradient: 'linear-gradient(to left, #059669, #10B981)',
  },
  purple: {
    name: 'סגול',
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    accent: '#A78BFA',
    background: '#FAF5FF',
    text: '#4C1D95',
    gradient: 'linear-gradient(to left, #7C3AED, #8B5CF6)',
  },
};

// תבניות עיצוב
export const DESIGN_TEMPLATES: Record<DesignTemplate, {
  name: string;
  description: string;
}> = {
  classic: {
    name: 'קלאסי',
    description: 'עיצוב מסורתי עם גבולות ברורים',
  },
  modern: {
    name: 'מודרני',
    description: 'עיצוב עכשווי עם צבעים נועזים',
  },
  minimal: {
    name: 'מינימליסטי',
    description: 'עיצוב נקי ופשוט',
  },
};

// סוגי בלוקים זמינים
export const AVAILABLE_BLOCKS: { type: BlockType; name: string; icon: string }[] = [
  { type: 'header', name: 'כותרת', icon: '📋' },
  { type: 'parties', name: 'צדדים', icon: '👥' },
  { type: 'section', name: 'סעיף', icon: '📝' },
  { type: 'items', name: 'פריטים/מחירים', icon: '💰' },
  { type: 'payments', name: 'תשלומים', icon: '💳' },
  { type: 'timeline', name: 'לוח זמנים', icon: '📅' },
  { type: 'terms', name: 'תנאים', icon: '⚖️' },
  { type: 'signatures', name: 'חתימות', icon: '✍️' },
  { type: 'notes', name: 'הערות', icon: '📌' },
  { type: 'custom', name: 'מותאם אישית', icon: '🔧' },
];
