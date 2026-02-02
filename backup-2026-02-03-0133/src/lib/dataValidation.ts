/**
 * Data Validation - בדיקת תקינות נתונים לפני שמירה
 * מונע נתונים לא תקינים מלהיכנס ל-DB
 */

export class DataValidation {
  
  /**
   * בדיקת אימייל תקין
   */
  static isValidEmail(email: string): { valid: boolean; error?: string } {
    if (!email || email.trim().length === 0) {
      return { valid: false, error: 'אימייל חובה' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'אימייל לא תקין' };
    }

    // בדיקת תווים מסוכנים
    if (this.containsDangerousCharacters(email)) {
      return { valid: false, error: 'אימייל מכיל תווים לא חוקיים' };
    }

    return { valid: true };
  }

  /**
   * בדיקת מספר טלפון ישראלי
   */
  static isValidPhone(phone: string): { valid: boolean; error?: string } {
    if (!phone) {
      return { valid: true }; // אופציונלי
    }

    // הסר רווחים ומקפים
    const cleaned = phone.replace(/[\s-]/g, '');

    // בדוק פורמט ישראלי
    const israeliPhoneRegex = /^(05\d{8}|0[2-4,8-9]\d{7})$/;
    if (!israeliPhoneRegex.test(cleaned)) {
      return { valid: false, error: 'מספר טלפון לא תקין (נדרש פורמט ישראלי)' };
    }

    return { valid: true };
  }

  /**
   * בדיקת תעודת זהות ישראלית
   */
  static isValidIsraeliID(id: string): { valid: boolean; error?: string } {
    if (!id) {
      return { valid: true }; // אופציונלי
    }

    // הסר רווחים
    const cleaned = id.trim();

    // בדוק אורך
    if (cleaned.length !== 9) {
      return { valid: false, error: 'תעודת זהות חייבת להכיל 9 ספרות' };
    }

    // בדוק שכולם ספרות
    if (!/^\d+$/.test(cleaned)) {
      return { valid: false, error: 'תעודת זהות חייבת להכיל ספרות בלבד' };
    }

    // אלגוריתם לון (Luhn algorithm) לבדיקת תקינות
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = parseInt(cleaned[i]);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }

    if (sum % 10 !== 0) {
      return { valid: false, error: 'תעודת זהות לא תקינה (נכשל באלגוריתם לון)' };
    }

