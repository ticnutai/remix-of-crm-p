export interface ContractDesign {
  id: string;
  name: string;
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headerBgColor: string;
  headerTextColor: string;
  
  // Typography
  fontFamily: string;
  headerFontFamily: string;
  fontSize: {
    title: string;
    subtitle: string;
    body: string;
    small: string;
  };
  
  // Spacing & Layout
  borderRadius: string;
  spacing: string;
  headerPadding: string;
  contentPadding: string;
  
  // Borders
  borderWidth: string;
  borderColor: string;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  
  // Logo
  logo?: {
    url: string;
    width: number;
    height: number;
    position: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  };
  
  // Sections styling
  sectionStyle: {
    backgroundColor: string;
    borderColor: string;
    titleColor: string;
    iconColor: string;
  };
  
  // Payment schedule styling
  paymentStyle: {
    backgroundColor: string;
    textColor: string;
    percentageColor: string;
  };
  
  // Notes styling
  notesStyle: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
  };
}

export const DEFAULT_DESIGN: ContractDesign = {
  id: 'default',
  name: 'ברירת מחדל',
  primaryColor: '#B8860B',
  secondaryColor: '#DAA520',
  accentColor: '#FFD700',
  backgroundColor: '#FFFFFF',
  textColor: '#333333',
  headerBgColor: 'linear-gradient(to left, #B8860B, #DAA520)',
  headerTextColor: '#FFFFFF',
  fontFamily: 'Arial, sans-serif',
  headerFontFamily: 'Arial, sans-serif',
  fontSize: {
    title: '28px',
    subtitle: '14px',
    body: '14px',
    small: '12px',
  },
  borderRadius: '12px',
  spacing: '20px',
  headerPadding: '30px',
  contentPadding: '40px',
  borderWidth: '1px',
  borderColor: '#E0E0E0',
  borderStyle: 'solid',
  sectionStyle: {
    backgroundColor: '#F5F5F5',
    borderColor: '#DAA520',
    titleColor: '#333333',
    iconColor: '#B8860B',
  },
  paymentStyle: {
    backgroundColor: '#F9F9F9',
    textColor: '#666666',
    percentageColor: '#B8860B',
  },
  notesStyle: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    textColor: '#666666',
    borderColor: '#E0E0E0',
  },
};

export const DESIGN_PRESETS: ContractDesign[] = [
  DEFAULT_DESIGN,
  {
    id: 'modern',
    name: 'מודרני',
    primaryColor: '#2563EB',
    secondaryColor: '#3B82F6',
    accentColor: '#60A5FA',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    headerBgColor: 'linear-gradient(135deg, #2563EB, #3B82F6)',
    headerTextColor: '#FFFFFF',
    fontFamily: 'Inter, system-ui, sans-serif',
    headerFontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      title: '32px',
      subtitle: '16px',
      body: '15px',
      small: '13px',
    },
    borderRadius: '16px',
    spacing: '24px',
    headerPadding: '40px',
    contentPadding: '48px',
    borderWidth: '2px',
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
    sectionStyle: {
      backgroundColor: '#F3F4F6',
      borderColor: '#3B82F6',
      titleColor: '#1F2937',
      iconColor: '#2563EB',
    },
    paymentStyle: {
      backgroundColor: '#EFF6FF',
      textColor: '#1F2937',
      percentageColor: '#2563EB',
    },
    notesStyle: {
      backgroundColor: '#FEF3C7',
      textColor: '#92400E',
      borderColor: '#FCD34D',
    },
  },
  {
    id: 'classic',
    name: 'קלאסי',
    primaryColor: '#1E293B',
    secondaryColor: '#334155',
    accentColor: '#64748B',
    backgroundColor: '#FAFAF9',
    textColor: '#0F172A',
    headerBgColor: '#1E293B',
    headerTextColor: '#F8FAFC',
    fontFamily: 'Georgia, serif',
    headerFontFamily: 'Georgia, serif',
    fontSize: {
      title: '30px',
      subtitle: '15px',
      body: '14px',
      small: '12px',
    },
    borderRadius: '4px',
    spacing: '18px',
    headerPadding: '32px',
    contentPadding: '40px',
    borderWidth: '1px',
    borderColor: '#CBD5E1',
    borderStyle: 'solid',
    sectionStyle: {
      backgroundColor: '#F1F5F9',
      borderColor: '#334155',
      titleColor: '#0F172A',
      iconColor: '#1E293B',
    },
    paymentStyle: {
      backgroundColor: '#E2E8F0',
      textColor: '#334155',
      percentageColor: '#1E293B',
    },
    notesStyle: {
      backgroundColor: '#FEF9C3',
      textColor: '#713F12',
      borderColor: '#D4D4A8',
    },
  },
  {
    id: 'minimal',
    name: 'מינימליסטי',
    primaryColor: '#000000',
    secondaryColor: '#171717',
    accentColor: '#404040',
    backgroundColor: '#FFFFFF',
    textColor: '#171717',
    headerBgColor: '#000000',
    headerTextColor: '#FFFFFF',
    fontFamily: 'Helvetica, Arial, sans-serif',
    headerFontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: {
      title: '26px',
      subtitle: '14px',
      body: '14px',
      small: '11px',
    },
    borderRadius: '0px',
    spacing: '16px',
    headerPadding: '24px',
    contentPadding: '32px',
    borderWidth: '1px',
    borderColor: '#E5E5E5',
    borderStyle: 'solid',
    sectionStyle: {
      backgroundColor: '#FAFAFA',
      borderColor: '#000000',
      titleColor: '#000000',
      iconColor: '#171717',
    },
    paymentStyle: {
      backgroundColor: '#F5F5F5',
      textColor: '#171717',
      percentageColor: '#000000',
    },
    notesStyle: {
      backgroundColor: '#F5F5F5',
      textColor: '#404040',
      borderColor: '#E5E5E5',
    },
  },
  {
    id: 'elegant',
    name: 'אלגנטי',
    primaryColor: '#7C3AED',
    secondaryColor: '#8B5CF6',
    accentColor: '#A78BFA',
    backgroundColor: '#FAFAF9',
    textColor: '#1C1917',
    headerBgColor: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
    headerTextColor: '#FFFFFF',
    fontFamily: 'Playfair Display, Georgia, serif',
    headerFontFamily: 'Playfair Display, Georgia, serif',
    fontSize: {
      title: '34px',
      subtitle: '16px',
      body: '15px',
      small: '13px',
    },
    borderRadius: '20px',
    spacing: '28px',
    headerPadding: '44px',
    contentPadding: '52px',
    borderWidth: '2px',
    borderColor: '#E7E5E4',
    borderStyle: 'solid',
    sectionStyle: {
      backgroundColor: '#FAF5FF',
      borderColor: '#8B5CF6',
      titleColor: '#581C87',
      iconColor: '#7C3AED',
    },
    paymentStyle: {
      backgroundColor: '#F3E8FF',
      textColor: '#581C87',
      percentageColor: '#7C3AED',
    },
    notesStyle: {
      backgroundColor: '#FEF3C7',
      textColor: '#78350F',
      borderColor: '#FDE68A',
    },
  },
];

export const FONT_OPTIONS = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Playfair Display, Georgia, serif', label: 'Playfair Display' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
];
