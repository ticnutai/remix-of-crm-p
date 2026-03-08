/**
 * Phone Validation Utilities
 * זיהוי וולידציה של מספרי טלפון
 */

/**
 * בדיקה האם מספר טלפון תקין
 * מזהה מספרים עם יותר מדי אפסים או תווים חוזרים
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // הסרת רווחים, מקפים ותווים מיוחדים
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // אם אין ספרות בכלל
  if (!/\d/.test(cleaned)) return false;
  
  // אם יש פחות מ-7 ספרות (מספר לא תקין)
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 7) return false;
  
  // בדיקה למספר אפסים - אם יש 7 אפסים או יותר, זה לא תקין
  const zeroCount = (digitsOnly.match(/0/g) || []).length;
  if (zeroCount >= 7) return false;
  
  // בדיקה לתבנית חוזרת (כמו 111111, 222222)
  const hasRepeatingPattern = /^(.)\1{6,}$/.test(digitsOnly);
  if (hasRepeatingPattern) return false;
  
  // בדיקה למספרים שמתחילים ב-00000
  if (digitsOnly.startsWith('00000')) return false;
  
  return true;
}

/**
 * מחזיר מספר טלפון מעוצב או null אם לא תקין
 */
export function getValidPhoneOrNull(phone: string | null | undefined): string | null {
  if (!isValidPhone(phone)) return null;
  return phone!;
}

/**
 * מחזיר מספר טלפון מעוצב או placeholder
 */
export function formatPhoneDisplay(phone: string | null | undefined, placeholder: string = '-'): string {
  if (!isValidPhone(phone)) return placeholder;
  return phone!;
}

/**
 * פורמט מספר טלפון ישראלי (אם תקין)
 * דוגמה: 0501234567 -> 050-123-4567
 */
export function formatIsraeliPhone(phone: string | null | undefined): string | null {
  if (!isValidPhone(phone)) return null;
  
  const cleaned = phone!.replace(/\D/g, '');
  
  // פורמט ישראלי: 050-123-4567
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // פורמט בינלאומי עם +972
  if (cleaned.length === 12 && cleaned.startsWith('972')) {
    return `+972-${cleaned.slice(3, 5)}-${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
  }
  
  // אם לא מתאים לפורמטים הידועים, החזר כמו שהוא
  return phone;
}

/**
 * בדיקה האם מספר הטלפון הוא placeholder/dummy
 */
export function isDummyPhone(phone: string | null | undefined): boolean {
  if (!phone) return true;
  
  const cleaned = phone.replace(/\D/g, '');
  
  // דוגמאות נפוצות למספרים לא אמיתיים
  const dummyPatterns = [
    /^0{7,}$/,           // רק אפסים
    /^1{7,}$/,           // רק אחדים
    /^12345/,            // רצף
    /^555\d{4,}$/,       // המספר הקלאסי מהסרטים
    /^0000000/,          // התחלה ב-7 אפסים
  ];
  
  return dummyPatterns.some(pattern => pattern.test(cleaned));
}
