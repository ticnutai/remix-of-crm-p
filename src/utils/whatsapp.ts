// WhatsApp Quick-Send Utilities
// כלים לשליחת הודעות WhatsApp מהירות

/**
 * Format phone number for WhatsApp (remove dashes, spaces, add country code)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return "";

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // If starts with 0, replace with Israel country code
  if (cleaned.startsWith("0")) {
    cleaned = "972" + cleaned.slice(1);
  }

  // If doesn't start with country code, add Israel
  if (!cleaned.startsWith("972") && cleaned.length <= 10) {
    cleaned = "972" + cleaned;
  }

  return cleaned;
}

/**
 * Generate WhatsApp link with optional pre-filled message
 */
export function getWhatsAppLink(phone: string, message?: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  if (!formattedPhone) return "";

  let url = `https://wa.me/${formattedPhone}`;
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  return url;
}

/**
 * Open WhatsApp chat in new tab
 */
export function openWhatsApp(phone: string, message?: string): void {
  const link = getWhatsAppLink(phone, message);
  if (link) {
    window.open(link, "_blank", "noopener,noreferrer");
  }
}

/**
 * Pre-built message templates
 */
export const WHATSAPP_TEMPLATES = {
  greeting: (name: string) =>
    `שלום ${name}, מדבר/ת מ-ArchFlow CRM. איך אפשר לעזור?`,
  followUp: (name: string) =>
    `שלום ${name}, רצינו לעקוב אחר הפגישה האחרונה שלנו. האם יש עדכונים?`,
  reminder: (name: string) =>
    `שלום ${name}, תזכורת ידידותית לגבי הפרויקט שלנו. נשמח לשמוע ממך.`,
  meeting: (name: string) => `שלום ${name}, האם נוכל לתאם פגישה בימים הקרובים?`,
  invoice: (name: string) =>
    `שלום ${name}, רצינו לעדכן שנשלחה חשבונית חדשה. ניתן לצפות בה בפורטל הלקוחות.`,
} as const;

export type WhatsAppTemplate = keyof typeof WHATSAPP_TEMPLATES;
