/**
 * Phone Validation Tests - בדיקות ולידציה של מספרי טלפון
 */
import { describe, it, expect } from 'vitest';
import { isValidPhone, getValidPhoneOrNull, formatPhoneDisplay, formatIsraeliPhone, isDummyPhone } from '@/utils/phoneValidation';

describe('Phone Validation', () => {
  describe('isValidPhone', () => {
    it('should accept valid Israeli mobile numbers', () => {
      expect(isValidPhone('0501234567')).toBe(true);
      expect(isValidPhone('052-123-4567')).toBe(true);
      expect(isValidPhone('054 1234567')).toBe(true);
      expect(isValidPhone('058-7654321')).toBe(true);
    });

    it('should accept valid Israeli landline numbers', () => {
      expect(isValidPhone('021234567')).toBe(true);
      expect(isValidPhone('03-1234567')).toBe(true);
    });

    it('should reject null/undefined/empty', () => {
      expect(isValidPhone(null)).toBe(false);
      expect(isValidPhone(undefined)).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });

    it('should reject too short numbers', () => {
      expect(isValidPhone('12345')).toBe(false);
      expect(isValidPhone('050')).toBe(false);
    });

    it('should reject numbers with too many zeros', () => {
      expect(isValidPhone('0000000000')).toBe(false);
      expect(isValidPhone('0500000000')).toBe(false);
    });

    it('should reject repeating pattern numbers', () => {
      expect(isValidPhone('1111111111')).toBe(false);
      expect(isValidPhone('2222222222')).toBe(false);
    });

    it('should reject numbers starting with 00000', () => {
      expect(isValidPhone('0000012345')).toBe(false);
    });

    it('should reject non-numeric strings', () => {
      expect(isValidPhone('abcdefghij')).toBe(false);
    });
  });

  describe('getValidPhoneOrNull', () => {
    it('should return phone for valid numbers', () => {
      expect(getValidPhoneOrNull('0501234567')).toBe('0501234567');
    });

    it('should return null for invalid numbers', () => {
      expect(getValidPhoneOrNull(null)).toBeNull();
      expect(getValidPhoneOrNull('abc')).toBeNull();
      expect(getValidPhoneOrNull('123')).toBeNull();
    });
  });

  describe('formatPhoneDisplay', () => {
    it('should return phone for valid numbers', () => {
      expect(formatPhoneDisplay('0501234567')).toBe('0501234567');
    });

    it('should return placeholder for invalid numbers', () => {
      expect(formatPhoneDisplay(null)).toBe('-');
      expect(formatPhoneDisplay(null, 'N/A')).toBe('N/A');
      expect(formatPhoneDisplay('', '---')).toBe('---');
    });
  });

  describe('formatIsraeliPhone', () => {
    it('should format 10-digit mobile numbers', () => {
      expect(formatIsraeliPhone('0501234567')).toBe('050-123-4567');
    });

    it('should format international numbers with 972', () => {
      expect(formatIsraeliPhone('972501234567')).toBe('+972-50-123-4567');
    });

    it('should return null for invalid numbers', () => {
      expect(formatIsraeliPhone(null)).toBeNull();
      expect(formatIsraeliPhone('abc')).toBeNull();
    });

    it('should return original for unknown formats', () => {
      expect(formatIsraeliPhone('021234567')).toBe('021234567');
    });
  });

  describe('isDummyPhone', () => {
    it('should detect all-zeros', () => {
      expect(isDummyPhone('0000000')).toBe(true);
      expect(isDummyPhone('00000000')).toBe(true);
    });

    it('should detect all-ones', () => {
      expect(isDummyPhone('1111111')).toBe(true);
    });

    it('should detect sequential (12345...)', () => {
      expect(isDummyPhone('1234567')).toBe(true);
    });

    it('should detect 555 numbers', () => {
      expect(isDummyPhone('5551234')).toBe(true);
    });

    it('should detect null/undefined as dummy', () => {
      expect(isDummyPhone(null)).toBe(true);
      expect(isDummyPhone(undefined)).toBe(true);
    });

    it('should NOT flag real numbers as dummy', () => {
      expect(isDummyPhone('0501234567')).toBe(false);
      expect(isDummyPhone('0521987654')).toBe(false);
    });
  });
});
