// Hook לניהול תבניות חוזים
// מערכת תבניות עם מילוי אוטומטי מנתוני לקוח

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

export interface PaymentScheduleItem {
  description: string;
  percentage: number;
  days_offset: number;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  html_content: string;
  css_styles?: string;
  header_html?: string;
  footer_html?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  variables: string[];
  default_terms_and_conditions?: string;
  default_payment_terms?: string;
  default_special_clauses?: string;
  default_payment_schedule: PaymentScheduleItem[];
  default_duration_days?: number;
  is_default: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplateFormData {
  name: string;
  description?: string;
  category: string;
  html_content: string;
  css_styles?: string;
  header_html?: string;
  footer_html?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  default_terms_and_conditions?: string;
  default_payment_terms?: string;
  default_special_clauses?: string;
  default_payment_schedule?: PaymentScheduleItem[];
  default_duration_days?: number;
  is_default?: boolean;
}

export interface ClientData {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  // שדות נדל"ן
  id_number?: string | null;
  gush?: string | null;
  helka?: string | null;
  migrash?: string | null;
  taba?: string | null;
}

// צד לחוזה (מזמין/ספק/ערב)
export interface ContractParty {
  id?: string;
  contract_id?: string;
  party_type: 'orderer' | 'provider' | 'guarantor' | 'witness';
  name: string;
  id_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  gush?: string;
  helka?: string;
  migrash?: string;
  display_order: number;
  is_primary: boolean; // Changed from optional to required
  linked_client_id?: string;
}

export interface CompanyData {
  name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// ============================================================================
// משתנים זמינים בתבניות
// ============================================================================

export const TEMPLATE_VARIABLES = {
  // לקוח - בסיסי
  '{{client.name}}': 'שם הלקוח',
  '{{client.phone}}': 'טלפון',
  '{{client.email}}': 'אימייל',
  '{{client.address}}': 'כתובת',
  '{{client.company}}': 'חברה',
  
  // לקוח - שדות נדל"ן
  '{{client.id_number}}': 'תעודת זהות',
  '{{client.gush}}': 'גוש',
  '{{client.helka}}': 'חלקה',
  '{{client.migrash}}': 'מגרש',
  '{{client.taba}}': 'תב"ע',
  '{{client.block_info}}': 'גוש/חלקה/מגרש',
  
  // צדדים (מזמינים מרובים)
  '{{parties.orderers}}': 'רשימת מזמינים',
  '{{parties.orderers_names}}': 'שמות המזמינים',
  '{{parties.orderers_count}}': 'מספר מזמינים',
  '{{signatures.orderers}}': 'חתימות מזמינים',
  
  // חוזה
  '{{contract.number}}': 'מספר חוזה',
  '{{contract.title}}': 'כותרת',
  '{{contract.value}}': 'סכום החוזה',
  '{{contract.value_words}}': 'סכום במילים',
  '{{contract.description}}': 'תיאור',
  '{{contract.start_date}}': 'תאריך התחלה',
  '{{contract.end_date}}': 'תאריך סיום',
  '{{contract.signed_date}}': 'תאריך חתימה',
  
  // תשלום
  '{{payment.terms}}': 'תנאי תשלום',
  '{{payment.schedule}}': 'לוח תשלומים',
  '{{payment.total_steps}}': 'מספר שלבי תשלום',
  '{{payment.advance}}': 'מקדמה',
  
  // חברה
  '{{company.name}}': 'שם החברה',
  '{{company.logo}}': 'לוגו החברה',
  '{{company.address}}': 'כתובת החברה',
  '{{company.phone}}': 'טלפון החברה',
  '{{company.email}}': 'אימייל החברה',
  
  // שלבי עבודה
  '{{work_stages}}': 'שלבי עבודה',
  '{{timeline}}': 'לוחות זמנים',
  
  // מערכת
  '{{today}}': 'תאריך היום',
  '{{today_hebrew}}': 'תאריך עברי',
  '{{terms_and_conditions}}': 'תנאים והתניות',
  '{{special_clauses}}': 'תנאים מיוחדים',
};

export const TEMPLATE_CATEGORIES = [
  'כללי',
  'שירותים',
  'בנייה',
  'ייעוץ',
  'פיתוח תוכנה',
  'עיצוב',
  'שיווק',
  'אחר',
];

// ============================================================================
// Hook
// ============================================================================

export function useContractTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // שליפת כל התבניות הפעילות
  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: async () => {
      // @ts-ignore - הטבלה נוצרת ב-migration
      const { data, error } = await (supabase as any)
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name');
      
      if (error) throw error;
      
      // המרת JSON לטיפוסים נכונים
      return (data || []).map((t: any) => ({
        ...t,
        variables: Array.isArray(t.variables) ? t.variables : [],
        default_payment_schedule: Array.isArray(t.default_payment_schedule) 
          ? t.default_payment_schedule 
          : [],
      })) as ContractTemplate[];
    },
    enabled: !!user,
  });

  // שליפת תבנית בודדת
  const getTemplate = async (id: string): Promise<ContractTemplate | null> => {
    // @ts-ignore - הטבלה נוצרת ב-migration
    const { data, error } = await (supabase as any)
      .from('contract_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    
    return {
      ...data,
      variables: Array.isArray(data.variables) ? data.variables : [],
      default_payment_schedule: Array.isArray(data.default_payment_schedule) 
        ? data.default_payment_schedule 
        : [],
    } as ContractTemplate;
  };

  // תבנית ברירת מחדל
  const defaultTemplate = templates.find(t => t.is_default);

  // יצירת תבנית חדשה
  const createTemplate = useMutation({
    mutationFn: async (formData: ContractTemplateFormData) => {
      if (!user) throw new Error('לא מחובר');
      
      // @ts-ignore - הטבלה נוצרת ב-migration
      const { data, error } = await (supabase as any)
        .from('contract_templates')
        .insert([{
          ...formData,
          created_by: user.id,
          variables: extractVariables(formData.html_content),
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({ title: 'התבנית נוצרה בהצלחה' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'שגיאה ביצירת תבנית', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // עדכון תבנית
  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContractTemplate> & { id: string }) => {
      const updateData = { ...updates };
      delete (updateData as any).id;
      delete (updateData as any).created_at;
      delete (updateData as any).updated_at;
      
      // עדכון משתנים אם התוכן השתנה
      if (updates.html_content) {
        (updateData as any).variables = extractVariables(updates.html_content);
      }
      
      // @ts-ignore - הטבלה נוצרת ב-migration
      const { data, error } = await (supabase as any)
        .from('contract_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({ title: 'התבנית עודכנה' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'שגיאה בעדכון תבנית', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // מחיקת תבנית (סימון כלא פעילה)
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      // @ts-ignore - הטבלה נוצרת ב-migration
      const { error } = await (supabase as any)
        .from('contract_templates')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({ title: 'התבנית נמחקה' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'שגיאה במחיקת תבנית', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // שכפול תבנית
  const duplicateTemplate = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('לא מחובר');
      
      const original = await getTemplate(id);
      if (!original) throw new Error('תבנית לא נמצאה');
      
      // @ts-ignore - הטבלה נוצרת ב-migration
      const { data, error } = await (supabase as any)
        .from('contract_templates')
        .insert([{
          name: `${original.name} (העתק)`,
          description: original.description,
          category: original.category,
          html_content: original.html_content,
          css_styles: original.css_styles,
          header_html: original.header_html,
          footer_html: original.footer_html,
          logo_url: original.logo_url,
          primary_color: original.primary_color,
          secondary_color: original.secondary_color,
          variables: original.variables,
          default_terms_and_conditions: original.default_terms_and_conditions,
          default_payment_terms: original.default_payment_terms,
          default_special_clauses: original.default_special_clauses,
          default_payment_schedule: original.default_payment_schedule,
          default_duration_days: original.default_duration_days,
          is_default: false,
          created_by: user.id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({ title: 'התבנית שוכפלה' });
    },
  });

  // הגדרת תבנית כברירת מחדל
  const setAsDefault = useMutation({
    mutationFn: async (id: string) => {
      // הסרת ברירת מחדל מכל התבניות
      // @ts-ignore - הטבלה נוצרת ב-migration
      await (supabase as any)
        .from('contract_templates')
        .update({ is_default: false })
        .neq('id', id);
      
      // הגדרת התבנית הנוכחית כברירת מחדל
      // @ts-ignore - הטבלה נוצרת ב-migration
      const { error } = await (supabase as any)
        .from('contract_templates')
        .update({ is_default: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({ title: 'תבנית ברירת מחדל עודכנה' });
    },
  });

  return {
    templates,
    isLoading,
    refetch,
    defaultTemplate,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setAsDefault,
  };
}

// ============================================================================
// פונקציות עזר
// ============================================================================

// חילוץ משתנים מתוכן HTML
function extractVariables(content: string): string[] {
  const regex = /\{\{[^}]+\}\}/g;
  const matches = content.match(regex);
  return [...new Set(matches || [])];
}

// החלפת משתנים בתוכן
export function replaceTemplateVariables(
  content: string,
  client: ClientData | null,
  contractData: {
    number?: string;
    title?: string;
    value?: number;
    description?: string;
    start_date?: string;
    end_date?: string;
    signed_date?: string;
    payment_terms?: string;
    terms_and_conditions?: string;
    special_clauses?: string;
    work_stages?: string;
    timeline?: string;
  },
  company?: CompanyData,
  paymentScheduleHtml?: string,
  parties?: ContractParty[]
): string {
  let result = content;
  
  // נתוני לקוח - בסיסי
  if (client) {
    result = result.replace(/\{\{client\.name\}\}/g, client.name || '');
    result = result.replace(/\{\{client\.phone\}\}/g, client.phone || '');
    result = result.replace(/\{\{client\.email\}\}/g, client.email || '');
    result = result.replace(/\{\{client\.address\}\}/g, client.address || '');
    result = result.replace(/\{\{client\.company\}\}/g, client.company || '');
    
    // שדות נדל"ן
    result = result.replace(/\{\{client\.id_number\}\}/g, client.id_number || '');
    result = result.replace(/\{\{client\.gush\}\}/g, client.gush || '');
    result = result.replace(/\{\{client\.helka\}\}/g, client.helka || '');
    result = result.replace(/\{\{client\.migrash\}\}/g, client.migrash || '');
    result = result.replace(/\{\{client\.taba\}\}/g, client.taba || '');
    
    // מידע מאוחד על גוש/חלקה/מגרש
    const blockInfo = [client.gush, client.helka, client.migrash]
      .filter(Boolean)
      .join('/');
    result = result.replace(/\{\{client\.block_info\}\}/g, blockInfo);
  }
  
  // צדדים לחוזה (מזמינים מרובים)
  if (parties && parties.length > 0) {
    const orderers = parties.filter(p => p.party_type === 'orderer');
    
    // רשימת מזמינים בפורמט HTML
    const orderersHtml = orderers.map(p => {
      let html = `<p><strong>${p.name}</strong>`;
      if (p.id_number) html += ` | ת.ז.: ${p.id_number}`;
      if (p.phone) html += ` | טלפון: ${p.phone}`;
      if (p.address) html += `<br/>כתובת: ${p.address}`;
      html += '</p>';
      return html;
    }).join('');
    result = result.replace(/\{\{parties\.orderers\}\}/g, orderersHtml);
    
    // שמות המזמינים בלבד
    const orderersNames = orderers.map(p => p.name).join(', ');
    result = result.replace(/\{\{parties\.orderers_names\}\}/g, orderersNames);
    
    // מספר מזמינים
    result = result.replace(/\{\{parties\.orderers_count\}\}/g, String(orderers.length));
    
    // חתימות מזמינים
    const signaturesHtml = orderers.map(p => `
      <div style="margin-bottom: 20px;">
        <p>שם: ${p.name}</p>
        <p>ת.ז.: ${p.id_number || '_____________'}</p>
        <p>חתימה: _______________________</p>
        <p>תאריך: _______________________</p>
      </div>
    `).join('');
    result = result.replace(/\{\{signatures\.orderers\}\}/g, signaturesHtml);
  } else {
    // ברירת מחדל - ריק
    result = result.replace(/\{\{parties\.orderers\}\}/g, '');
    result = result.replace(/\{\{parties\.orderers_names\}\}/g, '');
    result = result.replace(/\{\{parties\.orderers_count\}\}/g, '0');
    result = result.replace(/\{\{signatures\.orderers\}\}/g, '');
  }
  
  // נתוני חוזה
  result = result.replace(/\{\{contract\.number\}\}/g, contractData.number || '');
  result = result.replace(/\{\{contract\.title\}\}/g, contractData.title || '');
  result = result.replace(/\{\{contract\.value\}\}/g, 
    contractData.value?.toLocaleString('he-IL') || '');
  result = result.replace(/\{\{contract\.value_words\}\}/g, 
    contractData.value ? numberToHebrewWords(contractData.value) : '');
  result = result.replace(/\{\{contract\.description\}\}/g, contractData.description || '');
  result = result.replace(/\{\{contract\.start_date\}\}/g, 
    contractData.start_date ? format(new Date(contractData.start_date), 'dd/MM/yyyy') : '');
  result = result.replace(/\{\{contract\.end_date\}\}/g, 
    contractData.end_date ? format(new Date(contractData.end_date), 'dd/MM/yyyy') : '');
  result = result.replace(/\{\{contract\.signed_date\}\}/g, 
    contractData.signed_date ? format(new Date(contractData.signed_date), 'dd/MM/yyyy') : '');
  
  // שלבי עבודה ולוחות זמנים
  result = result.replace(/\{\{work_stages\}\}/g, contractData.work_stages || '');
  result = result.replace(/\{\{timeline\}\}/g, contractData.timeline || '');
  
  // תשלום
  result = result.replace(/\{\{payment\.terms\}\}/g, contractData.payment_terms || '');
  result = result.replace(/\{\{payment\.schedule\}\}/g, paymentScheduleHtml || '');
  
  // חברה
  if (company) {
    result = result.replace(/\{\{company\.name\}\}/g, company.name || '');
    result = result.replace(/\{\{company\.logo\}\}/g, 
      company.logo_url 
        ? `<img src="${company.logo_url}" alt="לוגו" style="max-height: 80px;" />`
        : '');
    result = result.replace(/\{\{company\.address\}\}/g, company.address || '');
    result = result.replace(/\{\{company\.phone\}\}/g, company.phone || '');
    result = result.replace(/\{\{company\.email\}\}/g, company.email || '');
  }
  
  // מערכת
  result = result.replace(/\{\{today\}\}/g, format(new Date(), 'dd/MM/yyyy'));
  result = result.replace(/\{\{today_hebrew\}\}/g, formatHebrewDate(new Date()));
  result = result.replace(/\{\{terms_and_conditions\}\}/g, 
    contractData.terms_and_conditions || '');
  result = result.replace(/\{\{special_clauses\}\}/g, 
    contractData.special_clauses || '');
  
  return result;
}

// המרת מספר למילים בעברית
function numberToHebrewWords(num: number): string {
  if (num === 0) return 'אפס';
  
  const ones = ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע'];
  const tens = ['', 'עשר', 'עשרים', 'שלושים', 'ארבעים', 'חמישים', 'שישים', 'שבעים', 'שמונים', 'תשעים'];
  const teens = ['עשר', 'אחת עשרה', 'שתים עשרה', 'שלוש עשרה', 'ארבע עשרה', 'חמש עשרה', 'שש עשרה', 'שבע עשרה', 'שמונה עשרה', 'תשע עשרה'];
  
  let result = '';
  
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    result += millions === 1 ? 'מיליון ' : `${millions} מיליון `;
    num %= 1000000;
  }
  
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    if (thousands === 1) {
      result += 'אלף ';
    } else if (thousands === 2) {
      result += 'אלפיים ';
    } else {
      result += `${ones[thousands]} אלפים `;
    }
    num %= 1000;
  }
  
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    if (hundreds === 1) {
      result += 'מאה ';
    } else if (hundreds === 2) {
      result += 'מאתיים ';
    } else {
      result += `${ones[hundreds]} מאות `;
    }
    num %= 100;
  }
  
  if (num >= 10 && num < 20) {
    result += teens[num - 10];
  } else {
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    if (num > 0) {
      result += ones[num];
    }
  }
  
  return result.trim() + ' שקלים חדשים';
}

// פורמט תאריך עברי (בסיסי)
function formatHebrewDate(date: Date): string {
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  return `${date.getDate()} ב${months[date.getMonth()]} ${date.getFullYear()}`;
}

// יצירת לוח תשלומים מתבנית
export function generatePaymentScheduleFromTemplate(
  template: ContractTemplate,
  startDate: Date,
  totalValue: number
): Array<{
  payment_number: number;
  description: string;
  amount: number;
  due_date: string;
}> {
  if (!template.default_payment_schedule?.length) {
    return [];
  }
  
  // וידוא שתאריך ההתחלה תקין
  let validStartDate: Date;
  try {
    if (startDate instanceof Date && !isNaN(startDate.getTime())) {
      validStartDate = startDate;
    } else if (typeof startDate === 'string' || typeof startDate === 'number') {
      const parsed = new Date(startDate);
      validStartDate = isNaN(parsed.getTime()) ? new Date() : parsed;
    } else {
      validStartDate = new Date();
    }
  } catch {
    validStartDate = new Date();
  }
  
  return template.default_payment_schedule.map((item, index) => {
    const daysOffset = typeof item.days_offset === 'number' && !isNaN(item.days_offset) 
      ? item.days_offset 
      : 0;
    const dueDate = addDays(validStartDate, daysOffset);
    
    return {
      payment_number: index + 1,
      description: item.description || '',
      amount: Math.round((totalValue * (item.percentage || 0)) / 100),
      due_date: format(dueDate, 'yyyy-MM-dd'),
    };
  });
}

// יצירת HTML ללוח תשלומים
export function generatePaymentScheduleHtml(
  payments: Array<{
    payment_number: number;
    description: string;
    amount: number;
    due_date: string;
  }>
): string {
  if (!payments.length) return '';
  
  let html = '<table style="width:100%; border-collapse: collapse; margin-top: 10px;">';
  html += '<thead><tr style="background: #f3f4f6;">';
  html += '<th style="border: 1px solid #ddd; padding: 8px; text-align: right;">מס\'</th>';
  html += '<th style="border: 1px solid #ddd; padding: 8px; text-align: right;">תיאור</th>';
  html += '<th style="border: 1px solid #ddd; padding: 8px; text-align: right;">סכום</th>';
  html += '<th style="border: 1px solid #ddd; padding: 8px; text-align: right;">תאריך יעד</th>';
  html += '</tr></thead><tbody>';
  
  for (const payment of payments) {
    html += '<tr>';
    html += `<td style="border: 1px solid #ddd; padding: 8px;">${payment.payment_number}</td>`;
    html += `<td style="border: 1px solid #ddd; padding: 8px;">${payment.description}</td>`;
    html += `<td style="border: 1px solid #ddd; padding: 8px;">₪${payment.amount.toLocaleString('he-IL')}</td>`;
    html += `<td style="border: 1px solid #ddd; padding: 8px;">${format(new Date(payment.due_date), 'dd/MM/yyyy')}</td>`;
    html += '</tr>';
  }
  
  html += '</tbody></table>';
  return html;
}

// חישוב תאריך סיום לפי תבנית
export function calculateEndDate(
  startDate: Date,
  template: ContractTemplate
): Date | null {
  if (!template.default_duration_days) return null;
  
  // וידוא שתאריך ההתחלה תקין
  const validStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) 
    ? startDate 
    : new Date();
  
  return addDays(validStartDate, template.default_duration_days);
}
