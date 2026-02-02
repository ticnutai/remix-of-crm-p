// אינטגרציית WhatsApp
// שליחת הודעות וקישורים מהירים

import { supabase } from '@/integrations/supabase/client';

// פורמט מספר טלפון לוואטסאפ
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  
  // הסרת כל מה שלא מספרים
  let cleaned = phone.replace(/\D/g, '');
  
  // המרה לפורמט בינלאומי ישראלי
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.slice(1);
  } else if (!cleaned.startsWith('972')) {
    cleaned = '972' + cleaned;
  }
  
  return cleaned;
}

// יצירת קישור WhatsApp
export function createWhatsAppLink(phone: string, message?: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  if (!formattedPhone) return '';
  
  let url = `https://wa.me/${formattedPhone}`;
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  
  return url;
}

// פתיחת WhatsApp בחלון חדש
export function openWhatsApp(phone: string, message?: string): void {
  const link = createWhatsAppLink(phone, message);
  if (link) {
    window.open(link, '_blank');
  }
}

// תבניות הודעות
export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'greeting',
    name: 'הודעת ברכה',
    category: 'כללי',
    template: 'שלום {{שם_לקוח}},\n\nתודה שפנית אלינו.\nאשמח לסייע לך.\n\nבברכה,\n{{שם_משרד}}',
    variables: ['שם_לקוח', 'שם_משרד'],
  },
  {
    id: 'quote_sent',
    name: 'הצעת מחיר נשלחה',
    category: 'הצעות מחיר',
    template: 'שלום {{שם_לקוח}},\n\nהצעת המחיר עבור {{שם_פרויקט}} נשלחה אליך במייל.\n\nסכום ההצעה: ₪{{סכום}}\nתוקף: {{תוקף}} יום\n\nאשמח לעמוד לרשותך לכל שאלה.\n\nבברכה,\n{{שם_משרד}}',
    variables: ['שם_לקוח', 'שם_פרויקט', 'סכום', 'תוקף', 'שם_משרד'],
  },
  {
    id: 'contract_ready',
    name: 'חוזה מוכן לחתימה',
    category: 'חוזים',
    template: 'שלום {{שם_לקוח}},\n\nהחוזה עבור {{שם_פרויקט}} מוכן לחתימה.\n\nאנא צור קשר לתיאום מועד לחתימה.\n\nבברכה,\n{{שם_משרד}}',
    variables: ['שם_לקוח', 'שם_פרויקט', 'שם_משרד'],
  },
  {
    id: 'payment_reminder',
    name: 'תזכורת תשלום',
    category: 'תשלומים',
    template: 'שלום {{שם_לקוח}},\n\nברצוני להזכיר כי ישנו תשלום ממתין בסך ₪{{סכום}} עבור {{שם_פרויקט}}.\n\nמועד יעד לתשלום: {{תאריך_יעד}}\n\nתודה מראש,\n{{שם_משרד}}',
    variables: ['שם_לקוח', 'סכום', 'שם_פרויקט', 'תאריך_יעד', 'שם_משרד'],
  },
  {
    id: 'payment_received',
    name: 'אישור קבלת תשלום',
    category: 'תשלומים',
    template: 'שלום {{שם_לקוח}},\n\nתודה על התשלום בסך ₪{{סכום}} עבור {{שם_פרויקט}}.\n\nהתשלום התקבל ונרשם במערכת.\n\nבברכה,\n{{שם_משרד}}',
    variables: ['שם_לקוח', 'סכום', 'שם_פרויקט', 'שם_משרד'],
  },
  {
    id: 'project_update',
    name: 'עדכון פרויקט',
    category: 'פרויקטים',
    template: 'שלום {{שם_לקוח}},\n\nעדכון לגבי {{שם_פרויקט}}:\n\n{{עדכון}}\n\nבברכה,\n{{שם_משרד}}',
    variables: ['שם_לקוח', 'שם_פרויקט', 'עדכון', 'שם_משרד'],
  },
  {
    id: 'meeting_reminder',
    name: 'תזכורת פגישה',
    category: 'פגישות',
    template: 'שלום {{שם_לקוח}},\n\nתזכורת לפגישה שנקבעה:\n\n📅 תאריך: {{תאריך}}\n🕐 שעה: {{שעה}}\n📍 מיקום: {{מיקום}}\n\nמחכים לראותך!\n\n{{שם_משרד}}',
    variables: ['שם_לקוח', 'תאריך', 'שעה', 'מיקום', 'שם_משרד'],
  },
  {
    id: 'permit_approved',
    name: 'היתר בניה אושר',
    category: 'היתרים',
    template: 'שלום {{שם_לקוח}},\n\nבשורות טובות! 🎉\n\nהיתר הבניה עבור {{כתובת}} אושר!\n\nמספר היתר: {{מספר_היתר}}\n\nאנא צור קשר לקבלת המסמכים.\n\nבברכה,\n{{שם_משרד}}',
    variables: ['שם_לקוח', 'כתובת', 'מספר_היתר', 'שם_משרד'],
  },
];

// החלפת משתנים בתבנית
export function fillTemplate(template: string, values: Record<string, string>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(values)) {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(pattern, value || '');
  }
  
  // הסרת משתנים שלא הוחלפו
  result = result.replace(/\{\{[^}]+\}\}/g, '');
  
  return result;
}

// שליחה מהירה ללקוח
export interface QuickSendOptions {
  clientId: string;
  templateId: string;
  values?: Record<string, string>;
}

export async function quickSendToClient(options: QuickSendOptions): Promise<void> {
  const { clientId, templateId, values = {} } = options;
  
  // שליפת פרטי לקוח
  const { data: client } = await supabase
    .from('clients')
    .select('name, phone, company')
    .eq('id', clientId)
    .single();
  
  if (!client?.phone) {
    throw new Error('ללקוח אין מספר טלפון');
  }
  
  // מציאת תבנית
  const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    throw new Error('תבנית לא נמצאה');
  }
  
  // מילוי ערכים אוטומטיים
  const autoValues: Record<string, string> = {
    שם_לקוח: client.name || client.company || 'לקוח יקר',
    ...values,
  };
  
  // יצירת הודעה
  const message = fillTemplate(template.template, autoValues);
  
  // פתיחת WhatsApp
  openWhatsApp(client.phone, message);
}

// שמירת לוג הודעות שנשלחו
export async function logWhatsAppMessage(
  clientId: string,
  templateId: string,
  message: string
): Promise<void> {
  await (supabase as any)
    .from('whatsapp_log')
    .insert([{
      client_id: clientId,
      template_id: templateId,
      message,
      sent_at: new Date().toISOString(),
    }]);
}

export default {
  formatPhoneForWhatsApp,
  createWhatsAppLink,
  openWhatsApp,
  MESSAGE_TEMPLATES,
  fillTemplate,
  quickSendToClient,
  logWhatsAppMessage,
};
