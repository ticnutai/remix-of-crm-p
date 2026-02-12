// Data Hub - Context Provider
// מנהל מצב מרכזי למערכת גיבוי וייבוא נתונים

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  DataHubTab,
  BackupStatus,
  DataStats,
  BackupOptions,
  ImportOptions,
  ImportStats,
  ImportProgress,
  AnalysisResult,
  CloudBackup,
  DataOperation,
  NormalizedBackup,
  ImportSource,
  ParsedClient,
  ParsedProject,
  ParsedTimeEntry,
  ParsedTask,
  ParsedMeeting,
} from "./types";

interface DataHubContextType {
  // UI State
  activeTab: DataHubTab;
  setActiveTab: (tab: DataHubTab) => void;
  status: BackupStatus;

  // Statistics
  stats: DataStats | null;
  fetchStats: () => Promise<void>;

  // Backup Operations
  backupOptions: BackupOptions;
  setBackupOptions: React.Dispatch<React.SetStateAction<BackupOptions>>;
  createBackup: (format: "json" | "excel" | "csv") => Promise<Blob | null>;
  downloadBackup: (format: "json" | "excel" | "csv") => Promise<void>;

  // Cloud Backups
  cloudBackups: CloudBackup[];
  fetchCloudBackups: () => Promise<void>;
  restoreFromCloud: (backup: CloudBackup) => Promise<void>;
  deleteCloudBackup: (backup: CloudBackup) => Promise<void>;

  // Import Operations
  importOptions: ImportOptions;
  setImportOptions: React.Dispatch<React.SetStateAction<ImportOptions>>;
  analysisResult: AnalysisResult | null;
  analyzeFile: (file: File) => Promise<AnalysisResult>;
  importData: () => Promise<ImportStats>;

  // Import Data Storage
  normalizedData: NormalizedBackup | null;
  setNormalizedData: (data: NormalizedBackup | null) => void;
  parsedClients: ParsedClient[];
  parsedProjects: ParsedProject[];
  parsedTimeLogs: ParsedTimeEntry[];
  parsedTasks: ParsedTask[];
  parsedMeetings: ParsedMeeting[];

  // Progress Tracking
  importProgress: ImportProgress | null;
  setImportProgress: React.Dispatch<
    React.SetStateAction<ImportProgress | null>
  >;
  importStats: ImportStats | null;

  // History
  operations: DataOperation[];
  fetchOperations: () => Promise<void>;

  // Errors & Messages
  error: string | null;
  setError: (error: string | null) => void;
  message: string | null;
  setMessage: (message: string | null) => void;

  // Reset
  reset: () => void;
}

const defaultBackupOptions: BackupOptions = {
  clients: true,
  projects: true,
  time_entries: true,
  tasks: true,
  meetings: true,
  quotes: true,
  invoices: true,
  profiles: true,
  custom_tables: true,
  custom_table_data: true,
  settings: false,
  documents: false,
  client_custom_tabs: true,
  client_tab_columns: true,
};

const defaultImportOptions: ImportOptions = {
  clients: true,
  projects: true,
  time_entries: true,
  tasks: true,
  meetings: true,
  quotes: true,
  invoices: true,
  custom_spreadsheets: true,
  custom_tables: true,
  team_members: true,
  documents: false,
  skipDuplicates: true,
  overwriteDuplicates: false,
  createMissingRelations: true,
};

const defaultStats: ImportStats = {
  clients: { total: 0, imported: 0, skipped: 0, updated: 0, errors: 0 },
  projects: { total: 0, imported: 0, skipped: 0, updated: 0, errors: 0 },
  time_entries: { total: 0, imported: 0, skipped: 0, updated: 0, errors: 0 },
  tasks: { total: 0, imported: 0, skipped: 0, updated: 0, errors: 0 },
  meetings: { total: 0, imported: 0, skipped: 0, updated: 0, errors: 0 },
  quotes: { total: 0, imported: 0, skipped: 0, updated: 0, errors: 0 },
  custom_tables: { total: 0, imported: 0, skipped: 0, updated: 0, errors: 0 },
};

const DataHubContext = createContext<DataHubContextType | undefined>(undefined);

