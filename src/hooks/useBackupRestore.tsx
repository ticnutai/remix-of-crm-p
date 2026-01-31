// Backup & Restore System - e-control CRM Pro
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

export interface BackupMetadata {
  id: string;
  name: string;
  createdAt: Date;
  size: number;
  version: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  data: Record<string, any>;
}

interface BackupContextType {
  backups: BackupMetadata[];
  isLoading: boolean;
  createBackup: (name: string, data?: Record<string, any>) => BackupData;
  restoreBackup: (backupId: string) => BackupData | null;
  deleteBackup: (backupId: string) => void;
  exportBackup: (backup: BackupData) => void;
  importBackup: (file: File) => Promise<BackupData | null>;
  clearAllBackups: () => void;
  refreshBackups: () => void;
}

const BackupContext = createContext<BackupContextType | null>(null);

const STORAGE_KEY = 'ten-arch-crm-backups';
const VERSION = '1.0.0';

export function BackupProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [backups, setBackups] = useState<BackupData[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((b: BackupData) => ({
          ...b,
          metadata: {
            ...b.metadata,
            createdAt: new Date(b.metadata.createdAt),
          },
        }));
      }
    } catch (e) {
      console.error('Failed to load backups:', e);
    }
    return [];
  });

  const refreshBackups = useCallback(() => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBackups(parsed.map((b: BackupData) => ({
          ...b,
          metadata: {
            ...b.metadata,
            createdAt: new Date(b.metadata.createdAt),
          },
        })));
      }
    } catch (e) {
      console.error('Failed to refresh backups:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveToStorage = useCallback((newBackups: BackupData[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBackups));
    } catch (e) {
      console.error('Failed to save backups:', e);
      toast({
        title: 'שגיאה בשמירה',
        description: 'לא ניתן לשמור את הגיבוי באחסון המקומי',
        variant: 'destructive',
      });
    }
  }, []);

  const createBackup = useCallback((name: string, data: Record<string, any> = {}): BackupData => {
    const backup: BackupData = {
      metadata: {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date(),
        size: new Blob([JSON.stringify(data)]).size,
        version: VERSION,
      },
      data,
    };

    setBackups(prev => {
      const newBackups = [backup, ...prev];
      saveToStorage(newBackups);
      return newBackups;
    });

    toast({
      title: 'גיבוי נוצר בהצלחה',
      description: `הגיבוי "${name}" נשמר`,
    });

    return backup;
  }, [saveToStorage]);

  const restoreBackup = useCallback((backupId: string): BackupData | null => {
    const backup = backups.find(b => b.metadata.id === backupId);
    if (!backup) {
      toast({
        title: 'שגיאה',
        description: 'הגיבוי לא נמצא',
        variant: 'destructive',
      });
      return null;
    }

    toast({
      title: 'הגיבוי שוחזר',
      description: `הגיבוי "${backup.metadata.name}" שוחזר בהצלחה`,
    });

    return backup;
  }, [backups]);

  const deleteBackup = useCallback((backupId: string) => {
    setBackups(prev => {
      const newBackups = prev.filter(b => b.metadata.id !== backupId);
      saveToStorage(newBackups);
      return newBackups;
    });

    toast({
      title: 'הגיבוי נמחק',
      description: 'הגיבוי הוסר מהמערכת',
    });
  }, [saveToStorage]);

  const exportBackup = useCallback((backup: BackupData) => {
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backup.metadata.name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'קובץ גיבוי הורד',
      description: 'הקובץ נשמר בתיקיית ההורדות',
    });
  }, []);

  const importBackup = useCallback(async (file: File): Promise<BackupData | null> => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupData;

      if (!parsed.metadata || !parsed.data) {
        throw new Error('Invalid backup format');
      }

      const newBackup: BackupData = {
        ...parsed,
        metadata: {
          ...parsed.metadata,
          id: crypto.randomUUID(), // Generate new ID
          createdAt: new Date(parsed.metadata.createdAt),
        },
      };

      setBackups(prev => {
        const newBackups = [newBackup, ...prev];
        saveToStorage(newBackups);
        return newBackups;
      });

      toast({
        title: 'גיבוי יובא בהצלחה',
        description: `הגיבוי "${newBackup.metadata.name}" נוסף למערכת`,
      });

      return newBackup;
    } catch (e) {
      console.error('Failed to import backup:', e);
      toast({
        title: 'שגיאה בייבוא',
        description: 'הקובץ אינו תקין או פורמט לא נתמך',
        variant: 'destructive',
      });
      return null;
    }
  }, [saveToStorage]);

  const clearAllBackups = useCallback(() => {
    setBackups([]);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: 'כל הגיבויים נמחקו',
      description: 'האחסון המקומי רוקן',
    });
  }, []);

  return (
    <BackupContext.Provider
      value={{
        backups: backups.map(b => b.metadata),
        isLoading,
        createBackup,
        restoreBackup,
        deleteBackup,
        exportBackup,
        importBackup,
        clearAllBackups,
        refreshBackups,
      }}
    >
      {children}
    </BackupContext.Provider>
  );
}

export function useBackupRestore() {
  const context = useContext(BackupContext);
  if (!context) {
    throw new Error('useBackupRestore must be used within a BackupProvider');
  }
  return context;
}