    return { valid: true };
  }

  /**
   * בדיקת תווים מסוכנים (XSS, SQL Injection)
   */
  static containsDangerousCharacters(input: string): boolean {
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,  // onclick=, onerror=, etc.
      /<iframe/i,
      /eval\(/i,
      /exec\(/i,
      /'.*OR.*'/i,  // SQL injection patterns
      /--/,
      /;.*DROP/i,
      /UNION.*SELECT/i
    ];

    return dangerousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * ניקוי וסינון קלט
   */
  static sanitizeInput(input: string): string {
    if (!input) return '';

    return input
      .trim()
      .replace(/[<>]/g, '') // הסר תגי HTML
      .replace(/javascript:/gi, '') // הסר JavaScript URLs
      .replace(/on\w+\s*=/gi, ''); // הסר event handlers
  }

  /**
   * בדיקת אורך טקסט
   */
  static isValidLength(
    text: string, 
    min: number = 0, 
    max: number = 1000
  ): { valid: boolean; error?: string } {
    const length = text?.trim().length || 0;

    if (length < min) {
      return { valid: false, error: `טקסט קצר מדי (מינימום ${min} תווים)` };
    }

    if (length > max) {
      return { valid: false, error: `טקסט ארוך מדי (מקסימום ${max} תווים)` };
    }

    return { valid: true };
  }

  /**
   * בדיקת תאריך תקין
   */
  static isValidDate(dateString: string): { valid: boolean; error?: string } {
    if (!dateString) {
      return { valid: false, error: 'תאריך חובה' };
    }

    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'תאריך לא תקין' };
    }

    // בדוק שהתאריך לא בעתיד (אם רלוונטי)
    const now = new Date();
    if (date > now) {
      return { valid: false, error: 'תאריך לא יכול להיות בעתיד' };
    }

    // בדוק שהתאריך לא ישן מדי (100 שנה)
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(now.getFullYear() - 100);
    if (date < hundredYearsAgo) {
      return { valid: false, error: 'תאריך ישן מדי' };
    }

    return { valid: true };
  }

  /**
   * בדיקת מספר חיובי
   */
  static isPositiveNumber(value: any): { valid: boolean; error?: string } {
    const num = Number(value);

    if (isNaN(num)) {
      return { valid: false, error: 'ערך חייב להיות מספר' };
    }

    if (num < 0) {
      return { valid: false, error: 'ערך חייב להיות חיובי' };
    }

    return { valid: true };
  }

  /**
   * בדיקת מחיר תקין
   */
  static isValidPrice(price: any): { valid: boolean; error?: string } {
    const numberCheck = this.isPositiveNumber(price);
    if (!numberCheck.valid) return numberCheck;

    const num = Number(price);

    // בדוק שיש לכל היותר 2 ספרות אחרי הנקודה
    if (num !== Math.round(num * 100) / 100) {
      return { valid: false, error: 'מחיר יכול להכיל עד 2 ספרות אחרי הנקודה' };
    }

    // בדוק שהמחיר סביר (לא יותר ממיליון)
    if (num > 1000000) {
      return { valid: false, error: 'מחיר גבוה מדי (מקסימום מיליון)' };
    }

    return { valid: true };
  }

  /**
   * בדיקת URL תקין
   */
  static isValidURL(url: string): { valid: boolean; error?: string } {
    if (!url) {
      return { valid: true }; // אופציונלי
    }

    try {
      const parsed = new URL(url);
      
      // בדוק שהפרוטוקול תקין
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, error: 'URL חייב להתחיל ב-http או https' };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: 'URL לא תקין' };
    }
  }

  /**
   * ולידציה מלאה של לקוח
   */
  static validateClient(client: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // שם חובה
    if (!client.name || client.name.trim().length === 0) {
      errors.push('שם לקוח חובה');
    } else {
      const lengthCheck = this.isValidLength(client.name, 2, 100);
      if (!lengthCheck.valid) errors.push(lengthCheck.error!);

      if (this.containsDangerousCharacters(client.name)) {
        errors.push('שם מכיל תווים לא חוקיים');
      }
    }

    // אימייל חובה
    if (client.email) {
      const emailCheck = this.isValidEmail(client.email);
      if (!emailCheck.valid) errors.push(emailCheck.error!);
    }

    // טלפון אופציונלי אבל אם יש צריך להיות תקין
    if (client.phone) {
      const phoneCheck = this.isValidPhone(client.phone);
      if (!phoneCheck.valid) errors.push(phoneCheck.error!);
    }

    // כתובת
    if (client.address) {
      const lengthCheck = this.isValidLength(client.address, 0, 500);
      if (!lengthCheck.valid) errors.push(lengthCheck.error!);

      if (this.containsDangerousCharacters(client.address)) {
        errors.push('כתובת מכילה תווים לא חוקיים');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * ולידציה מלאה של משימה
   */
  static validateTask(task: {
    title?: string;
    description?: string;
    due_date?: string;
    priority?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // כותרת חובה
    if (!task.title || task.title.trim().length === 0) {
      errors.push('כותרת משימה חובה');
    } else {
      const lengthCheck = this.isValidLength(task.title, 3, 200);
      if (!lengthCheck.valid) errors.push(lengthCheck.error!);

      if (this.containsDangerousCharacters(task.title)) {
        errors.push('כותרת מכילה תווים לא חוקיים');
      }
    }

    // תיאור
    if (task.description) {
      const lengthCheck = this.isValidLength(task.description, 0, 2000);
      if (!lengthCheck.valid) errors.push(lengthCheck.error!);

      if (this.containsDangerousCharacters(task.description)) {
        errors.push('תיאור מכיל תווים לא חוקיים');
      }
    }

    // תאריך יעד
    if (task.due_date) {
      const dateCheck = this.isValidDate(task.due_date);
      // לגבי משימה, תאריך יכול להיות בעתיד
      if (isNaN(new Date(task.due_date).getTime())) {
        errors.push('תאריך יעד לא תקין');
      }
    }

    // עדיפות
    if (task.priority && !['low', 'medium', 'high', 'urgent'].includes(task.priority)) {
      errors.push('עדיפות לא תקינה');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * ולידציה כללית לכל אובייקט
   */
  static validateObject<T extends Record<string, any>>(
    obj: T,
    rules: Record<keyof T, (value: any) => { valid: boolean; error?: string }>
  ): { valid: boolean; errors: Record<keyof T, string> } {
    const errors: Partial<Record<keyof T, string>> = {};

    for (const [key, validator] of Object.entries(rules)) {
      const result = validator(obj[key as keyof T]);
      if (!result.valid) {
        errors[key as keyof T] = result.error!;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors as Record<keyof T, string>
    };
  }
}
