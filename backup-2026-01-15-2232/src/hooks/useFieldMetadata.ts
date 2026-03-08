// Hook for managing field-level metadata (creation/update timestamps)
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface FieldMetadataEntry {
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export type FieldMetadata = Record<string, FieldMetadataEntry>;

export function useFieldMetadata() {
  const { user } = useAuth();

  // Update metadata for a specific field
  const updateFieldMetadata = useCallback((
    currentMetadata: FieldMetadata = {},
    fieldKey: string,
    isNewValue: boolean = false
  ): FieldMetadata => {
    const now = new Date().toISOString();
    const userId = user?.id;

    const existingEntry = currentMetadata[fieldKey];

    if (existingEntry && !isNewValue) {
      // Update existing - keep created_at, update updated_at
      return {
        ...currentMetadata,
        [fieldKey]: {
          ...existingEntry,
          updated_at: now,
          updated_by: userId,
        },
      };
    } else {
      // New field - set both created and updated
      return {
        ...currentMetadata,
        [fieldKey]: {
          created_at: now,
          updated_at: now,
          created_by: userId,
          updated_by: userId,
        },
      };
    }
  }, [user?.id]);

  // Update metadata for multiple fields at once
  const updateMultipleFieldMetadata = useCallback((
    currentMetadata: FieldMetadata = {},
    fieldKeys: string[],
    isNewValue: boolean = false
  ): FieldMetadata => {
    let updatedMetadata = { ...currentMetadata };
    
    for (const fieldKey of fieldKeys) {
      updatedMetadata = updateFieldMetadata(updatedMetadata, fieldKey, isNewValue);
    }

    return updatedMetadata;
  }, [updateFieldMetadata]);

  // Get metadata for a specific field
  const getFieldMetadata = useCallback((
    metadata: FieldMetadata = {},
    fieldKey: string
  ): FieldMetadataEntry | null => {
    return metadata[fieldKey] || null;
  }, []);

  // Format metadata for display
  const formatMetadataForDisplay = useCallback((entry: FieldMetadataEntry | null) => {
    if (!entry) return null;

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return {
        date: date.toLocaleDateString('he-IL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: date.toLocaleTimeString('he-IL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        relative: getRelativeTime(date),
      };
    };

    return {
      created: formatDate(entry.created_at),
      updated: formatDate(entry.updated_at),
      created_by: entry.created_by,
      updated_by: entry.updated_by,
      isModified: entry.created_at !== entry.updated_at,
    };
  }, []);

  return {
    updateFieldMetadata,
    updateMultipleFieldMetadata,
    getFieldMetadata,
    formatMetadataForDisplay,
  };
}

// Helper function for relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'לפני רגע';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  if (diffWeeks < 4) return `לפני ${diffWeeks} שבועות`;
  if (diffMonths < 12) return `לפני ${diffMonths} חודשים`;
  return `לפני ${diffYears} שנים`;
}
