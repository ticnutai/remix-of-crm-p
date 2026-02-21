/**
 * Color Utils Tests - בדיקות עזר צבעים
 */
import { describe, it, expect } from 'vitest';
import {
  parseHslColor,
  getLuminanceFromHsl,
  isLightBackground,
  getContrastTextColor,
  getContrastTextColorAdvanced,
  hasGoodContrast,
} from '@/lib/colorUtils';

describe('Color Utils', () => {
  describe('parseHslColor', () => {
    it('should parse valid HSL strings', () => {
      const result = parseHslColor('hsl(200, 50%, 60%)');
      expect(result).toEqual({ h: 200, s: 50, l: 60 });
    });

    it('should parse HSL without spaces', () => {
      const result = parseHslColor('hsl(0,100%,50%)');
      expect(result).toEqual({ h: 0, s: 100, l: 50 });
    });

    it('should return null for invalid format', () => {
      expect(parseHslColor('#ff0000')).toBeNull();
      expect(parseHslColor('rgb(255,0,0)')).toBeNull();
      expect(parseHslColor('red')).toBeNull();
      expect(parseHslColor('')).toBeNull();
    });
  });

  describe('getLuminanceFromHsl', () => {
    it('should return high luminance for white', () => {
      expect(getLuminanceFromHsl('hsl(0, 0%, 100%)')).toBe(1);
    });

    it('should return low luminance for black', () => {
      expect(getLuminanceFromHsl('hsl(0, 0%, 0%)')).toBe(0);
    });

    it('should return mid luminance for mid grey', () => {
      expect(getLuminanceFromHsl('hsl(0, 0%, 50%)')).toBe(0.5);
    });

    it('should detect light keywords for non-HSL input', () => {
      expect(getLuminanceFromHsl('white')).toBe(0.8);
      expect(getLuminanceFromHsl('light-blue')).toBe(0.8);
      expect(getLuminanceFromHsl('gold')).toBe(0.8);
    });

    it('should detect dark keywords for non-HSL input', () => {
      expect(getLuminanceFromHsl('black')).toBe(0.2);
      expect(getLuminanceFromHsl('dark-navy')).toBe(0.2);
    });

    it('should return 0.5 for unknown non-HSL input', () => {
      expect(getLuminanceFromHsl('purple')).toBe(0.5);
    });
  });

  describe('isLightBackground', () => {
    it('should return true for light backgrounds', () => {
      expect(isLightBackground('hsl(0, 0%, 80%)')).toBe(true);
      expect(isLightBackground('hsl(60, 100%, 90%)')).toBe(true);
    });

    it('should return false for dark backgrounds', () => {
      expect(isLightBackground('hsl(0, 0%, 20%)')).toBe(false);
      expect(isLightBackground('hsl(240, 80%, 30%)')).toBe(false);
    });
  });

  describe('getContrastTextColor', () => {
    it('should return dark text for light backgrounds', () => {
      const result = getContrastTextColor('hsl(0, 0%, 80%)');
      expect(result).toContain('220'); // dark navy hue
    });

    it('should return white for dark backgrounds', () => {
      const result = getContrastTextColor('hsl(0, 0%, 20%)');
      expect(result).toContain('100%'); // white
    });
  });

  describe('getContrastTextColorAdvanced', () => {
    it('should use custom colors', () => {
      const result = getContrastTextColorAdvanced('hsl(0, 0%, 80%)', {
        darkTextColor: '#333',
      });
      expect(result).toBe('#333');
    });

    it('should use default colors when no options', () => {
      const result = getContrastTextColorAdvanced('hsl(0, 0%, 20%)');
      expect(result).toContain('100%'); // white default
    });
  });

  describe('hasGoodContrast', () => {
    it('should detect good contrast between light and dark', () => {
      expect(hasGoodContrast('hsl(0, 0%, 90%)', 'hsl(0, 0%, 10%)')).toBe(true);
    });

    it('should detect poor contrast between similar colors', () => {
      expect(hasGoodContrast('hsl(0, 0%, 50%)', 'hsl(0, 0%, 55%)')).toBe(false);
    });

    it('should detect contrast at boundary', () => {
      // 80% and 40% = 0.4 difference > 0.3
      expect(hasGoodContrast('hsl(0, 0%, 80%)', 'hsl(0, 0%, 40%)')).toBe(true);
    });
  });
});
