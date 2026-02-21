/**
 * Phone Utils Tests - בדיקות כלי טלפון
 */
import { describe, it, expect } from 'vitest';
import { isValidPhoneForDisplay, formatPhoneForDisplay } from '@/lib/phone-utils';

describe('Phone Utils', () => {
  describe('isValidPhoneForDisplay', () => {
    it('should accept valid phone numbers', () => {
      expect(isValidPhoneForDisplay('0501234567')).toBe(true);
      expect(isValidPhoneForDisplay('+972501234567')).toBe(true);
      expect(isValidPhoneForDisplay('03-1234567')).toBe(true);
    });

    it('should reject null/undefined/empty', () => {
      expect(isValidPhoneForDisplay(null)).toBe(false);
      expect(isValidPhoneForDisplay(undefined)).toBe(false);
      expect(isValidPhoneForDisplay('')).toBe(false);
    });

    it('should reject all-zeros', () => {
      expect(isValidPhoneForDisplay('0000000000')).toBe(false);
      expect(isValidPhoneForDisplay('000000')).toBe(false);
    });

    it('should reject too short numbers', () => {
      expect(isValidPhoneForDisplay('12345')).toBe(false);
      expect(isValidPhoneForDisplay('050')).toBe(false);
    });

    it('should reject empty after cleaning non-digits', () => {
      expect(isValidPhoneForDisplay('---')).toBe(false);
    });
  });

  describe('formatPhoneForDisplay', () => {
    it('should return phone string when valid', () => {
      expect(formatPhoneForDisplay('0501234567')).toBe('0501234567');
    });

    it('should return null when invalid', () => {
      expect(formatPhoneForDisplay(null)).toBeNull();
      expect(formatPhoneForDisplay('')).toBeNull();
      expect(formatPhoneForDisplay('0000000000')).toBeNull();
    });
  });
});