export function DataHubProvider({ children }: { children: React.ReactNode }) {
  // UI State
  const [activeTab, setActiveTab] = useState<DataHubTab>("overview");
  const [status, setStatus] = useState<BackupStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Statistics
  const [stats, setStats] = useState<DataStats | null>(null);

  // Backup Options
  const [backupOptions, setBackupOptions] =
    useState<BackupOptions>(defaultBackupOptions);

  // Cloud Backups
  const [cloudBackups, setCloudBackups] = useState<CloudBackup[]>([]);

  // Import
  const [importOptions, setImportOptions] =
    useState<ImportOptions>(defaultImportOptions);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [normalizedData, setNormalizedData] = useState<NormalizedBackup | null>(
    null,
  );
  const [parsedClients, setParsedClients] = useState<ParsedClient[]>([]);
  const [parsedProjects, setParsedProjects] = useState<ParsedProject[]>([]);
  const [parsedTimeLogs, setParsedTimeLogs] = useState<ParsedTimeEntry[]>([]);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [parsedMeetings, setParsedMeetings] = useState<ParsedMeeting[]>([]);

  // Progress
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(
    null,
  );
  const [importStats, setImportStats] = useState<ImportStats | null>(null);

  // History
  const [operations, setOperations] = useState<DataOperation[]>([]);

  // ============= Statistics =============
  const fetchStats = useCallback(async () => {
    try {
      const [
        clientsResult,
        projectsResult,
        timeEntriesResult,
        tasksResult,
        meetingsResult,
        quotesResult,
        customTablesResult,
        customTableDataResult,
      ] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase
          .from("time_entries")
          .select("*", { count: "exact", head: true }),
        supabase.from("tasks").select("*", { count: "exact", head: true }),
        supabase.from("meetings").select("*", { count: "exact", head: true }),
        supabase.from("quotes").select("*", { count: "exact", head: true }),
        supabase
          .from("custom_tables")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("custom_table_data")
          .select("*", { count: "exact", head: true }),
      ]);

      const newStats: DataStats = {
        clients: clientsResult.count || 0,
        projects: projectsResult.count || 0,
        time_entries: timeEntriesResult.count || 0,
        tasks: tasksResult.count || 0,
        meetings: meetingsResult.count || 0,
        quotes: quotesResult.count || 0,
        invoices: 0,
        custom_tables: customTablesResult.count || 0,
        custom_table_data: customTableDataResult.count || 0,
        team_members: 0,
        documents: 0,
        total: 0,
      };

      newStats.total = Object.values(newStats).reduce(
        (a, b) => (typeof b === "number" ? a + b : a),
        0,
      );
      setStats(newStats);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  // ============= Cloud Backups =============
  const fetchCloudBackups = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage.from("backups").list("", {
        sortBy: { column: "created_at", order: "desc" },
      });

      if (error) throw error;

      const backups: CloudBackup[] = (data || [])
        .filter((f) => f.name.endsWith(".json") || f.name.endsWith(".xlsx"))
        .map((f) => ({
          name: f.name,
          created_at: f.created_at || new Date().toISOString(),
          size: f.metadata?.size || 0,
        }));

      setCloudBackups(backups);
    } catch (err) {
      console.error("Error fetching cloud backups:", err);
    }
  }, []);

  // ============= Create Backup =============
  const createBackup = useCallback(
    async (format: "json" | "excel" | "csv") => {
      setStatus("creating");
      setError(null);

      try {
        const tables = Object.entries(backupOptions)
          .filter(([_, enabled]) => enabled)
          .map(([key]) => key);

        const data: Record<string, any[]> = {};

        for (const table of tables) {
          try {
            const { data: tableData, error } = await supabase
              .from(table as any)
              .select("*");
            if (!error && tableData) {
              data[table] = tableData;
            }
          } catch (e) {
            console.warn(`Could not fetch table ${table}:`, e);
          }
        }

        const backup = {
          metadata: {
            version: "2.0",
            exportedAt: new Date().toISOString(),
            source: "ncrm-data-hub",
            tables: Object.keys(data).reduce(
              (acc, key) => ({ ...acc, [key]: data[key].length }),
              {},
            ),
          },
          data,
        };

        if (format === "json") {
          const blob = new Blob([JSON.stringify(backup, null, 2)], {
            type: "application/json",
          });
          setStatus("success");
          setMessage("הגיבוי נוצר בהצלחה");
          return blob;
        }

        // TODO: Excel and CSV support
        setStatus("success");
        return null;
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "שגיאה ביצירת הגיבוי");
        return null;
      }
    },
    [backupOptions],
  );

  const downloadBackup = useCallback(
    async (format: "json" | "excel" | "csv") => {
      const blob = await createBackup(format);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ncrm_backup_${new Date().toISOString().split("T")[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    },
    [createBackup],
  );

  // ============= Restore from Cloud =============
  const restoreFromCloud = useCallback(async (backup: CloudBackup) => {
    setStatus("restoring");
    setError(null);

    try {
      const { data, error } = await supabase.storage
        .from("backups")
        .download(backup.name);
      if (error) throw error;

      const text = await data.text();
      const backupData = JSON.parse(text);

      // Analyze and set as normalized data
      setNormalizedData({
        metadata: {
          source: "cloud",
          version: backupData.metadata?.version || "1.0",
          exportedAt: backup.created_at,
        },
        statistics: backupData.metadata?.tables || {},
        data: backupData.data || backupData,
      } as NormalizedBackup);

      setActiveTab("import");
      setStatus("idle");
      setMessage("קובץ הגיבוי נטען בהצלחה. אנא בדוק את הנתונים ולחץ על ייבוא.");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "שגיאה בטעינת הגיבוי");
    }
  }, []);

  const deleteCloudBackup = useCallback(
    async (backup: CloudBackup) => {
      try {
        const { error } = await supabase.storage
          .from("backups")
          .remove([backup.name]);
        if (error) throw error;
        await fetchCloudBackups();
        setMessage("הגיבוי נמחק בהצלחה");
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה במחיקת הגיבוי");
      }
    },
    [fetchCloudBackups],
  );

  // ============= Analyze File =============
  const analyzeFile = useCallback(
    async (file: File): Promise<AnalysisResult> => {
      setStatus("analyzing");
      setError(null);

      const result: AnalysisResult = {
        sourceType: "json",
        fileName: file.name,
        fileSize: file.size,
        detectedFormat: "",
        entities: [],
        warnings: [],
        recommendations: [],
        canImport: false,
        estimatedTime: 0,
      };

      try {
        const text = await file.text();
        let parsedData: any;

        // Detect format
        if (
          file.name.endsWith(".json") ||
          text.trim().startsWith("{") ||
          text.trim().startsWith("[")
        ) {
          try {
            parsedData = JSON.parse(text);
            result.detectedFormat = "JSON";
            result.sourceType = "json";
          } catch {
            result.warnings.push("קובץ JSON לא תקין");
            setStatus("error");
            setAnalysisResult(result);
            return result;
          }
        } else if (file.name.endsWith(".csv") || text.includes(",")) {
          result.detectedFormat = "CSV";
          result.sourceType = "csv";
          // Parse CSV
          const lines = text.split("\n").filter((l) => l.trim());
          if (lines.length > 0) {
            const headers = lines[0]
              .split(",")
              .map((h) => h.trim().replace(/"/g, ""));
            parsedData = lines.slice(1).map((line) => {
              const values = line
                .split(",")
                .map((v) => v.trim().replace(/"/g, ""));
              return headers.reduce(
                (obj, h, i) => ({ ...obj, [h]: values[i] }),
                {},
              );
            });
          }
        } else {
          result.warnings.push("פורמט קובץ לא מזוהה");
          setStatus("error");
          setAnalysisResult(result);
          return result;
        }

        // Detect ArchFlow format
        if (parsedData.generated_at && parsedData.data) {
          result.detectedFormat = "ArchFlow Backup";
          result.sourceType = "archflow";

          const normalized: NormalizedBackup = {
            metadata: {
              source: "archflow",
              version: "1.0",
              exportedAt: parsedData.generated_at,
              exportedBy: parsedData.by,
            },
            statistics: {
              clients: parsedData.data.Client?.length || 0,
              projects: parsedData.data.Project?.length || 0,
              time_entries: parsedData.data.TimeLog?.length || 0,
              tasks: parsedData.data.Task?.length || 0,
              meetings: parsedData.data.Meeting?.length || 0,
              quotes: 0,
              invoices: 0,
              custom_tables: 0,
              custom_table_data: 0,
              team_members: parsedData.data.users?.length || 0,
              documents: 0,
              total: parsedData.total_records || 0,
            },
            data: {
              users: parsedData.data.users,
              clients: parsedData.data.Client,
              projects: parsedData.data.Project,
              timeLogs: parsedData.data.TimeLog,
              tasks: parsedData.data.Task,
              meetings: parsedData.data.Meeting,
              spreadsheets: parsedData.data.Spreadsheet,
            },
          };

          setNormalizedData(normalized);

          // Parse entities
          if (normalized.data.clients) {
            setParsedClients(
              normalized.data.clients.map((c: any) => ({
                name: c.name || c.fullName || "",
                email: c.email || c.contactEmail,
                phone: c.phone || c.contactPhone,
                address: c.address,
                company: c.companyName,
                notes: c.notes,
                status: c.status,
                tags: c.tags,
                custom_data: c.customData || c.custom_data,
                original_id: c.id,
                created_at: c.createdAt || c.created_at,
              })),
            );
          }

          if (normalized.data.timeLogs) {
            setParsedTimeLogs(
              normalized.data.timeLogs.map((t: any) => ({
                client_id: t.clientId || t.client_id,
                description: t.description || t.notes,
                start_time: t.startTime || t.start_time,
                end_time: t.endTime || t.end_time,
                duration_seconds: t.duration || t.duration_seconds,
                is_billable: t.isBillable ?? t.is_billable ?? true,
                original_id: t.id,
                created_by_id: t.userId || t.user_id || t.created_by,
                log_date: t.logDate || t.log_date,
              })),
            );
          }

          // Add entity info to result
          for (const [key, value] of Object.entries(normalized.statistics)) {
            if (
              typeof value === "number" &&
              value > 0 &&
              !["total", "totalHours"].includes(key)
            ) {
              result.entities.push({
                type: key,
                count: value,
                sampleFields: [],
                duplicatesInDb: 0,
                newRecords: value,
                fieldsMapping: {},
              });
            }
          }
        }
        // NCRM native format
        else if (
          parsedData.metadata?.source === "ncrm-data-hub" ||
          parsedData.data?.clients
        ) {
          result.detectedFormat = "NCRM Backup";
          result.sourceType = "json";

          const normalized: NormalizedBackup = {
            metadata: {
              source: "json",
              version: parsedData.metadata?.version || "2.0",
              exportedAt:
                parsedData.metadata?.exportedAt || new Date().toISOString(),
            },
            statistics: parsedData.metadata?.tables || {},
            data: parsedData.data,
          };

          setNormalizedData(normalized);

          if (normalized.data.clients) {
            setParsedClients(normalized.data.clients);
          }
          if (normalized.data.timeLogs || parsedData.data?.time_entries) {
            setParsedTimeLogs(
              normalized.data.timeLogs || parsedData.data.time_entries,
            );
          }
        }
        // Simple array of records
        else if (Array.isArray(parsedData)) {
          result.detectedFormat = "Record Array";

          // Detect entity type from fields
          const sample = parsedData[0];
          if (sample) {
            const fields = Object.keys(sample);
            if (
              fields.some((f) =>
                ["name", "email", "phone", "client_name"].includes(
                  f.toLowerCase(),
                ),
              )
            ) {
              setParsedClients(parsedData);
              result.entities.push({
                type: "clients",
                count: parsedData.length,
                sampleFields: fields.slice(0, 5),
                duplicatesInDb: 0,
                newRecords: parsedData.length,
                fieldsMapping: {},
              });
            }
          }
        }

        result.canImport =
          result.entities.length > 0 ||
          parsedClients.length > 0 ||
          parsedTimeLogs.length > 0;
        result.estimatedTime = Math.ceil(
          (result.entities.reduce((a, e) => a + e.count, 0) / 100) * 2,
        );

        if (result.canImport) {
          result.recommendations.push("הקובץ מזוהה ומוכן לייבוא");
        }

        setAnalysisResult(result);
        setStatus("idle");
        return result;
      } catch (err) {
        result.warnings.push(
          err instanceof Error ? err.message : "שגיאה בניתוח הקובץ",
        );
        setStatus("error");
        setError(err instanceof Error ? err.message : "שגיאה בניתוח הקובץ");
        setAnalysisResult(result);
        return result;
      }
    },
    [],
  );

  // ============= Import Data =============
  const importData = useCallback(async (): Promise<ImportStats> => {
    setStatus("importing");
    setError(null);
    const stats = { ...defaultStats };

    const entityMaps = {
      clients: {} as Record<string, string>,
      projects: {} as Record<string, string>,
      users: {} as Record<string, string>,
    };

    try {
      // Import clients
      if (importOptions.clients && parsedClients.length > 0) {
        setImportProgress({
          phase: "clients",
          current: 0,
          total: parsedClients.length,
          message: "מייבא לקוחות...",
          entityMaps,
        });

        stats.clients.total = parsedClients.length;

        for (let i = 0; i < parsedClients.length; i++) {
          const client = parsedClients[i];

          // Check for duplicates
          if (importOptions.skipDuplicates && client.name) {
            const { data: existing } = await supabase
              .from("clients")
              .select("id")
              .ilike("name", client.name)
              .maybeSingle();

            if (existing) {
              if (client.original_id) {
                entityMaps.clients[client.original_id] = existing.id;
              }
              stats.clients.skipped++;
              continue;
            }
          }

          // Insert client
          const { data: newClient, error } = await supabase
            .from("clients")
            .insert({
              name: client.name,
              email: client.email,
              phone: client.phone,
              address: client.address,
              company: client.company,
              notes: client.notes,
              status: client.status || "פעיל",
              tags: client.tags,
              custom_data: client.custom_data,
            })
            .select()
            .single();

          if (error) {
            stats.clients.errors++;
            console.error("Error importing client:", error);
          } else if (newClient) {
            stats.clients.imported++;
            if (client.original_id) {
              entityMaps.clients[client.original_id] = newClient.id;
            }
          }

          setImportProgress((prev) =>
            prev
              ? {
                  ...prev,
                  current: i + 1,
                  entityMaps,
                }
              : null,
          );
        }
      }

      // Import time logs
      if (importOptions.time_entries && parsedTimeLogs.length > 0) {
        setImportProgress({
          phase: "time_entries",
          current: 0,
          total: parsedTimeLogs.length,
          message: "מייבא שעות עבודה...",
          entityMaps,
        });

        stats.time_entries.total = parsedTimeLogs.length;

        for (let i = 0; i < parsedTimeLogs.length; i++) {
          const log = parsedTimeLogs[i];

          // Map client ID - use mapped ID, fallback to name lookup, never pass old unmapped IDs
          let clientId: string | null = null;
          if (log.client_id && entityMaps.clients[log.client_id]) {
            clientId = entityMaps.clients[log.client_id];
          } else if (log.client_name) {
            // Fallback: try to find client by name in DB
            const { data: matchedClient } = await (supabase as any)
              .from("clients")
              .select("id")
              .ilike("name", log.client_name.trim())
              .maybeSingle();
            if (matchedClient) {
              clientId = matchedClient.id;
              // Cache the mapping for future entries
              if (log.client_id)
                entityMaps.clients[log.client_id] = matchedClient.id;
            }
          }

          // Insert time entry
          const { error } = await (supabase as any)
            .from("time_entries")
            .insert({
              client_id: clientId,
              description: log.description,
              start_time: log.start_time,
              end_time: log.end_time,
              duration_seconds: log.duration_seconds,
              is_billable: log.is_billable ?? true,
              custom_data: log.created_by_id
                ? { created_by_id: log.created_by_id }
                : null,
            } as any);

          if (error) {
            stats.time_entries.errors++;
          } else {
            stats.time_entries.imported++;
          }

          setImportProgress((prev) =>
            prev
              ? {
                  ...prev,
                  current: i + 1,
                }
              : null,
          );
        }
      }

      setImportProgress({
        phase: "done",
        current: 0,
        total: 0,
        message: "הייבוא הושלם!",
        entityMaps,
      });

      setImportStats(stats);
      setStatus("success");
      setMessage("הייבוא הושלם בהצלחה!");

      // Refresh stats
      await fetchStats();

      return stats;
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "שגיאה בייבוא הנתונים");
      return stats;
    }
  }, [importOptions, parsedClients, parsedTimeLogs, fetchStats]);

  // ============= History =============
  const fetchOperations = useCallback(async () => {
    // This would fetch from a dedicated operations log table if exists
    // For now, we'll use local state
  }, []);

  // ============= Reset =============
  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setMessage(null);
    setAnalysisResult(null);
    setNormalizedData(null);
    setParsedClients([]);
    setParsedProjects([]);
    setParsedTimeLogs([]);
    setParsedTasks([]);
    setParsedMeetings([]);
    setImportProgress(null);
    setImportStats(null);
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const value: DataHubContextType = {
    activeTab,
    setActiveTab,
    status,
    stats,
    fetchStats,
    backupOptions,
    setBackupOptions,
    createBackup,
    downloadBackup,
    cloudBackups,
    fetchCloudBackups,
    restoreFromCloud,
    deleteCloudBackup,
    importOptions,
    setImportOptions,
    analysisResult,
    analyzeFile,
    importData,
    normalizedData,
    setNormalizedData,
    parsedClients,
    parsedProjects,
    parsedTimeLogs,
    parsedTasks,
    parsedMeetings,
    importProgress,
    setImportProgress,
    importStats,
    operations,
    fetchOperations,
    error,
    setError,
    message,
    setMessage,
    reset,
  };

  return (
    <DataHubContext.Provider value={value}>{children}</DataHubContext.Provider>
  );
}

export function useDataHub() {
  const context = useContext(DataHubContext);
  if (!context) {
    throw new Error("useDataHub must be used within a DataHubProvider");
  }
  return context;
}
