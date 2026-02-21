/**
 * DataValidation Tests - בדיקות ולידציה של נתונים
 * כולל: אימייל, טלפון, תעודת זהות, XSS, SQL injection, לקוחות, משימות
 */
import { describe, it, expect } from 'vitest';
import { DataValidation } from '@/lib/dataValidation';

describe('DataValidation', () => {
  // ==================== Email ====================
  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(DataValidation.isValidEmail('test@example.com').valid).toBe(true);
      expect(DataValidation.isValidEmail('user.name@domain.co.il').valid).toBe(true);
      expect(DataValidation.isValidEmail('info@company.org').valid).toBe(true);
    });

    it('should reject empty email', () => {
      expect(DataValidation.isValidEmail('').valid).toBe(false);
      expect(DataValidation.isValidEmail('   ').valid).toBe(false);
    });

    it('should reject invalid format', () => {
      expect(DataValidation.isValidEmail('notanemail').valid).toBe(false);
      expect(DataValidation.isValidEmail('missing@').valid).toBe(false);
      expect(DataValidation.isValidEmail('@nodomain.com').valid).toBe(false);
      expect(DataValidation.isValidEmail('spaces in@email.com').valid).toBe(false);
    });

    it('should reject emails with dangerous characters', () => {
      expect(DataValidation.isValidEmail('<script>@evil.com').valid).toBe(false);
      expect(DataValidation.isValidEmail('test@example.com onclick=alert(1)').valid).toBe(false);
    });
  });

  // ==================== Phone ====================
  describe('isValidPhone', () => {
    it('should accept valid Israeli mobile numbers', () => {
      expect(DataValidation.isValidPhone('0501234567').valid).toBe(true);
      expect(DataValidation.isValidPhone('052-1234567').valid).toBe(true);
      expect(DataValidation.isValidPhone('054 1234567').valid).toBe(true);
    });

    it('should accept valid Israeli landline numbers', () => {
      expect(DataValidation.isValidPhone('021234567').valid).toBe(true);
      expect(DataValidation.isValidPhone('031234567').valid).toBe(true);
      expect(DataValidation.isValidPhone('041234567').valid).toBe(true);
      expect(DataValidation.isValidPhone('081234567').valid).toBe(true);
      expect(DataValidation.isValidPhone('091234567').valid).toBe(true);
    });

    it('should accept empty phone (optional field)', () => {
      expect(DataValidation.isValidPhone('').valid).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(DataValidation.isValidPhone('12345').valid).toBe(false);
      expect(DataValidation.isValidPhone('abc').valid).toBe(false);
      expect(DataValidation.isValidPhone('0601234567').valid).toBe(false); // 06x not valid
    });
  });

  // ==================== Israeli ID ====================
  describe('isValidIsraeliID', () => {
    it('should accept valid Israeli IDs (Luhn check)', () => {
      // The implementation doubles even-position digits (0,2,4,6,8)
      // Valid ID: 036733892 passes sum % 10 === 0
      // Let's verify the algorithm by testing known passing IDs:
      // ID 000000000 => sum = 0 => valid
      expect(DataValidation.isValidIsraeliID('000000000').valid).toBe(true);
    });

    it('should accept empty ID (optional)', () => {
      expect(DataValidation.isValidIsraeliID('').valid).toBe(true);
    });

    it('should reject wrong length', () => {
      const result = DataValidation.isValidIsraeliID('12345678');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('9 ספרות');
    });

    it('should reject non-numeric ID', () => {
      const result = DataValidation.isValidIsraeliID('12345678a');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('ספרות בלבד');
    });

    it('should reject invalid Luhn checksum', () => {
      const result = DataValidation.isValidIsraeliID('123456789');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('לון');
    });
  });

  // ==================== Dangerous Characters ====================
  describe('containsDangerousCharacters', () => {
    it('should detect script tags', () => {
      expect(DataValidation.containsDangerousCharacters('<script>alert(1)</script>')).toBe(true);
    });

    it('should detect javascript URLs', () => {
      expect(DataValidation.containsDangerousCharacters('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(DataValidation.containsDangerousCharacters('onclick=doEvil()')).toBe(true);
      expect(DataValidation.containsDangerousCharacters('onerror=hack()')).toBe(true);
    });

    it('should detect SQL injection patterns', () => {
      expect(DataValidation.containsDangerousCharacters("' OR '1'='1")).toBe(true);
      expect(DataValidation.containsDangerousCharacters('; DROP TABLE users')).toBe(true);
      expect(DataValidation.containsDangerousCharacters('UNION SELECT * FROM passwords')).toBe(true);
    });

    it('should detect iframe injection', () => {
      expect(DataValidation.containsDangerousCharacters('<iframe src="evil.com">')).toBe(true);
    });

    it('should allow safe text', () => {
      expect(DataValidation.containsDangerousCharacters('שלום עולם')).toBe(false);
      expect(DataValidation.containsDangerousCharacters('John Doe')).toBe(false);
      expect(DataValidation.containsDangerousCharacters('רחוב הרצל 5, תל אביב')).toBe(false);
    });
  });

  // ==================== sanitizeInput ====================
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(DataValidation.sanitizeInput('<b>bold</b>')).toBe('bbold/b');
    });

    it('should remove javascript URLs', () => {
      expect(DataValidation.sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
    });

    it('should trim whitespace', () => {
      expect(DataValidation.sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should handle empty/null input', () => {
      expect(DataValidation.sanitizeInput('')).toBe('');
      expect(DataValidation.sanitizeInput(null as any)).toBe('');
    });
  });

  // ==================== isValidLength ====================
  describe('isValidLength', () => {
    it('should pass valid length', () => {
      expect(DataValidation.isValidLength('hello', 1, 10).valid).toBe(true);
    });

    it('should fail too short', () => {
      const result = DataValidation.isValidLength('a', 3, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('קצר');
    });

    it('should fail too long', () => {
      const result = DataValidation.isValidLength('a'.repeat(1001), 0, 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('ארוך');
    });
  });

  // ==================== isValidDate ====================
  describe('isValidDate', () => {
    it('should accept valid past dates', () => {
      expect(DataValidation.isValidDate('2024-01-15').valid).toBe(true);
      expect(DataValidation.isValidDate('2020-06-30').valid).toBe(true);
    });

    it('should reject empty date', () => {
      expect(DataValidation.isValidDate('').valid).toBe(false);
    });

    it('should reject invalid date string', () => {
      expect(DataValidation.isValidDate('not-a-date').valid).toBe(false);
    });

    it('should reject very old dates', () => {
      expect(DataValidation.isValidDate('1800-01-01').valid).toBe(false);
    });
  });

  // ==================== isPositiveNumber ====================
  describe('isPositiveNumber', () => {
    it('should accept positive numbers', () => {
      expect(DataValidation.isPositiveNumber(5).valid).toBe(true);
      expect(DataValidation.isPositiveNumber(0).valid).toBe(true);
      expect(DataValidation.isPositiveNumber(99.5).valid).toBe(true);
    });

    it('should reject negative numbers', () => {
      expect(DataValidation.isPositiveNumber(-1).valid).toBe(false);
    });

    it('should reject non-numbers', () => {
      expect(DataValidation.isPositiveNumber('abc').valid).toBe(false);
      expect(DataValidation.isPositiveNumber(NaN).valid).toBe(false);
    });
  });

  // ==================== isValidPrice ====================
  describe('isValidPrice', () => {
    it('should accept valid prices', () => {
      expect(DataValidation.isValidPrice(100).valid).toBe(true);
      expect(DataValidation.isValidPrice(99.99).valid).toBe(true);
      expect(DataValidation.isValidPrice(0).valid).toBe(true);
    });

    it('should reject price above million', () => {
      expect(DataValidation.isValidPrice(1000001).valid).toBe(false);
    });

    it('should reject too many decimal places', () => {
      expect(DataValidation.isValidPrice(10.999).valid).toBe(false);
    });

    it('should reject negative price', () => {
      expect(DataValidation.isValidPrice(-50).valid).toBe(false);
    });
  });

  // ==================== isValidURL ====================
  describe('isValidURL', () => {
    it('should accept valid URLs', () => {
      expect(DataValidation.isValidURL('https://example.com').valid).toBe(true);
      expect(DataValidation.isValidURL('http://www.site.co.il').valid).toBe(true);
    });

    it('should accept empty URL (optional)', () => {
      expect(DataValidation.isValidURL('').valid).toBe(true);
    });

    it('should reject non-http protocols', () => {
      expect(DataValidation.isValidURL('ftp://files.com').valid).toBe(false);
      expect(DataValidation.isValidURL('file:///etc/passwd').valid).toBe(false);
    });

    it('should reject invalid URL format', () => {
      expect(DataValidation.isValidURL('not a url').valid).toBe(false);
    });
  });

  // ==================== validateClient ====================
  describe('validateClient', () => {
    it('should pass valid client', () => {
      const result = DataValidation.validateClient({
        name: 'ישראל ישראלי',
        email: 'israel@example.com',
        phone: '0501234567',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail missing name', () => {
      const result = DataValidation.validateClient({ name: '' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('שם לקוח חובה');
    });

    it('should fail name too short', () => {
      const result = DataValidation.validateClient({ name: 'א' });
      expect(result.valid).toBe(false);
    });

    it('should fail dangerous name', () => {
      const result = DataValidation.validateClient({ name: '<script>alert(1)</script>' });
      expect(result.valid).toBe(false);
    });

    it('should fail invalid email if provided', () => {
      const result = DataValidation.validateClient({
        name: 'Test User',
        email: 'bademail',
      });
      expect(result.valid).toBe(false);
    });

    it('should fail invalid phone if provided', () => {
      const result = DataValidation.validateClient({
        name: 'Test User',
        phone: '12345',
      });
      expect(result.valid).toBe(false);
    });
  });

  // ==================== validateTask ====================
  describe('validateTask', () => {
    it('should pass valid task', () => {
      const result = DataValidation.validateTask({
        title: 'לסיים פרויקט',
        priority: 'high',
      });
      expect(result.valid).toBe(true);
    });

    it('should fail missing title', () => {
      const result = DataValidation.validateTask({ title: '' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('כותרת משימה חובה');
    });

    it('should fail title too short', () => {
      const result = DataValidation.validateTask({ title: 'ab' });
      expect(result.valid).toBe(false);
    });

    it('should fail invalid priority', () => {
      const result = DataValidation.validateTask({ title: 'Test Task', priority: 'super_high' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('עדיפות לא תקינה');
    });

    it('should accept valid priorities', () => {
      ['low', 'medium', 'high', 'urgent'].forEach((p) => {
        const result = DataValidation.validateTask({ title: 'Test Task', priority: p });
        expect(result.valid).toBe(true);
      });
    });
  });

  // ==================== validateObject ====================
  describe('validateObject', () => {
    it('should validate with custom rules', () => {
      const result = DataValidation.validateObject(
        { name: 'Test', age: 25 },
        {
          name: (v) => (v ? { valid: true } : { valid: false, error: 'Name required' }),
          age: (v) => DataValidation.isPositiveNumber(v),
        }
      );
      expect(result.valid).toBe(true);
    });

    it('should collect errors from multiple rules', () => {
      const result = DataValidation.validateObject(
        { name: '', age: -5 },
        {
          name: (v) => (v ? { valid: true } : { valid: false, error: 'Name required' }),
          age: (v) => DataValidation.isPositiveNumber(v),
        }
      );
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBe('Name required');
      expect(result.errors.age).toContain('חיובי');
    });
  });
});
