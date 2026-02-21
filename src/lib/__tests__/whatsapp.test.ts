/**
 * WhatsApp Utils Tests - בדיקות כלי WhatsApp (פונקציות טהורות בלבד)
 */
import { describe, it, expect } from 'vitest';
import { formatPhoneForWhatsApp, createWhatsAppLink, fillTemplate, MESSAGE_TEMPLATES } from '@/lib/whatsapp';

describe('WhatsApp Utils', () => {
  describe('formatPhoneForWhatsApp', () => {
    it('should convert Israeli mobile to international format', () => {
      expect(formatPhoneForWhatsApp('0501234567')).toBe('972501234567');
    });

    it('should convert landline to international format', () => {
      expect(formatPhoneForWhatsApp('031234567')).toBe('97231234567');
    });

    it('should keep already international format', () => {
      expect(formatPhoneForWhatsApp('972501234567')).toBe('972501234567');
    });

    it('should strip non-digit characters', () => {
      expect(formatPhoneForWhatsApp('050-123-4567')).toBe('972501234567');
      expect(formatPhoneForWhatsApp('+972-50-1234567')).toBe('972501234567');
    });

    it('should add 972 prefix to numbers without 0 or 972', () => {
      expect(formatPhoneForWhatsApp('501234567')).toBe('972501234567');
    });

    it('should handle empty input', () => {
      expect(formatPhoneForWhatsApp('')).toBe('');
    });
  });

  describe('createWhatsAppLink', () => {
    it('should create basic link', () => {
      const link = createWhatsAppLink('0501234567');
      expect(link).toBe('https://wa.me/972501234567');
    });

    it('should create link with message', () => {
      const link = createWhatsAppLink('0501234567', 'שלום');
      expect(link).toBe('https://wa.me/972501234567?text=%D7%A9%D7%9C%D7%95%D7%9D');
    });

    it('should return empty string for empty phone', () => {
      expect(createWhatsAppLink('')).toBe('');
    });

    it('should encode special characters in message', () => {
      const link = createWhatsAppLink('0501234567', 'hello world & more');
      expect(link).toContain('text=');
      expect(link).toContain(encodeURIComponent('hello world & more'));
    });
  });

  describe('fillTemplate', () => {
    it('should replace template variables', () => {
      const result = fillTemplate('שלום {{שם_לקוח}}, מ-{{שם_משרד}}', {
        שם_לקוח: 'ישראל',
        שם_משרד: 'המשרד שלנו',
      });
      expect(result).toBe('שלום ישראל, מ-המשרד שלנו');
    });

    it('should replace multiple occurrences', () => {
      const result = fillTemplate('{{name}} loves {{name}}', {
        name: 'Alice',
      });
      expect(result).toBe('Alice loves Alice');
    });

    it('should remove unreplaced variables', () => {
      const result = fillTemplate('Hello {{name}}, your code is {{code}}', {
        name: 'Test',
      });
      expect(result).toBe('Hello Test, your code is ');
    });

    it('should handle empty values', () => {
      const result = fillTemplate('Value: {{val}}', { val: '' });
      expect(result).toBe('Value: ');
    });

    it('should handle no variables', () => {
      const result = fillTemplate('No variables here', {});
      expect(result).toBe('No variables here');
    });
  });

  describe('MESSAGE_TEMPLATES', () => {
    it('should have predefined templates', () => {
      expect(MESSAGE_TEMPLATES.length).toBeGreaterThan(0);
    });

    it('should have required fields in each template', () => {
      MESSAGE_TEMPLATES.forEach((template) => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.category).toBeTruthy();
        expect(template.template).toBeTruthy();
        expect(Array.isArray(template.variables)).toBe(true);
      });
    });

    it('should have template variables match the template text', () => {
      MESSAGE_TEMPLATES.forEach((template) => {
        template.variables.forEach((variable) => {
          expect(template.template).toContain(`{{${variable}}}`);
        });
      });
    });

    it('should include greeting template', () => {
      const greeting = MESSAGE_TEMPLATES.find((t) => t.id === 'greeting');
      expect(greeting).toBeDefined();
      expect(greeting?.variables).toContain('שם_לקוח');
    });

    it('should include payment reminder template', () => {
      const payment = MESSAGE_TEMPLATES.find((t) => t.id === 'payment_reminder');
      expect(payment).toBeDefined();
      expect(payment?.variables).toContain('סכום');
    });
  });
});
