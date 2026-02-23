/**
 * Smart Backup System - Advanced Backup Strategy
 * מערכת גיבוי חכמה עם אסטרטגיות מתקדמות
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================
// טבלאות במערכת - מחולקות לפי קריטיות
// ============================================

export const BACKUP_TABLES = {
  // 🔴 קריטי - חייב לגבות תמיד!
  CRITICAL: [
    "clients", // לקוחות - הליבה של המערכת
    "profiles", // פרופילי משתמשים
    "employees", // עובדים
    "client_custom_tabs", // טאבים מותאמים אישית
    "client_tab_columns", // עמודות מותאמות
    "client_tab_data", // נתוני טאבים
    "client_tab_files", // קבצי טאבים
    "custom_tables", // טבלאות מותאמות
    "custom_table_data", // נתוני טבלאות מותאמות
    "custom_table_permissions", // הרשאות טבלאות מותאמות
    "table_custom_columns", // עמודות מותאמות בטבלאות
    "settings", // הגדרות מערכת (אם קיים)
    "app_settings", // הגדרות אפליקציה
    "user_settings", // הגדרות משתמש
    "client_categories", // קטגוריות לקוחות
    "client_sources", // מקורות לקוחות
    "client_stages", // שלבים של לקוחות
    "client_stage_tasks", // משימות בשלבים
    "client_deadlines", // דדליינים של לקוחות
    "deadline_templates", // תבניות דדליינים
    "stage_templates", // תבניות שלבים
    "stage_template_stages", // שלבים בתבניות
    "stage_template_tasks", // משימות בתבניות שלבים
  ],

  // 🟠 חשוב - נתונים עסקיים
  IMPORTANT: [
    "time_entries", // רישומי זמן
    "time_logs", // לוגים של זמן
    "projects", // פרויקטים
    "project_updates", // עדכוני פרויקטים
    "tasks", // משימות
    "task_consultants", // יועצים למשימות
    "meetings", // פגישות
    "quotes", // הצעות מחיר
    "quote_items", // פריטי הצעות מחיר
    "quote_templates", // תבניות הצעות מחיר
    "quote_payments", // תשלומי הצעות מחיר
    "contracts", // חוזים
    "contract_templates", // תבניות חוזים
    "contract_documents", // מסמכי חוזים
    "contract_amendments", // תיקוני חוזים
    "invoices", // חשבוניות
    "invoice_payments", // תשלומי חשבוניות
    "payments", // תשלומים
    "payment_schedules", // לוחות תשלום
    "expenses", // הוצאות
    "budgets", // תקציבים
    "bank_transactions", // תנועות בנק
    "bank_categories", // קטגוריות בנק
    "financial_alerts", // התראות פיננסיות
    "consultants", // יועצים
    "weekly_goals", // יעדים שבועיים
  ],

  // 🟡 נוח לגבות - תוכן נוסף
  USEFUL: [
    "client_contacts", // אנשי קשר
    "client_files", // קבצים של לקוחות
    "client_messages", // הודעות
    "client_portal_tokens", // טוקנים לפורטל לקוח
    "files", // קבצים
    "file_folders", // תיקיות
    "file_categories", // קטגוריות קבצים
    "file_metadata", // מטאדטה של קבצים
    "file_versions", // גרסאות קבצים
    "file_shares", // שיתופי קבצים
    "file_public_links", // קישורים ציבוריים
    "documents", // מסמכים
    "reminders", // תזכורות
    "notifications", // התראות
    "calendar_events", // אירועי יומן
    "call_logs", // לוגי שיחות
    "whatsapp_log", // לוגי וואטסאפ
    "whatsapp_messages", // הודעות וואטסאפ
    "signatures", // חתימות
    "workflows", // תהליכי עבודה
    "workflow_logs", // לוגי תהליכים
    "custom_reports", // דוחות מותאמים
    "custom_spreadsheets", // גיליונות מותאמים
    "user_preferences", // העדפות משתמש
    // Google integrations
    "google_accounts", // חשבונות גוגל
    "google_calendar_accounts", // חשבונות יומן גוגל
    "google_calendar_settings", // הגדרות יומן גוגל
    "google_calendar_synced_events", // אירועים מסונכרנים
    "google_contacts_sync", // סנכרון אנשי קשר
    "google_drive_files", // קבצי גוגל דרייב
    // Email system
    "email_templates", // תבניות מייל
    "email_signatures", // חתימות מייל
    "email_campaigns", // קמפיינים
    "email_campaign_recipients", // נמענים בקמפיינים
    "email_messages", // הודעות מייל
    "email_metadata", // מטאדטה של מיילים
    "email_logs", // לוגים של מיילים
    "email_clicks", // קליקים על מיילים
    "email_unsubscribes", // הסרות רישום
  ],

  // 🟢 אופציונלי - אפשר בלי (לוגים גדולים)
  OPTIONAL: [
    "audit_log", // לוג ביקורת (גדול!)
    "activity_log", // לוג פעילות
    "activity_logs", // לוגי פעילות
    "migration_logs", // לוגי מיגרציות
    "roles", // תפקידים
    "user_roles", // תפקידי משתמשים
    "permissions", // הרשאות
    "backups", // גיבויים ישנים (מטאדטה)
    "email_queue", // תור מיילים
    "email_rate_limits", // מגבלות שליחה
    "email_rate_limit_config", // הגדרות מגבלות
  ],
};

// ============================================
// אסטרטגיות גיבוי
// ============================================

export type BackupStrategy =
  | "minimal" // רק קריטי
  | "standard" // קריטי + חשוב
  | "full" // הכל חוץ אופציונלי
  | "complete" // כל המערכת
  | "custom"; // בחירה ידנית

export interface BackupConfig {
  strategy: BackupStrategy;
  tables: string[];
  includeFiles: boolean;
  includeSettings: boolean;
  compression: boolean;
  encryption: boolean;
  maxSize?: number; // MB
}

export const BACKUP_STRATEGIES: Record<
  BackupStrategy,
  Omit<BackupConfig, "strategy">
> = {
  minimal: {
    tables: [...BACKUP_TABLES.CRITICAL],
    includeFiles: false,
    includeSettings: true,
    compression: true,
    encryption: false,
  },

  standard: {
    tables: [...BACKUP_TABLES.CRITICAL, ...BACKUP_TABLES.IMPORTANT],
    includeFiles: false,
    includeSettings: true,
    compression: true,
    encryption: false,
  },

  full: {
    tables: [
      ...BACKUP_TABLES.CRITICAL,
      ...BACKUP_TABLES.IMPORTANT,
      ...BACKUP_TABLES.USEFUL,
    ],
    includeFiles: true,
    includeSettings: true,
    compression: true,
    encryption: false,
  },

  complete: {
    tables: [
      ...BACKUP_TABLES.CRITICAL,
      ...BACKUP_TABLES.IMPORTANT,
      ...BACKUP_TABLES.USEFUL,
      ...BACKUP_TABLES.OPTIONAL,
    ],
    includeFiles: true,
    includeSettings: true,
    compression: true,
    encryption: true,
  },

  custom: {
    tables: [],
    includeFiles: true,
    includeSettings: true,
    compression: true,
    encryption: false,
  },
};

// ============================================
// מערכת גיבוי חכמה
// ============================================

export class SmartBackupSystem {
  private config: BackupConfig;
  private onProgress?: (progress: number, message: string) => void;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  setProgressCallback(callback: (progress: number, message: string) => void) {
    this.onProgress = callback;
  }

  private updateProgress(progress: number, message: string) {
    if (this.onProgress) {
      this.onProgress(progress, message);
    }
  }

  /**
   * גיבוי חכם - בוחר מה לגבות בצורה אופטימלית
   */
  async createSmartBackup(name: string) {
    const startTime = Date.now();
    const backup: any = {
      metadata: {
        id: crypto.randomUUID(),
        name,
        strategy: this.config.strategy,
        createdAt: new Date().toISOString(),
        version: "2.0.0",
        compressed: this.config.compression,
        encrypted: this.config.encryption,
      },
      data: {},
      statistics: {
        tables: 0,
        totalRecords: 0,
        sizeBytes: 0,
        duration: 0,
      },
    };

    try {
      this.updateProgress(5, "מתחיל גיבוי חכם...");

      // שלב 1: גיבוי טבלאות לפי עדיפות
      const tables =
        this.config.tables.length > 0
          ? this.config.tables
          : BACKUP_STRATEGIES[this.config.strategy].tables;

      let tableIndex = 0;
      for (const tableName of tables) {
        tableIndex++;
        const progress = 10 + (tableIndex / tables.length) * 60;

        this.updateProgress(
          progress,
          `מגבה ${this.getTableLabel(tableName)} (${tableIndex}/${tables.length})...`,
        );

        try {
          const { data, error } = await (
            supabase.from(tableName as any) as any
          ).select("*");

          if (error) {
            console.warn(`⚠️ שגיאה בגיבוי ${tableName}:`, error);
            backup.data[tableName] = {
              error: error.message,
              records: [],
            };
            continue;
          }

          backup.data[tableName] = data || [];
          backup.statistics.tables++;
          backup.statistics.totalRecords += data?.length || 0;
        } catch (err) {
          console.error(`❌ כשל בגיבוי ${tableName}:`, err);
        }
      }

      // שלב 2: גיבוי הגדרות
      if (this.config.includeSettings) {
        this.updateProgress(75, "מגבה הגדרות מערכת...");
        backup.settings = await this.backupSettings();
      }

      // שלב 3: רשימת קבצים (לא את הקבצים עצמם - רק metadata)
      if (this.config.includeFiles) {
        this.updateProgress(85, "מגבה רשימת קבצים...");
        backup.files = await this.backupFileMetadata();
      }

      // שלב 4: חישוב גודל וסטטיסטיקות
      this.updateProgress(95, "מסיים גיבוי...");
      const jsonString = JSON.stringify(backup);
      backup.statistics.sizeBytes = new Blob([jsonString]).size;
      backup.statistics.duration = Date.now() - startTime;

      // שלב 5: דחיסה (אם נדרש)
      let finalBackup = backup;
      if (this.config.compression) {
        this.updateProgress(98, "דוחס גיבוי...");
        finalBackup = await this.compressBackup(backup);
      }

      this.updateProgress(100, "גיבוי הושלם בהצלחה! ✅");

      return finalBackup;
    } catch (error) {
      console.error("❌ שגיאה בגיבוי חכם:", error);
      throw error;
    }
  }

  /**
   * גיבוי הגדרות מערכת
   */
  private async backupSettings() {
    try {
      const settings: any = {};

      // הגדרות localStorage
      const localStorageKeys = [
        "theme",
        "language",
        "timelogs-view-mode",
        "timelogs-filters",
        "table-preferences",
        "dashboard-layout",
      ];

      localStorageKeys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value) {
          settings[key] = value;
        }
      });

      // הגדרות משתמש מ-Supabase
      const { data: userSettings } = await supabase
        .from("user_settings")
        .select("*")
        .single();

      if (userSettings) {
        settings.userSettings = userSettings;
      }

      return settings;
    } catch (error) {
      console.warn("⚠️ לא ניתן לגבות הגדרות:", error);
      return {};
    }
  }

  /**
   * גיבוי metadata של קבצים (לא הקבצים עצמם)
   */
  private async backupFileMetadata() {
    try {
      const { data: files } = await supabase.storage
        .from("client-files")
        .list();

      return {
        totalFiles: files?.length || 0,
        files:
          files?.map((f) => ({
            name: f.name,
            size: f.metadata?.size || 0,
            type: f.metadata?.mimetype || "unknown",
            lastModified: f.updated_at,
          })) || [],
      };
    } catch (error) {
      console.warn("⚠️ לא ניתן לגבות רשימת קבצים:", error);
      return { totalFiles: 0, files: [] };
    }
  }

  /**
   * דחיסת גיבוי (placeholder - צריך ספריית compression)
   */
  private async compressBackup(backup: any) {
    // TODO: implement real compression with pako or similar
    return {
      ...backup,
      compressed: true,
    };
  }

  /**
   * תרגום שם טבלה לעברית
   */
  private getTableLabel(tableName: string): string {
    const labels: Record<string, string> = {
      // לקוחות וקשורים
      clients: "לקוחות",
      client_categories: "קטגוריות לקוחות",
      client_sources: "מקורות לקוחות",
      client_contacts: "אנשי קשר",
      client_files: "קבצים",
      client_messages: "הודעות",
      client_notes: "הערות",
      client_history: "היסטוריה",
      client_portal_tokens: "טוקני פורטל",
      client_custom_tabs: "טאבים מותאמים",
      client_tab_columns: "עמודות מותאמות",

      // פרויקטים ומשימות
      projects: "פרויקטים",
      project_updates: "עדכוני פרויקטים",
      tasks: "משימות",

      // זמנים
      time_entries: "רישומי זמן",
      time_logs: "לוגי זמן",

      // פגישות ויומן
      meetings: "פגישות",
      calendar_events: "אירועי יומן",
      reminders: "תזכורות",

      // הצעות מחיר וחוזים
      quotes: "הצעות מחיר",
      quote_items: "פריטי הצעות מחיר",
      quote_templates: "תבניות הצעות מחיר",
      contracts: "חוזים",
      contract_templates: "תבניות חוזים",
      contract_documents: "מסמכי חוזים",
      contract_amendments: "תיקוני חוזים",

      // כספים
      invoices: "חשבוניות",
      payments: "תשלומים",
      payment_schedules: "לוחות תשלום",

      // תקשורת
      call_logs: "לוגי שיחות",
      whatsapp_log: "לוגי וואטסאפ",
      notifications: "התראות",

      // מסמכים וחתימות
      documents: "מסמכים",
      signatures: "חתימות",

      // תהליכי עבודה
      workflows: "תהליכי עבודה",
      workflow_logs: "לוגי תהליכים",

      // דוחות והגדרות
      custom_reports: "דוחות מותאמים",
      custom_tables: "טבלאות מותאמות",
      custom_table_data: "נתוני טבלאות",
      settings: "הגדרות",
      user_preferences: "העדפות משתמש",

      // מערכת
      profiles: "פרופילים",
      roles: "תפקידים",
      permissions: "הרשאות",
      audit_log: "לוג ביקורת",
      activity_logs: "לוגי פעילות",
      migration_logs: "לוגי מיגרציות",
      analytics_events: "אירועי analytics",
      search_history: "היסטוריית חיפושים",
      user_sessions: "סשנים",
    };

    return labels[tableName] || tableName;
  }

  /**
   * ייצוא לקובץ
   */
  exportToFile(backup: any, format: "json" | "xlsx" = "json") {
    if (format === "json") {
      return this.exportToJSON(backup);
    } else {
      return this.exportToExcel(backup);
    }
  }

  private exportToJSON(backup: any) {
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().split("T")[0];
    a.download = `smart-backup-${backup.metadata.name}-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private async exportToExcel(backup: any) {
    // TODO: implement Excel export with XLSX
    console.log("Excel export not implemented yet");
  }
}

// ============================================
// גיבוי אוטומטי מתוזמן - ענן + מחשב
// ============================================

export interface AutoBackupConfig {
  enabled: boolean;
  frequency: "hourly" | "daily" | "weekly" | "monthly" | "custom";
  time: string; // HH:MM - שעת גיבוי ראשית
  strategy: BackupStrategy;
  maxBackups: number;
  // ימים בשבוע (0=ראשון...6=שבת) - רלוונטי ל-weekly ו-custom
  daysOfWeek: number[];
  // כמה פעמים ביום (1-4)
  timesPerDay: number;
  // שעות נוספות כשיש יותר מגיבוי יומי אחד
  customTimes: string[]; // ["02:00", "14:00", ...]
  // יעדי גיבוי
  saveToCloud: boolean;
  saveToLocal: boolean;
  autoDownload: boolean;
  // התראות
  notifyOnSuccess: boolean;
  notifyOnError: boolean;
}

export class AutoBackupScheduler {
  private config: AutoBackupConfig;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private static instance: AutoBackupScheduler | null = null;

  constructor(config: AutoBackupConfig) {
    this.config = config;
  }

  /**
   * Singleton - מוודא שיש רק instance אחד
   */
  static getInstance(config?: AutoBackupConfig): AutoBackupScheduler {
    if (!AutoBackupScheduler.instance) {
      const resolvedConfig = config || AutoBackupScheduler.loadConfig();
      AutoBackupScheduler.instance = new AutoBackupScheduler(resolvedConfig);
    } else if (config) {
      // Update existing instance config
      AutoBackupScheduler.instance.config = {
        ...AutoBackupScheduler.instance.config,
        ...config,
      };
    }
    return AutoBackupScheduler.instance;
  }

  /**
   * עדכון הגדרות
   */
  updateConfig(config: Partial<AutoBackupConfig>) {
    this.config = { ...this.config, ...config };
    // שמירת ההגדרות ל-localStorage
    localStorage.setItem("auto-backup-config", JSON.stringify(this.config));
  }

  /**
   * טעינת הגדרות מ-localStorage
   */
  static loadConfig(): AutoBackupConfig {
    const stored = localStorage.getItem("auto-backup-config");
    if (stored) {
      return JSON.parse(stored);
    }
    // ברירת מחדל - full לכיסוי מלא של כל הנתונים
    return {
      enabled: false,
      frequency: "daily",
      time: "02:00",
      strategy: "full",
      maxBackups: 7,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // כל הימים
      timesPerDay: 1,
      customTimes: ["02:00"],
      saveToCloud: true,
      saveToLocal: true,
      autoDownload: false,
      notifyOnSuccess: true,
      notifyOnError: true,
    };
  }

  /**
   * התחלת גיבוי אוטומטי
   */
  start() {
    if (!this.config.enabled) {
      console.log("⏸️ גיבוי אוטומטי כבוי");
      return;
    }

    // עצירת interval קודם אם קיים
    this.stop();

    const checkInterval = 60000; // כל דקה
    this.intervalId = setInterval(() => {
      this.checkAndBackup();
    }, checkInterval);

    // גיבוי אוטומטי הופעל

    // בדיקה מיידית
    this.checkAndBackup();
  }

  /**
   * עצירת גיבוי אוטומטי
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      // גיבוי אוטומטי נעצר
    }
  }

  private async checkAndBackup() {
    const now = new Date();
    const lastBackup = this.getLastBackupTime();

    // בדיקה אם הגיע הזמן לגבות
    if (this.shouldBackup(now, lastBackup)) {
      // בדיקה אם זה הזמן הנכון ביום
      if (this.isCorrectTime(now)) {
        // מתחיל גיבוי אוטומטי
        await this.performAutoBackup();
      }
    }
  }

  private isCorrectTime(now: Date): boolean {
    // אם תדירות שעתית - תמיד true
    if (this.config.frequency === "hourly") return true;

    // בדיקת יום בשבוע (אם מוגדר)
    const daysOfWeek = this.config.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6];
    if (
      this.config.frequency !== "monthly" &&
      !daysOfWeek.includes(now.getDay())
    ) {
      return false;
    }

    // רשימת כל השעות המתוכננות
    const times =
      this.config.timesPerDay > 1 && this.config.customTimes?.length > 0
        ? this.config.customTimes
        : [this.config.time];

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const totalMinutesNow = currentHour * 60 + currentMinute;

    // בדיקה אם אנחנו בחלון של 30 דקות אחרי אחד מהזמנים
    for (const time of times) {
      const [hours, minutes] = time.split(":").map(Number);
      const totalMinutesTarget = hours * 60 + minutes;
      const diff = totalMinutesNow - totalMinutesTarget;
      if (diff >= 0 && diff <= 30) return true;
    }
    return false;
  }

  private shouldBackup(now: Date, lastBackup: Date | null): boolean {
    if (!lastBackup) return true;

    const diffHours = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);

    // אם יש כמה גיבויים ביום - המרווח המינימלי הוא 24/timesPerDay
    const timesPerDay = this.config.timesPerDay || 1;
    const minGapHours = timesPerDay > 1 ? Math.max(1, 24 / timesPerDay - 1) : 0;

    switch (this.config.frequency) {
      case "hourly":
        return diffHours >= 1;
      case "daily":
      case "custom":
        return diffHours >= (timesPerDay > 1 ? minGapHours : 20);
      case "weekly":
        // weekly עם ימים ספציפיים - רק צריך לעבור 20 שעות מהגיבוי האחרון
        return diffHours >= 20;
      case "monthly":
        return diffHours >= 24 * 28;
      default:
        return false;
    }
  }

  private async performAutoBackup() {
    const startTime = Date.now();

    try {
      const strategy = BACKUP_STRATEGIES[this.config.strategy];
      const backupSystem = new SmartBackupSystem({
        strategy: this.config.strategy,
        ...strategy,
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupName = `auto-backup-${timestamp}`;

      const backup = await backupSystem.createSmartBackup(backupName);

      const results = {
        cloud: false,
        local: false,
        download: false,
      };

      // 1. שמירה לענן (Supabase Storage + טבלת backups)
      if (this.config.saveToCloud) {
        try {
          results.cloud = await this.saveToCloud(backup, backupName);
          // שמירה גם לטבלת backups כדי שיהיה נגיש מהממשק
          await this.saveToBackupsTable(backup, backupName);
        } catch (e) {
          console.error("❌ שגיאה בשמירה לענן:", e);
        }
      }

      // 2. שמירה ל-localStorage (מקומי)
      if (this.config.saveToLocal) {
        try {
          this.saveToLocal(backup);
          results.local = true;
        } catch (e) {
          console.error("❌ שגיאה בשמירה מקומית:", e);
        }
      }

      // 3. הורדה אוטומטית לקובץ
      if (this.config.autoDownload) {
        try {
          this.downloadBackup(backup, backupName);
          results.download = true;
        } catch (e) {
          console.error("❌ שגיאה בהורדה:", e);
        }
      }

      // ניקוי גיבויים ישנים
      await this.cleanOldBackups();

      // עדכון זמן גיבוי אחרון
      this.setLastBackupTime(new Date());

      // שמירת היסטוריית גיבויים
      this.saveBackupHistory({
        name: backupName,
        timestamp: new Date().toISOString(),
        results,
        duration: Date.now() - startTime,
        tablesCount: backup.metadata.tablesCount,
        recordsCount: backup.metadata.totalRecords,
        size: JSON.stringify(backup).length,
      });

      // גיבוי אוטומטי הושלם

      // התראה על הצלחה
      if (this.config.notifyOnSuccess) {
        this.showNotification("success", "גיבוי אוטומטי הושלם בהצלחה");
      }

      return results;
    } catch (error) {
      console.error("❌ שגיאה בגיבוי אוטומטי:", error);

      // התראה על שגיאה
      if (this.config.notifyOnError) {
        this.showNotification("error", "שגיאה בגיבוי אוטומטי");
      }

      throw error;
    }
  }

  /**
   * שמירה ל-Supabase Storage
   */
  private async saveToCloud(backup: any, backupName: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("משתמש לא מחובר");

    const json = JSON.stringify(backup);
    const blob = new Blob([json], { type: "application/json" });
    const file = new File([blob], `${backupName}.json`, {
      type: "application/json",
    });

    const filePath = `backups/${user.id}/${backupName}.json`;

    const { error } = await supabase.storage
      .from("client-files")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;

    // נשמר לענן
    return true;
  }

  /**
   * שמירה לטבלת backups (כדי שהגיבוי יופיע בדף הגיבויים)
   */
  private async saveToBackupsTable(
    backup: any,
    backupName: string,
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const backupData = backup.data || backup;
      const dataStr = JSON.stringify(backupData);
      const { error } = await supabase.from("backups").insert({
        backup_id: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: backupName,
        data: backupData,
        size: dataStr.length,
        version: "1.0.0",
        user_id: user.id,
      });

      if (error) {
        console.error("⚠️ שגיאה בשמירה לטבלת backups:", error.message);
      } else {
        // נשמר גם לטבלת backups
      }
    } catch (e) {
      console.error("⚠️ saveToBackupsTable error:", e);
    }
  }

  /**
   * שמירה ל-localStorage
   */
  private saveToLocal(backup: any) {
    const key = "auto-backups";
    const stored = localStorage.getItem(key);
    const backups = stored ? JSON.parse(stored) : [];

    // שמירת גרסה מצומצמת ל-localStorage (בגלל מגבלת גודל)
    const compactBackup = {
      metadata: backup.metadata,
      timestamp: new Date().toISOString(),
      // שומר רק את ה-IDs במקום כל הנתונים
      summary: Object.entries(backup.data).reduce(
        (acc, [table, records]) => {
          acc[table] = { count: (records as any[]).length };
          return acc;
        },
        {} as Record<string, { count: number }>,
      ),
    };

    backups.push(compactBackup);

    // שמירה עם מגבלת גודל
    try {
      localStorage.setItem(key, JSON.stringify(backups));
      // נשמר מקומית
    } catch (e) {
      // אם נגמר המקום, מנקה ישנים ומנסה שוב
      const cleaned = backups.slice(-5);
      localStorage.setItem(key, JSON.stringify(cleaned));
    }
  }

  /**
   * הורדה לקובץ
   */
  private downloadBackup(backup: any, backupName: string) {
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${backupName}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * ניקוי גיבויים ישנים
   */
  private async cleanOldBackups() {
    // ניקוי localStorage
    const key = "auto-backups";
    const stored = localStorage.getItem(key);
    if (stored) {
      const backups = JSON.parse(stored);
      if (backups.length > this.config.maxBackups) {
        const cleaned = backups.slice(-this.config.maxBackups);
        localStorage.setItem(key, JSON.stringify(cleaned));
      }
    }

    // ניקוי ענן
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: files } = await supabase.storage
        .from("client-files")
        .list(`backups/${user.id}`, {
          sortBy: { column: "created_at", order: "asc" },
        });

      if (files && files.length > this.config.maxBackups) {
        const toDelete = files.slice(0, files.length - this.config.maxBackups);
        for (const file of toDelete) {
          await supabase.storage
            .from("client-files")
            .remove([`backups/${user.id}/${file.name}`]);
        }
        // נמחקו גיבויים ישנים מהענן
      }
    } catch (e) {
      console.error("שגיאה בניקוי גיבויים מהענן:", e);
    }
  }

  private getLastBackupTime(): Date | null {
    const stored = localStorage.getItem("last-auto-backup");
    return stored ? new Date(stored) : null;
  }

  private setLastBackupTime(date: Date) {
    localStorage.setItem("last-auto-backup", date.toISOString());
  }

  private saveBackupHistory(entry: any) {
    const key = "backup-history";
    const stored = localStorage.getItem(key);
    const history = stored ? JSON.parse(stored) : [];
    history.push(entry);
    // שמור רק 50 אחרונים
    const trimmed = history.slice(-50);
    localStorage.setItem(key, JSON.stringify(trimmed));
  }

  /**
   * קבלת היסטוריית גיבויים
   */
  getBackupHistory(): any[] {
    const stored = localStorage.getItem("backup-history");
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * קבלת גיבויים מהענן
   */
  async getCloudBackups(): Promise<any[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: files } = await supabase.storage
      .from("client-files")
      .list(`backups/${user.id}`, {
        sortBy: { column: "created_at", order: "desc" },
      });

    return files || [];
  }

  /**
   * שחזור מגיבוי ענן
   */
  async restoreFromCloud(fileName: string): Promise<any> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("משתמש לא מחובר");

    const { data, error } = await supabase.storage
      .from("client-files")
      .download(`backups/${user.id}/${fileName}`);

    if (error) throw error;

    const text = await data.text();
    return JSON.parse(text);
  }

  /**
   * הפעלת גיבוי ידני מיידי
   */
  async triggerManualBackup(): Promise<any> {
    // מתחיל גיבוי ידני
    return await this.performAutoBackup();
  }

  private showNotification(type: "success" | "error", message: string) {
    // שימוש ב-toast דרך CustomEvent שה-React app מקשיב לו
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent("auto-backup-notification", {
            detail: { type, message },
          }),
        );
        // גם Notification API אם יש הרשאה
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(
            type === "success" ? "✅ גיבוי אוטומטי" : "❌ שגיאת גיבוי",
            {
              body: message,
              icon: "/favicon.ico",
            },
          );
        }
      } catch (e) {
        // AutoBackup log
      }
    }
  }

  /**
   * חישוב הגיבוי הבא בהתאם להגדרות
   */
  private calculateNextBackup(lastBackup: Date | null): Date | null {
    const now = new Date();
    const times =
      this.config.timesPerDay > 1 && this.config.customTimes?.length > 0
        ? this.config.customTimes.sort()
        : [this.config.time || "02:00"];
    const daysOfWeek = this.config.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6];

    if (this.config.frequency === "hourly") {
      const next = new Date(lastBackup || now);
      next.setHours(next.getHours() + 1);
      return next;
    }

    if (this.config.frequency === "monthly") {
      const next = new Date(lastBackup || now);
      next.setMonth(next.getMonth() + 1);
      const [h, m] = times[0].split(":").map(Number);
      next.setHours(h, m, 0, 0);
      return next;
    }

    // daily / weekly / custom - מחפשים את הזמן הבא שמתאים
    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + dayOffset);

      if (
        this.config.frequency === "weekly" ||
        this.config.frequency === "custom"
      ) {
        if (!daysOfWeek.includes(candidate.getDay())) continue;
      }

      for (const time of times) {
        const [h, m] = time.split(":").map(Number);
        const target = new Date(candidate);
        target.setHours(h, m, 0, 0);
        if (target > now) return target;
      }
    }

    // Fallback
    const fallback = new Date(now);
    fallback.setDate(fallback.getDate() + 1);
    const [h, m] = times[0].split(":").map(Number);
    fallback.setHours(h, m, 0, 0);
    return fallback;
  }

  /**
   * קבלת סטטוס הגיבוי
   */
  getStatus(): {
    enabled: boolean;
    lastBackup: Date | null;
    nextBackup: Date | null;
    config: AutoBackupConfig;
  } {
    const lastBackup = this.getLastBackupTime();
    let nextBackup: Date | null = null;

    if (this.config.enabled) {
      nextBackup = this.calculateNextBackup(lastBackup);
    }

    return {
      enabled: this.config.enabled,
      lastBackup,
      nextBackup,
      config: this.config,
    };
  }
}

export default {
  SmartBackupSystem,
  AutoBackupScheduler,
  BACKUP_TABLES,
  BACKUP_STRATEGIES,
};
