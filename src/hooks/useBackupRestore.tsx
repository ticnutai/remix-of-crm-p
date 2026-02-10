// Backup & Restore System - tenarch CRM Pro
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  createBackup: (
    name: string,
    data?: Record<string, any>,
  ) => Promise<BackupData>;
  restoreBackup: (backupId: string) => BackupData | null;
  deleteBackup: (backupId: string) => Promise<void>;
  exportBackup: (backup: BackupData) => void;
  importBackup: (file: File) => Promise<BackupData | null>;
  clearAllBackups: () => Promise<void>;
  refreshBackups: () => Promise<void>;
}

const BackupContext = createContext<BackupContextType | null>(null);

const STORAGE_KEY = "ten-arch-crm-backups";
const VERSION = "1.0.0";
const MAX_LOCAL_BACKUPS = 5; // Keep only last 5 backups locally

// Helper to check localStorage size
const getLocalStorageSize = (): number => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
    }
  }
  return total;
};

// Helper to clean old backups from localStorage
const cleanOldLocalBackups = (backups: BackupData[]): BackupData[] => {
  // Sort by date descending and keep only MAX_LOCAL_BACKUPS
  const sorted = [...backups].sort(
    (a, b) =>
      new Date(b.metadata.createdAt).getTime() -
      new Date(a.metadata.createdAt).getTime(),
  );
  return sorted.slice(0, MAX_LOCAL_BACKUPS);
};

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
      console.error("Failed to load backups:", e);
    }
    return [];
  });

  const saveToStorage = useCallback((newBackups: BackupData[]) => {
    try {
      // Try to save with limited backups first
      const limitedBackups = cleanOldLocalBackups(newBackups);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedBackups));
    } catch (e: any) {
      console.error("Failed to save backups:", e);

      // Check if it's a quota exceeded error
      if (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014) {
        // Try to clean more aggressively - keep only last 2 backups
        try {
          const minimalBackups = newBackups
            .sort(
              (a, b) =>
                new Date(b.metadata.createdAt).getTime() -
                new Date(a.metadata.createdAt).getTime(),
            )
            .slice(0, 2);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalBackups));
          toast({
            title: "אחסון מקומי מוגבל",
            description:
              "נמחקו גיבויים ישנים לפינוי מקום. הגיבויים שלך נשמרים בענן.",
            variant: "default",
          });
          return;
        } catch (e2) {
          // Clear local storage for backups entirely
          localStorage.removeItem(STORAGE_KEY);
          console.warn("Cleared local backup storage due to quota");
        }

        const usedMB = (getLocalStorageSize() / 1024 / 1024).toFixed(2);
        toast({
          title: "האחסון המקומי מלא",
          description: `נוצל ${usedMB}MB מהאחסון. הגיבויים נשמרים בענן בלבד.`,
          variant: "default",
        });
      } else {
        toast({
          title: "שגיאה בשמירה מקומית",
          description: "הגיבוי נשמר בענן בלבד",
          variant: "default",
        });
      }
    }
  }, []);

  const loadCloudBackups = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("backups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load cloud backups:", error);
        return;
      }

      if (data && data.length > 0) {
        const cloudBackups: BackupData[] = data.map((b) => ({
          metadata: {
            id: b.backup_id,
            name: b.name,
            createdAt: new Date(b.created_at || Date.now()),
            size: b.size,
            version: b.version,
          },
          data: (typeof b.data === "object" && b.data !== null
            ? b.data
            : {}) as Record<string, any>,
        }));

        // Merge with local backups (prefer cloud)
        setBackups((prev) => {
          const mergedBackups = [...cloudBackups];
          prev.forEach((local) => {
            if (
              !cloudBackups.find((c) => c.metadata.id === local.metadata.id)
            ) {
              mergedBackups.push(local);
            }
          });
          saveToStorage(mergedBackups);
          return mergedBackups;
        });
      }
    } catch (e) {
      console.error("Failed to sync with cloud:", e);
    }
  }, [saveToStorage]);

  // Load backups from Supabase on mount
  useEffect(() => {
    loadCloudBackups();
  }, []);

  const refreshBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load from localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      let localBackups: BackupData[] = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        localBackups = parsed.map((b: BackupData) => ({
          ...b,
          metadata: {
            ...b.metadata,
            createdAt: new Date(b.metadata.createdAt),
          },
        }));
      }

      // Load from cloud
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("backups")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          const cloudBackups: BackupData[] = data.map((b) => ({
            metadata: {
              id: b.backup_id,
              name: b.name,
              createdAt: new Date(b.created_at || Date.now()),
              size: b.size,
              version: b.version,
            },
            data: (typeof b.data === "object" && b.data !== null
              ? b.data
              : {}) as Record<string, any>,
          }));

          // Merge local and cloud
          const mergedBackups = [...cloudBackups];
          localBackups.forEach((local) => {
            if (
              !cloudBackups.find((c) => c.metadata.id === local.metadata.id)
            ) {
              mergedBackups.push(local);
            }
          });

          setBackups(mergedBackups);
          saveToStorage(mergedBackups);
        } else {
          setBackups(localBackups);
        }
      } else {
        setBackups(localBackups);
      }
    } catch (e) {
      console.error("Failed to refresh backups:", e);
    } finally {
      setIsLoading(false);
    }
  }, [saveToStorage]);

  const createBackup = useCallback(
    async (
      name: string,
      data: Record<string, any> = {},
    ): Promise<BackupData> => {
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

      // Save to localStorage
      setBackups((prev) => {
        const newBackups = [backup, ...prev];
        saveToStorage(newBackups);
        return newBackups;
      });

      // Save to Supabase cloud
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase.from("backups").insert({
            backup_id: backup.metadata.id,
            name: backup.metadata.name,
            size: backup.metadata.size,
            version: backup.metadata.version,
            data: backup.data,
            user_id: user.id,
          });

          if (error) {
            console.error("Failed to save to cloud:", error);
            toast({
              title: "גיבוי נשמר מקומית",
              description: "הגיבוי נשמר במחשב בלבד (שגיאה בשמירה לענן)",
              variant: "default",
            });
          } else {
            toast({
              title: "גיבוי נוצר בהצלחה",
              description: `הגיבוי "${name}" נשמר במחשב ובענן ☁️`,
            });
          }
        } else {
          toast({
            title: "גיבוי נשמר מקומית",
            description: `הגיבוי "${name}" נשמר במחשב בלבד`,
          });
        }
      } catch (e) {
        console.error("Cloud backup error:", e);
        toast({
          title: "גיבוי נשמר מקומית",
          description: `הגיבוי "${name}" נשמר במחשב בלבד`,
        });
      }

      return backup;
    },
    [saveToStorage],
  );

  const restoreBackup = useCallback(
    (backupId: string): BackupData | null => {
      const backup = backups.find((b) => b.metadata.id === backupId);
      if (!backup) {
        toast({
          title: "שגיאה",
          description: "הגיבוי לא נמצא",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "הגיבוי שוחזר",
        description: `הגיבוי "${backup.metadata.name}" שוחזר בהצלחה`,
      });

      return backup;
    },
    [backups],
  );

  const deleteBackup = useCallback(
    async (backupId: string) => {
      // Delete from localStorage
      setBackups((prev) => {
        const newBackups = prev.filter((b) => b.metadata.id !== backupId);
        saveToStorage(newBackups);
        return newBackups;
      });

      // Delete from Supabase cloud
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from("backups")
            .delete()
            .eq("backup_id", backupId)
            .eq("user_id", user.id);

          if (error) {
            console.error("Failed to delete from cloud:", error);
          }
        }
      } catch (e) {
        console.error("Cloud delete error:", e);
      }

      toast({
        title: "הגיבוי נמחק",
        description: "הגיבוי הוסר מהמערכת והענן",
      });
    },
    [saveToStorage],
  );

  const exportBackup = useCallback((backup: BackupData) => {
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${backup.metadata.name}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "קובץ גיבוי הורד",
      description: "הקובץ נשמר בתיקיית ההורדות",
    });
  }, []);

  const importBackup = useCallback(
    async (file: File): Promise<BackupData | null> => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as BackupData;

        if (!parsed.metadata || !parsed.data) {
          throw new Error("Invalid backup format");
        }

        const newBackup: BackupData = {
          ...parsed,
          metadata: {
            ...parsed.metadata,
            id: crypto.randomUUID(), // Generate new ID
            createdAt: new Date(parsed.metadata.createdAt),
          },
        };

        setBackups((prev) => {
          const newBackups = [newBackup, ...prev];
          saveToStorage(newBackups);
          return newBackups;
        });

        toast({
          title: "גיבוי יובא בהצלחה",
          description: `הגיבוי "${newBackup.metadata.name}" נוסף למערכת`,
        });

        return newBackup;
      } catch (e) {
        console.error("Failed to import backup:", e);
        toast({
          title: "שגיאה בייבוא",
          description: "הקובץ אינו תקין או פורמט לא נתמך",
          variant: "destructive",
        });
        return null;
      }
    },
    [saveToStorage],
  );

  const clearAllBackups = useCallback(async () => {
    // Clear localStorage
    setBackups([]);
    localStorage.removeItem(STORAGE_KEY);

    // Clear from Supabase cloud
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("backups")
          .delete()
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to clear cloud backups:", error);
        }
      }
    } catch (e) {
      console.error("Cloud clear error:", e);
    }

    toast({
      title: "כל הגיבויים נמחקו",
      description: "האחסון המקומי והענן רוקנו",
    });
  }, []);

  return (
    <BackupContext.Provider
      value={{
        backups: backups.map((b) => b.metadata),
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
    throw new Error("useBackupRestore must be used within a BackupProvider");
  }
  return context;
}
