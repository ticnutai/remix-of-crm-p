import { CustomColumn } from '@/components/tables/AddColumnDialog';

export interface ColumnTemplate {
  id: string;
  name: string;
  name_en: string;
  description: string;
  icon: string;
  color: string;
  category: 'contact' | 'address' | 'project' | 'finance' | 'custom';
  columns: Omit<CustomColumn, 'id' | 'table_name' | 'column_order'>[];
}

export const COLUMN_TEMPLATES: ColumnTemplate[] = [
  {
    id: 'contact-details',
    name: 'פרטי קשר מלאים',
    name_en: 'Full Contact Details',
    description: 'טלפון, אימייל, נייד, פקס',
    icon: 'Phone',
    color: '#3b82f6',
    category: 'contact',
    columns: [
      {
        column_key: 'phone',
        column_name: 'טלפון',
        column_type: 'text',
        is_required: false,
      },
      {
        column_key: 'mobile',
        column_name: 'נייד',
        column_type: 'text',
        is_required: false,
      },
      {
        column_key: 'email',
        column_name: 'אימייל',
        column_type: 'text',
        is_required: false,
      },
      {
        column_key: 'fax',
        column_name: 'פקס',
        column_type: 'text',
        is_required: false,
      },
    ],
  },
  {
    id: 'full-address',
    name: 'כתובת מלאה',
    name_en: 'Full Address',
    description: 'רחוב, עיר, מיקוד, מדינה',
    icon: 'MapPin',
    color: '#10b981',
    category: 'address',
    columns: [
      {
        column_key: 'street',
        column_name: 'רחוב',
        column_type: 'text',
        is_required: false,
      },
      {
        column_key: 'city',
        column_name: 'עיר',
        column_type: 'text',
        is_required: false,
      },
      {
        column_key: 'postal_code',
        column_name: 'מיקוד',
        column_type: 'text',
        is_required: false,
      },
      {
        column_key: 'country',
        column_name: 'מדינה',
        column_type: 'text',
        default_value: 'ישראל',
        is_required: false,
      },
    ],
  },
  {
    id: 'project-tracking',
    name: 'מעקב פרויקט',
    name_en: 'Project Tracking',
    description: 'סטטוס, עדיפות, תאריך יעד, אחוז התקדמות',
    icon: 'FolderKanban',
    color: '#f59e0b',
    category: 'project',
    columns: [
      {
        column_key: 'status',
        column_name: 'סטטוס',
        column_type: 'select',
        column_options: ['טרם התחיל', 'בתהליך', 'הושלם', 'מושהה', 'בוטל'],
        default_value: 'טרם התחיל',
        is_required: true,
      },
      {
        column_key: 'priority',
        column_name: 'עדיפות',
        column_type: 'select',
        column_options: ['נמוכה', 'בינונית', 'גבוהה', 'דחופה'],
        default_value: 'בינונית',
        is_required: false,
      },
      {
        column_key: 'due_date',
        column_name: 'תאריך יעד',
        column_type: 'date',
        is_required: false,
      },
      {
        column_key: 'progress',
        column_name: 'אחוז התקדמות',
        column_type: 'number',
        default_value: '0',
        is_required: false,
      },
    ],
  },
  {
    id: 'financial-info',
    name: 'מידע פיננסי',
    name_en: 'Financial Information',
    description: 'תקציב, עלות בפועל, סכום, מטבע',
    icon: 'DollarSign',
    color: '#8b5cf6',
    category: 'finance',
    columns: [
      {
        column_key: 'budget',
        column_name: 'תקציב',
        column_type: 'number',
        is_required: false,
      },
      {
        column_key: 'actual_cost',
        column_name: 'עלות בפועל',
        column_type: 'number',
        is_required: false,
      },
      {
        column_key: 'currency',
        column_name: 'מטבע',
        column_type: 'select',
        column_options: ['ILS', 'USD', 'EUR'],
        default_value: 'ILS',
        is_required: false,
      },
      {
        column_key: 'payment_terms',
        column_name: 'תנאי תשלום',
        column_type: 'text',
        is_required: false,
      },
    ],
  },
  {
    id: 'dates-timeline',
    name: 'לוח זמנים',
    name_en: 'Timeline',
    description: 'תאריך התחלה, סיום, אבני דרך',
    icon: 'CalendarRange',
    color: '#ec4899',
    category: 'project',
    columns: [
      {
        column_key: 'start_date',
        column_name: 'תאריך התחלה',
        column_type: 'date',
        is_required: false,
      },
      {
        column_key: 'end_date',
        column_name: 'תאריך סיום',
        column_type: 'date',
        is_required: false,
      },
      {
        column_key: 'milestone_date',
        column_name: 'אבן דרך',
        column_type: 'date',
        is_required: false,
      },
    ],
  },
  {
    id: 'team-assignment',
    name: 'הקצאת צוות',
    name_en: 'Team Assignment',
    description: 'מנהל פרויקט, צוות, מחלקה',
    icon: 'Users',
    color: '#06b6d4',
    category: 'project',
    columns: [
      {
        column_key: 'project_manager',
        column_name: 'מנהל פרויקט',
        column_type: 'data_type',
        data_type_id: 'employee',
        is_required: false,
      },
      {
        column_key: 'team_members',
        column_name: 'חברי צוות',
        column_type: 'data_type',
        data_type_id: 'employee',
        allow_multiple: true,
        is_required: false,
      },
      {
        column_key: 'department',
        column_name: 'מחלקה',
        column_type: 'select',
        column_options: ['פיתוח', 'עיצוב', 'שיווק', 'מכירות', 'תמיכה'],
        is_required: false,
      },
    ],
  },
  {
    id: 'quality-feedback',
    name: 'איכות ומשוב',
    name_en: 'Quality & Feedback',
    description: 'דירוג, הערות, משוב לקוח',
    icon: 'Star',
    color: '#eab308',
    category: 'custom',
    columns: [
      {
        column_key: 'rating',
        column_name: 'דירוג',
        column_type: 'rating',
        max_rating: 5,
        is_required: false,
      },
      {
        column_key: 'feedback',
        column_name: 'משוב',
        column_type: 'rich_text',
        is_required: false,
      },
      {
        column_key: 'approved',
        column_name: 'אושר',
        column_type: 'boolean',
        default_value: 'false',
        is_required: false,
      },
    ],
  },
  {
    id: 'documents',
    name: 'מסמכים',
    name_en: 'Documents',
    description: 'קבצים מצורפים, מסמכים',
    icon: 'FileText',
    color: '#64748b',
    category: 'custom',
    columns: [
      {
        column_key: 'contract',
        column_name: 'חוזה',
        column_type: 'file',
        is_required: false,
      },
      {
        column_key: 'invoice',
        column_name: 'חשבונית',
        column_type: 'file',
        is_required: false,
      },
      {
        column_key: 'attachments',
        column_name: 'קבצים מצורפים',
        column_type: 'file',
        allow_multiple: true,
        is_required: false,
      },
    ],
  },
  {
    id: 'social-media',
    name: 'רשתות חברתיות',
    name_en: 'Social Media',
    description: 'לינקדאין, פייסבוק, טוויטר, אינסטגרם',
    icon: 'Share2',
    color: '#3b82f6',
    category: 'contact',
    columns: [
      {
        column_key: 'linkedin',
        column_name: 'LinkedIn',
        column_type: 'text',
        is_required: false,
      },
      {
        column_key: 'facebook',
        column_name: 'Facebook',
        column_type: 'text',
        is_required: false,
      },
      {
        column_key: 'twitter',
        column_name: 'Twitter',
        column_type: 'text',
        is_required: false,
      },
      {
        column_key: 'instagram',
        column_name: 'Instagram',
        column_type: 'text',
        is_required: false,
      },
    ],
  },
  {
    id: 'business-info',
    name: 'פרטי עסק',
    name_en: 'Business Information',
    description: 'חברה, תפקיד, אתר, ח.פ.',
    icon: 'Building2',
    color: '#14b8a6',
    category: 'contact',
    columns: [
      {
        column_key: 'company',
        column_name: 'שם חברה',
        column_type: 'text',
        is_required: false,
      },
      {
        column_key: 'job_title',
        column_name: 'תפקיד',
        column_type: 'text',
        is_required: false,
      },
      {
        column_key: 'website',
        column_name: 'אתר אינטרנט',
        column_type: 'text',
        is_required: false,
      },
      {
        column_key: 'tax_id',
        column_name: 'ח.פ. / ע.מ.',
        column_type: 'text',
        is_required: false,
      },
    ],
  },
];

export const TEMPLATE_CATEGORIES = [
  { value: 'contact', label: 'קשר ותקשורת', icon: 'Phone', color: '#3b82f6' },
  { value: 'address', label: 'כתובות', icon: 'MapPin', color: '#10b981' },
  { value: 'project', label: 'ניהול פרויקטים', icon: 'FolderKanban', color: '#f59e0b' },
  { value: 'finance', label: 'פיננסים', icon: 'DollarSign', color: '#8b5cf6' },
  { value: 'custom', label: 'כללי', icon: 'Sparkles', color: '#64748b' },
];
