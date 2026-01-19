import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  Save,
  Loader2,
  MessageSquare,
  Mail,
  Phone,
  CreditCard,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Cloud,
  Database,
  Calendar,
  Sheet,
  HardDrive,
  Webhook,
  Bot,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ServiceConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: 'communication' | 'google' | 'backend' | 'finance' | 'ai' | 'automation' | 'storage';
  fields: {
    key: string;
    label: string;
    placeholder: string;
    type: 'text' | 'password';
    required: boolean;
    helpUrl?: string;
  }[];
  docUrl?: string;
}

interface ApiKeyEntry {
  serviceId: string;
  values: Record<string, string>;
  isConfigured: boolean;
  lastUpdated?: string;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  all: { label: 'הכל', icon: <Key className="h-4 w-4" /> },
  communication: { label: 'תקשורת', icon: <MessageSquare className="h-4 w-4" /> },
  google: { label: 'Google', icon: <Cloud className="h-4 w-4" /> },
  backend: { label: 'בסיס נתונים', icon: <Database className="h-4 w-4" /> },
  finance: { label: 'פיננסים', icon: <CreditCard className="h-4 w-4" /> },
  ai: { label: 'בינה מלאכותית', icon: <Bot className="h-4 w-4" /> },
  automation: { label: 'אוטומציות', icon: <Zap className="h-4 w-4" /> },
  storage: { label: 'אחסון', icon: <Cloud className="h-4 w-4" /> },
};

