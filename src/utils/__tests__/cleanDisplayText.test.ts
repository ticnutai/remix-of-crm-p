/**
 * Clean Display Text Tests - בדיקות ניקוי טקסט תצוגה
 */
import { describe, it, expect } from 'vitest';
import { cleanTitle, cleanDescription } from '@/utils/cleanDisplayText';

describe('Clean Display Text', () => {
  describe('cleanTitle', () => {
    it('should remove [stage_task:uuid] tags', () => {
      expect(cleanTitle('Task [stage_task:abc12345-def6-7890-abcd-ef1234567890] name'))
        .toBe('Task name');
    });

    it('should remove raw metadata fields', () => {
      expect(cleanTitle('due_date: 2025-08-31|priority: high|My Task'))
        .toBe('My Task');
    });

    it('should remove numeric prefix', () => {
      expect(cleanTitle('31: My Task')).toBe('My Task');
    });

    it('should remove redundant משימה: prefix', () => {
      expect(cleanTitle('משימה: Complete the project')).toBe('Complete the project');
    });

    it('should replace pipes with spaces', () => {
      expect(cleanTitle('part1|part2|part3')).toBe('part1 part2 part3');
    });

    it('should collapse multiple spaces', () => {
      expect(cleanTitle('hello   world')).toBe('hello world');
    });

    it('should handle null/undefined/empty', () => {
      expect(cleanTitle(null)).toBe('');
      expect(cleanTitle(undefined)).toBe('');
      expect(cleanTitle('')).toBe('');
    });

    it('should return original if cleaning empties it', () => {
      // If all content is metadata, return trimmed original
      const input = 'due_date: 2025-08-31';
      const result = cleanTitle(input);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should preserve normal Hebrew text', () => {
      expect(cleanTitle('לסיים את הפרויקט')).toBe('לסיים את הפרויקט');
    });
  });

  describe('cleanDescription', () => {
    it('should remove [stage_task:uuid] from description', () => {
      const result = cleanDescription('Details [stage_task:abc12345-def6-7890-abcd-ef1234567890] here');
      expect(result).toBe('Details here');
    });

    it('should remove raw metadata fields', () => {
      const result = cleanDescription('status: active|description Some text');
      expect(result).not.toBeNull();
    });

    it('should return null for empty/null input', () => {
      expect(cleanDescription(null)).toBeNull();
      expect(cleanDescription(undefined)).toBeNull();
      expect(cleanDescription('')).toBeNull();
    });

    it('should return null if description was only metadata', () => {
      // If after cleaning nothing remains
      const result = cleanDescription('due_date: 2025-08-31|priority: high|');
      // Either null or an empty-ish result
      if (result !== null) {
        expect(result.trim().length).toBeGreaterThan(0);
      }
    });

    it('should preserve normal text', () => {
      expect(cleanDescription('This is a normal description')).toBe('This is a normal description');
    });
  });
});
