// Hook for managing email metadata (client links, labels, etc.)
// Uses localStorage for storage until database table is available
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// Storage key for localStorage
const STORAGE_KEY = 'email_metadata';

interface EmailMetadata {
  id: string;
  email_id: string;
  linked_client_id: string | null;
  labels: string[];
  is_flagged: boolean;
  is_pinned: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface EmailDetails {
  from?: string;
  subject?: string;
  date?: Date;
}

interface UseEmailMetadataReturn {
  metadata: Map<string, EmailMetadata>;
  loading: boolean;
  getMetadata: (emailId: string) => EmailMetadata | undefined;
  linkClient: (emailId: string, clientId: string | null, emailDetails?: EmailDetails) => Promise<void>;
  addLabel: (emailId: string, label: string) => Promise<void>;
  removeLabel: (emailId: string, label: string) => Promise<void>;
  setFlag: (emailId: string, flagged: boolean) => Promise<void>;
  setPin: (emailId: string, pinned: boolean) => Promise<void>;
  setNotes: (emailId: string, notes: string | null) => Promise<void>;
  refreshMetadata: () => Promise<void>;
}

// Helper to generate UUID
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper to get storage key for a user
function getStorageKey(userId: string): string {
  return `${STORAGE_KEY}_${userId}`;
}

// Helper to load metadata from localStorage
function loadFromStorage(userId: string): Map<string, EmailMetadata> {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, EmailMetadata>;
      return new Map(Object.entries(parsed));
    }
  } catch (error) {
    console.error('Error loading email metadata from storage:', error);
  }
  return new Map();
}

// Helper to save metadata to localStorage
function saveToStorage(userId: string, metadata: Map<string, EmailMetadata>): void {
  try {
    const obj = Object.fromEntries(metadata);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(obj));
  } catch (error) {
    console.error('Error saving email metadata to storage:', error);
  }
}

export function useEmailMetadata(): UseEmailMetadataReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metadata, setMetadata] = useState<Map<string, EmailMetadata>>(new Map());
  const [loading, setLoading] = useState(false);

  // Load metadata from localStorage
  const refreshMetadata = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const loaded = loadFromStorage(user.id);
      setMetadata(loaded);
    } catch (error) {
      console.error('Error loading email metadata:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load metadata on mount and when user changes
  useEffect(() => {
    refreshMetadata();
  }, [refreshMetadata]);

  // Get metadata for a specific email
  const getMetadata = useCallback((emailId: string): EmailMetadata | undefined => {
    return metadata.get(emailId);
  }, [metadata]);

  // Create or update metadata entry
  const updateMetadata = useCallback((
    emailId: string, 
    updates: Partial<EmailMetadata>
  ) => {
    if (!user?.id) return;

    setMetadata(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(emailId);
      const now = new Date().toISOString();
      
      const updated: EmailMetadata = {
        id: existing?.id || generateId(),
        email_id: emailId,
        linked_client_id: updates.linked_client_id ?? existing?.linked_client_id ?? null,
        labels: updates.labels ?? existing?.labels ?? [],
        is_flagged: updates.is_flagged ?? existing?.is_flagged ?? false,
        is_pinned: updates.is_pinned ?? existing?.is_pinned ?? false,
        notes: updates.notes ?? existing?.notes ?? null,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };
      
      newMap.set(emailId, updated);
      saveToStorage(user.id, newMap);
      return newMap;
    });
  }, [user?.id]);

  // Link a client to an email
  const linkClient = useCallback(async (
    emailId: string, 
    clientId: string | null,
    _emailDetails?: EmailDetails
  ) => {
    if (!user?.id) return;

    updateMetadata(emailId, { linked_client_id: clientId });

    toast({
      title: clientId ? 'לקוח קושר לאימייל' : 'קישור לקוח הוסר',
      description: clientId ? 'הלקוח קושר בהצלחה לאימייל' : 'קישור הלקוח הוסר מהאימייל',
    });
  }, [user?.id, updateMetadata, toast]);

  // Add a label to an email
  const addLabel = useCallback(async (emailId: string, label: string) => {
    if (!user?.id) return;

    const existing = metadata.get(emailId);
    const currentLabels = existing?.labels || [];
    
    if (currentLabels.includes(label)) return;
    
    updateMetadata(emailId, { labels: [...currentLabels, label] });
  }, [user?.id, metadata, updateMetadata]);

  // Remove a label from an email
  const removeLabel = useCallback(async (emailId: string, label: string) => {
    if (!user?.id) return;

    const existing = metadata.get(emailId);
    if (!existing) return;
    
    updateMetadata(emailId, { labels: existing.labels.filter(l => l !== label) });
  }, [user?.id, metadata, updateMetadata]);

  // Set flag status
  const setFlag = useCallback(async (emailId: string, flagged: boolean) => {
    if (!user?.id) return;
    updateMetadata(emailId, { is_flagged: flagged });
  }, [user?.id, updateMetadata]);

  // Set pin status
  const setPin = useCallback(async (emailId: string, pinned: boolean) => {
    if (!user?.id) return;
    updateMetadata(emailId, { is_pinned: pinned });
  }, [user?.id, updateMetadata]);

  // Set notes
  const setNotes = useCallback(async (emailId: string, notes: string | null) => {
    if (!user?.id) return;
    updateMetadata(emailId, { notes });
  }, [user?.id, updateMetadata]);

  return {
    metadata,
    loading,
    getMetadata,
    linkClient,
    addLabel,
    removeLabel,
    setFlag,
    setPin,
    setNotes,
    refreshMetadata,
  };
}