const SERVICES: ServiceConfig[] = [
  // Communication Services
  {
    id: 'twilio',
    name: 'Twilio',
    icon: <MessageSquare className="h-5 w-5" />,
    description: 'שליחת SMS והודעות WhatsApp',
    docUrl: 'https://www.twilio.com/docs',
    category: 'communication',
    fields: [
      { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'text', required: true },
      { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password', required: true },
      { key: 'TWILIO_PHONE_NUMBER', label: 'Phone Number (SMS)', placeholder: '+1234567890', type: 'text', required: true },
      { key: 'TWILIO_WHATSAPP_NUMBER', label: 'WhatsApp Number', placeholder: '+1234567890', type: 'text', required: false },
    ],
  },
  {
    id: 'whatsapp_business',
    name: 'WhatsApp Business API',
    icon: <Phone className="h-5 w-5" />,
    description: 'שליחת הודעות ישירות דרך WhatsApp Business',
    docUrl: 'https://developers.facebook.com/docs/whatsapp',
    category: 'communication',
    fields: [
      { key: 'WHATSAPP_PHONE_NUMBER_ID', label: 'Phone Number ID', placeholder: '1234567890', type: 'text', required: true },
      { key: 'WHATSAPP_BUSINESS_ACCOUNT_ID', label: 'Business Account ID', placeholder: '1234567890', type: 'text', required: true },
      { key: 'WHATSAPP_ACCESS_TOKEN', label: 'Access Token', placeholder: 'EAAxxxxxxxxxx', type: 'password', required: true },
      { key: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', label: 'Webhook Verify Token', placeholder: 'your-verify-token', type: 'password', required: false },
    ],
  },
  {
    id: 'resend',
    name: 'Resend',
    icon: <Mail className="h-5 w-5" />,
    description: 'שליחת אימיילים',
    docUrl: 'https://resend.com/docs',
    category: 'communication',
    fields: [
      { key: 'RESEND_API_KEY', label: 'API Key', placeholder: 're_xxxxxxxxxx', type: 'password', required: true },
      { key: 'RESEND_FROM_EMAIL', label: 'From Email', placeholder: 'noreply@yourdomain.com', type: 'text', required: false },
    ],
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    icon: <Mail className="h-5 w-5" />,
    description: 'שליחת אימיילים (אלטרנטיבה)',
    docUrl: 'https://docs.sendgrid.com',
    category: 'communication',
    fields: [
      { key: 'SENDGRID_API_KEY', label: 'API Key', placeholder: 'SG.xxxxxxxxxx', type: 'password', required: true },
      { key: 'SENDGRID_FROM_EMAIL', label: 'From Email', placeholder: 'noreply@yourdomain.com', type: 'text', required: false },
    ],
  },
  
  // Google Services
  {
    id: 'google',
    name: 'Google APIs',
    icon: <Cloud className="h-5 w-5" />,
    description: 'Google Sheets, Calendar, Drive ועוד',
    docUrl: 'https://console.developers.google.com',
    category: 'google',
    fields: [
      { key: 'GOOGLE_CLIENT_ID', label: 'Client ID', placeholder: 'xxxxx.apps.googleusercontent.com', type: 'text', required: true },
      { key: 'GOOGLE_CLIENT_SECRET', label: 'Client Secret', placeholder: 'GOCSPX-xxxxxxxxxx', type: 'password', required: true },
      { key: 'GOOGLE_API_KEY', label: 'API Key', placeholder: 'AIzaxxxxxxxxxx', type: 'password', required: false },
      { key: 'GOOGLE_REFRESH_TOKEN', label: 'Refresh Token', placeholder: '1//xxxxxxxxxx', type: 'password', required: false },
    ],
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    icon: <Sheet className="h-5 w-5" />,
    description: 'סנכרון עם גיליונות Google',
    docUrl: 'https://developers.google.com/sheets/api',
    category: 'google',
    fields: [
      { key: 'GOOGLE_SHEETS_SPREADSHEET_ID', label: 'Spreadsheet ID', placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', type: 'text', required: true },
      { key: 'GOOGLE_SHEETS_SHEET_NAME', label: 'Sheet Name', placeholder: 'Sheet1', type: 'text', required: false },
    ],
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    icon: <HardDrive className="h-5 w-5" />,
    description: 'העלאת קבצים ל-Google Drive',
    docUrl: 'https://developers.google.com/drive/api',
    category: 'google',
    fields: [
      { key: 'GOOGLE_DRIVE_FOLDER_ID', label: 'Folder ID', placeholder: '1BxiMVs0XRA5nFMdKvBdBZjg', type: 'text', required: false },
    ],
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    icon: <Calendar className="h-5 w-5" />,
    description: 'סנכרון פגישות עם יומן Google',
    docUrl: 'https://developers.google.com/calendar/api',
    category: 'google',
    fields: [
      { key: 'GOOGLE_CALENDAR_ID', label: 'Calendar ID', placeholder: 'primary', type: 'text', required: false },
    ],
  },
  
  // Database & Backend
  {
    id: 'supabase',
    name: 'Supabase',
    icon: <Database className="h-5 w-5" />,
    description: 'בסיס נתונים ואימות',
    docUrl: 'https://supabase.com/docs',
    category: 'backend',
    fields: [
      { key: 'SUPABASE_URL', label: 'Project URL', placeholder: 'https://xxxxx.supabase.co', type: 'text', required: true },
      { key: 'SUPABASE_ANON_KEY', label: 'Anon/Public Key', placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', type: 'password', required: true },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service Role Key', placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', type: 'password', required: false },
    ],
  },
  
  // Finance
  {
    id: 'green_invoice',
    name: 'Green Invoice',
    icon: <FileText className="h-5 w-5" />,
    description: 'הנפקת חשבוניות',
    docUrl: 'https://www.greeninvoice.co.il/api-docs',
    category: 'finance',
    fields: [
      { key: 'GREEN_INVOICE_API_KEY', label: 'API Key', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'password', required: true },
      { key: 'GREEN_INVOICE_API_SECRET', label: 'API Secret', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx', type: 'password', required: true },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'עיבוד תשלומים',
    docUrl: 'https://stripe.com/docs',
    category: 'finance',
    fields: [
      { key: 'STRIPE_SECRET_KEY', label: 'Secret Key', placeholder: 'sk_live_xxxxxxxxxx', type: 'password', required: true },
      { key: 'STRIPE_PUBLISHABLE_KEY', label: 'Publishable Key', placeholder: 'pk_live_xxxxxxxxxx', type: 'text', required: true },
      { key: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook Secret', placeholder: 'whsec_xxxxxxxxxx', type: 'password', required: false },
    ],
  },
  {
    id: 'payplus',
    name: 'PayPlus',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'סליקת אשראי ישראלית',
    docUrl: 'https://www.payplus.co.il/api',
    category: 'finance',
    fields: [
      { key: 'PAYPLUS_API_KEY', label: 'API Key', placeholder: 'xxxxxxxxxxxxxxxx', type: 'password', required: true },
      { key: 'PAYPLUS_SECRET_KEY', label: 'Secret Key', placeholder: 'xxxxxxxxxxxxxxxx', type: 'password', required: true },
      { key: 'PAYPLUS_TERMINAL_UID', label: 'Terminal UID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text', required: false },
    ],
  },
  
  // AI & Automation
  {
    id: 'openai',
    name: 'OpenAI',
    icon: <Bot className="h-5 w-5" />,
    description: 'בינה מלאכותית GPT',
    docUrl: 'https://platform.openai.com/docs',
    category: 'ai',
    fields: [
      { key: 'OPENAI_API_KEY', label: 'API Key', placeholder: 'sk-xxxxxxxxxx', type: 'password', required: true },
      { key: 'OPENAI_ORG_ID', label: 'Organization ID', placeholder: 'org-xxxxxxxxxx', type: 'text', required: false },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    icon: <Bot className="h-5 w-5" />,
    description: 'בינה מלאכותית Claude',
    docUrl: 'https://docs.anthropic.com',
    category: 'ai',
    fields: [
      { key: 'ANTHROPIC_API_KEY', label: 'API Key', placeholder: 'sk-ant-xxxxxxxxxx', type: 'password', required: true },
    ],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    icon: <Zap className="h-5 w-5" />,
    description: 'אוטומציות וחיבורים',
    docUrl: 'https://zapier.com/developer',
    category: 'automation',
    fields: [
      { key: 'ZAPIER_WEBHOOK_URL', label: 'Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/xxxxx/xxxxx/', type: 'text', required: true },
    ],
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    icon: <Webhook className="h-5 w-5" />,
    description: 'אוטומציות מתקדמות',
    docUrl: 'https://www.make.com/en/api-documentation',
    category: 'automation',
    fields: [
      { key: 'MAKE_WEBHOOK_URL', label: 'Webhook URL', placeholder: 'https://hook.eu1.make.com/xxxxx', type: 'text', required: true },
      { key: 'MAKE_API_TOKEN', label: 'API Token', placeholder: 'xxxxxxxxxxxxxxxx', type: 'password', required: false },
    ],
  },
  
  // Storage
  {
    id: 'cloudinary',
    name: 'Cloudinary',
    icon: <Cloud className="h-5 w-5" />,
    description: 'אחסון והמרת מדיה',
    docUrl: 'https://cloudinary.com/documentation',
    category: 'storage',
    fields: [
      { key: 'CLOUDINARY_CLOUD_NAME', label: 'Cloud Name', placeholder: 'your-cloud-name', type: 'text', required: true },
      { key: 'CLOUDINARY_API_KEY', label: 'API Key', placeholder: '123456789012345', type: 'text', required: true },
      { key: 'CLOUDINARY_API_SECRET', label: 'API Secret', placeholder: 'xxxxxxxxxx', type: 'password', required: true },
    ],
  },
  {
    id: 'aws_s3',
    name: 'AWS S3',
    icon: <Cloud className="h-5 w-5" />,
    description: 'אחסון קבצים בענן',
    docUrl: 'https://docs.aws.amazon.com/s3',
    category: 'storage',
    fields: [
      { key: 'AWS_ACCESS_KEY_ID', label: 'Access Key ID', placeholder: 'AKIAxxxxxxxxxx', type: 'text', required: true },
      { key: 'AWS_SECRET_ACCESS_KEY', label: 'Secret Access Key', placeholder: 'xxxxxxxxxxxxxxxx', type: 'password', required: true },
      { key: 'AWS_S3_BUCKET', label: 'Bucket Name', placeholder: 'my-bucket', type: 'text', required: true },
      { key: 'AWS_S3_REGION', label: 'Region', placeholder: 'eu-west-1', type: 'text', required: false },
    ],
  },
];

// Get existing secrets from Supabase secrets that are already configured
const EXISTING_SECRETS = new Set([
  'GREEN_INVOICE_API_KEY', 
  'GREEN_INVOICE_API_SECRET', 
  'RESEND_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
]);

// Get values from environment variables that are available in the frontend
const getEnvValues = (): Record<string, string> => {
  const values: Record<string, string> = {};
  
  // Supabase (available in frontend via VITE_)
  if (import.meta.env.VITE_SUPABASE_URL) {
    values['SUPABASE_URL'] = import.meta.env.VITE_SUPABASE_URL;
  }
  if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
    values['SUPABASE_ANON_KEY'] = import.meta.env.VITE_SUPABASE_ANON_KEY;
  } else if (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    values['SUPABASE_ANON_KEY'] = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  }
  
  return values;
};

// Pre-populated values for services known to be configured in Supabase Edge Functions
const PRECONFIGURED_SERVICES: Record<string, { configured: boolean; note?: string }> = {
  'supabase': { configured: true, note: 'מוגדר ב-.env' },
  'resend': { configured: true, note: 'מוגדר ב-Supabase Secrets' },
  'green_invoice': { configured: true, note: 'מוגדר ב-Supabase Secrets' },
};

interface ApiKeysManagerProps {
  readonly isUnlocked: boolean;
}

export function ApiKeysManager({ isUnlocked }: ApiKeysManagerProps) {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [editingService, setEditingService] = useState<ServiceConfig | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load saved API keys from localStorage (in real app, would be encrypted on server)
  useEffect(() => {
    const envValues = getEnvValues();
    const saved = localStorage.getItem('crm_api_keys');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with env values
        const merged = parsed.map((entry: ApiKeyEntry) => {
          if (entry.serviceId === 'supabase') {
            return {
              ...entry,
              values: { ...entry.values, ...envValues },
              isConfigured: true,
            };
          }
          // Check if pre-configured in Supabase
          if (PRECONFIGURED_SERVICES[entry.serviceId]?.configured) {
            return {
              ...entry,
              isConfigured: true,
            };
          }
          return entry;
        });
        setApiKeys(merged);
      } catch (e) {
        console.error('Failed to parse saved API keys');
        initializeApiKeys(envValues);
      }
    } else {
      initializeApiKeys(envValues);
    }
  }, []);

  const initializeApiKeys = (envValues: Record<string, string>) => {
    // Initialize with existing secrets marked as configured
    const initialKeys: ApiKeyEntry[] = SERVICES.map(service => {
      const hasExisting = service.fields.some(f => EXISTING_SECRETS.has(f.key));
      const isPreconfigured = PRECONFIGURED_SERVICES[service.id]?.configured;
      
      // Get values from env for this service
      const serviceValues: Record<string, string> = {};
      service.fields.forEach(field => {
        if (envValues[field.key]) {
          serviceValues[field.key] = envValues[field.key];
        }
      });
      
      return {
        serviceId: service.id,
        values: serviceValues,
        isConfigured: hasExisting || isPreconfigured || Object.keys(serviceValues).length > 0,
        lastUpdated: (hasExisting || isPreconfigured) ? new Date().toISOString() : undefined,
      };
    });
    setApiKeys(initialKeys);
    localStorage.setItem('crm_api_keys', JSON.stringify(initialKeys));
  };

  const toggleFieldVisibility = (fieldKey: string) => {
    setVisibleFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
  };

  const getServiceStatus = (serviceId: string): { configured: boolean; partial: boolean } => {
    const service = SERVICES.find(s => s.id === serviceId);
    const entry = apiKeys.find(k => k.serviceId === serviceId);
    
    if (!service || !entry) return { configured: false, partial: false };
    
    // Check if required fields from existing secrets are present
    const existingConfigured = service.fields.some(f => EXISTING_SECRETS.has(f.key));
    
    const requiredFields = service.fields.filter(f => f.required);
    const configuredRequired = requiredFields.filter(f => 
      entry.values[f.key] || EXISTING_SECRETS.has(f.key)
    );
    
    if (configuredRequired.length === requiredFields.length) {
      return { configured: true, partial: false };
    }
    if (configuredRequired.length > 0 || existingConfigured) {
      return { configured: false, partial: true };
    }
    return { configured: false, partial: false };
  };

  const handleEdit = (service: ServiceConfig) => {
    const entry = apiKeys.find(k => k.serviceId === service.id);
    setEditValues(entry?.values || {});
    setEditingService(service);
  };

  const handleSave = async () => {
    if (!editingService) return;
    
    setIsSaving(true);
    try {
      // In a real app, this would call an edge function to securely store the keys
      const updatedKeys = apiKeys.map(k => {
        if (k.serviceId === editingService.id) {
          return {
            ...k,
            values: editValues,
            isConfigured: true,
            lastUpdated: new Date().toISOString(),
          };
        }
        return k;
      });

      if (!updatedKeys.find(k => k.serviceId === editingService.id)) {
        updatedKeys.push({
          serviceId: editingService.id,
          values: editValues,
          isConfigured: true,
          lastUpdated: new Date().toISOString(),
        });
      }

      setApiKeys(updatedKeys);
      localStorage.setItem('crm_api_keys', JSON.stringify(updatedKeys));
      
      toast({
        title: 'המפתחות נשמרו',
        description: `הגדרות ${editingService.name} עודכנו בהצלחה`,
      });
      
      setEditingService(null);
      setEditValues({});
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את המפתחות',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (serviceId: string) => {
    const service = SERVICES.find(s => s.id === serviceId);
    const updatedKeys = apiKeys.map(k => {
      if (k.serviceId === serviceId) {
        return {
          ...k,
          values: {},
          isConfigured: false,
          lastUpdated: undefined,
        };
      }
      return k;
    });
    
    setApiKeys(updatedKeys);
    localStorage.setItem('crm_api_keys', JSON.stringify(updatedKeys));
    
    toast({
      title: 'המפתחות נמחקו',
      description: `הגדרות ${service?.name} נמחקו`,
    });
  };

  const handleExport = () => {
    const exportData = apiKeys.filter(k => Object.keys(k.values).length > 0);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-keys-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'יוצא בהצלחה',
      description: 'קובץ המפתחות הורד',
    });
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importData);
      if (Array.isArray(parsed)) {
        const merged = [...apiKeys];
        parsed.forEach((imported: ApiKeyEntry) => {
          const idx = merged.findIndex(k => k.serviceId === imported.serviceId);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...imported };
          } else {
            merged.push(imported);
          }
        });
        
        setApiKeys(merged);
        localStorage.setItem('crm_api_keys', JSON.stringify(merged));
        setIsImportDialogOpen(false);
        setImportData('');
        
        toast({
          title: 'יובא בהצלחה',
          description: 'המפתחות יובאו למערכת',
        });
      }
    } catch (e) {
      toast({
        title: 'שגיאה',
        description: 'פורמט הקובץ אינו תקין',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'הועתק',
      description: 'הערך הועתק ללוח',
    });
  };

  const maskValue = (value: string) => {
    if (!value) return '—';
    if (value.length <= 8) return '••••••••';
    return value.slice(0, 4) + '••••••••' + value.slice(-4);
  };

  const handleRefresh = () => {
    localStorage.removeItem('crm_api_keys');
    const envValues = getEnvValues();
    initializeApiKeys(envValues);
    toast({
      title: 'רוענן',
      description: 'האינטגרציות נטענו מחדש',
    });
  };

  // Count configured services
  const configuredCount = apiKeys.filter(k => k.isConfigured).length;

  if (!isUnlocked) {
    return null;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats Banner */}
      <div className="flex gap-4 p-4 rounded-lg bg-muted/50 border">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{configuredCount}</div>
          <div className="text-xs text-muted-foreground">מוגדרים</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{SERVICES.length - configuredCount}</div>
          <div className="text-xs text-muted-foreground">לא מוגדרים</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{SERVICES.length}</div>
          <div className="text-xs text-muted-foreground">שירותים זמינים</div>
        </div>
      </div>

      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            ניהול אינטגרציות ומפתחות API
          </h3>
          <p className="text-sm text-muted-foreground">
            הגדר חיבורים לשירותים חיצוניים ({SERVICES.length} שירותים זמינים)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <Loader2 className="h-4 w-4 ml-2" />
            רענן
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4 ml-2" />
            ייבוא
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 ml-2" />
            ייצוא
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="חפש שירות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
            <Button
              key={key}
              variant={activeCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(key)}
              className="gap-1"
            >
              {icon}
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SERVICES
          .filter(service => {
            const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
            const matchesSearch = !searchQuery || 
              service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              service.description.includes(searchQuery);
            return matchesCategory && matchesSearch;
          })
          .map(service => {
          const status = getServiceStatus(service.id);
          const entry = apiKeys.find(k => k.serviceId === service.id);
          
          const preconfigInfo = PRECONFIGURED_SERVICES[service.id];
          
          return (
            <Card 
              key={service.id} 
              className={cn(
                "transition-all",
                status.configured && "border-green-500/50 bg-green-500/5",
                status.partial && !status.configured && "border-yellow-500/50 bg-yellow-500/5"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      status.configured ? "bg-green-500/20 text-green-600" :
                      status.partial ? "bg-yellow-500/20 text-yellow-600" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {service.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {service.name}
                        {status.configured && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {status.partial && !status.configured && (
                          <Badge variant="outline" className="text-xs">חלקי</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {service.description}
                        {preconfigInfo?.note && (
                          <Badge variant="secondary" className="mr-2 text-[10px]">
                            {preconfigInfo.note}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {service.docUrl && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => window.open(service.docUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {(entry?.isConfigured || Object.keys(entry?.values || {}).length > 0) && !preconfigInfo?.configured && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  {service.fields.slice(0, 2).map(field => {
                    const value = entry?.values[field.key] || '';
                    const isExisting = EXISTING_SECRETS.has(field.key);
                    const isVisible = visibleFields[field.key];
                    const displayValue = isExisting ? '(מוגדר במערכת)' : 
                      isVisible ? value : maskValue(value);
                    
                    return (
                      <div key={field.key} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground truncate flex-1">
                          {field.label}:
                        </span>
                        <div className="flex items-center gap-1">
                          <code className={cn(
                            "px-2 py-0.5 rounded text-xs font-mono",
                            isExisting ? "bg-green-500/20 text-green-600" :
                            value ? "bg-muted" : "text-muted-foreground"
                          )}>
                            {displayValue}
                          </code>
                          {!isExisting && value && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleFieldVisibility(field.key)}
                            >
                              {isVisible ? 
                                <EyeOff className="h-3 w-3" /> : 
                                <Eye className="h-3 w-3" />
                              }
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {service.fields.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      ועוד {service.fields.length - 2} שדות...
                    </p>
                  )}
                </div>
                
                {entry?.lastUpdated && (
                  <p className="text-xs text-muted-foreground mt-3">
                    עודכן: {new Date(entry.lastUpdated).toLocaleDateString('he-IL')}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingService?.icon}
              הגדרת {editingService?.name}
            </DialogTitle>
            <DialogDescription>
              {editingService?.description}
              {editingService?.docUrl && (
                <Button
                  variant="link"
                  className="p-0 h-auto mr-2"
                  onClick={() => window.open(editingService.docUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 ml-1" />
                  תיעוד
                </Button>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {editingService?.fields.map(field => {
              const isExisting = EXISTING_SECRETS.has(field.key);
              
              return (
                <div key={field.key} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                    {isExisting && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                        מוגדר
                      </Badge>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={visibleFields[field.key] ? 'text' : field.type}
                        value={editValues[field.key] || ''}
                        onChange={e => setEditValues(prev => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))}
                        placeholder={isExisting ? '(שמור במערכת - השאר ריק לשימוש בערך הקיים)' : field.placeholder}
                        dir="ltr"
                        className="pl-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => toggleFieldVisibility(field.key)}
                      >
                        {visibleFields[field.key] ? 
                          <EyeOff className="h-4 w-4" /> : 
                          <Eye className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                    {editValues[field.key] && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(editValues[field.key])}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingService(null)}>
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="btn-gold">
              {isSaving ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>ייבוא מפתחות</DialogTitle>
            <DialogDescription>
              הדבק את תוכן קובץ הייצוא כאן
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <textarea
              value={importData}
              onChange={e => setImportData(e.target.value)}
              placeholder='[{"serviceId": "twilio", "values": {...}}]'
              className="w-full h-40 p-3 rounded-md border bg-background font-mono text-sm resize-none"
              dir="ltr"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleImport} className="btn-gold">
              <Upload className="h-4 w-4 ml-2" />
              ייבוא
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
