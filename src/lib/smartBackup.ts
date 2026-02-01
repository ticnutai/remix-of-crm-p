/**
 * Smart Backup System - Advanced Backup Strategy
 * מערכת גיבוי חכמה עם אסטרטגיות מתקדמות
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// טבלאות במערכת - מחולקות לפי קריטיות
// ============================================

export const BACKUP_TABLES = {
  // 🔴 קריטי - חייב לגבות תמיד!
  CRITICAL: [
    'clients',              // לקוחות - הליבה של המערכת
    'profiles',            // פרופילי משתמשים
    'client_custom_tabs',  // טאבים מותאמים אישית
    'client_tab_columns',  // עמודות מותאמות
    'custom_tables',       // טבלאות מותאמות
    'custom_table_data',   // נתוני טבלאות מותאמות
    'settings',            // הגדרות מערכת
    'client_categories',   // קטגוריות לקוחות
    'client_sources',      // מקורות לקוחות
    'client_stages',       // שלבים של לקוחות
    'client_stage_tasks',  // משימות בשלבים
    'stage_templates',     // תבניות שלבים
    'stage_template_stages', // שלבים בתבניות
    'stage_template_tasks',  // משימות בתבניות שלבים
  ],
  
  // 🟠 חשוב - נתונים עסקיים
  IMPORTANT: [
    'time_entries',        // רישומי זמן
    'time_logs',          // לוגים של זמן
    'projects',           // פרויקטים
    'project_updates',    // עדכוני פרויקטים
    'tasks',              // משימות
    'meetings',           // פגישות
    'quotes',             // הצעות מחיר
    'quote_items',        // פריטי הצעות מחיר
    'quote_templates',    // תבניות הצעות מחיר
    'contracts',          // חוזים
    'contract_templates', // תבניות חוזים
    'contract_documents', // מסמכי חוזים
    'contract_amendments',// תיקוני חוזים
    'invoices',           // חשבוניות
    'payments',           // תשלומים
    'payment_schedules',  // לוחות תשלום
  ],
  
  // 🟡 נוח לגבות - תוכן נוסף
  USEFUL: [
    'client_contacts',     // אנשי קשר
    'client_files',        // קבצים
    'client_messages',     // הודעות
    'client_notes',        // הערות
    'client_history',      // היסטוריה
    'client_portal_tokens',// טוקנים לפורטל לקוח
    'documents',           // מסמכים
    'reminders',           // תזכורות
    'notifications',       // התראות
    'calendar_events',     // אירועי יומן
    'call_logs',          // לוגי שיחות
    'whatsapp_log',       // לוגי וואטסאפ
    'signatures',         // חתימות
    'workflows',          // תהליכי עבודה
    'workflow_logs',      // לוגי תהליכים
    'custom_reports',     // דוחות מותאמים
    'user_preferences',   // העדפות משתמש
  ],
  
  // 🟢 אופציונלי - אפשר בלי
  OPTIONAL: [
    'audit_log',          // לוג ביקורת (גדול!)
    'activity_logs',      // לוגי פעילות
    'analytics_events',   // אירועי analytics
    'search_history',     // היסטוריית חיפושים
    'user_sessions',      // סשנים
    'migration_logs',     // לוגי מיגרציות
    'roles',              // תפקידים (אם לא משתנה הרבה)
    'permissions',        // הרשאות (אם לא משתנה הרבה)
  ],
};

// ============================================
// אסטרטגיות גיבוי
// ============================================

export type BackupStrategy = 
  | 'minimal'      // רק קריטי
  | 'standard'     // קריטי + חשוב
  | 'full'         // הכל חוץ אופציונלי
  | 'complete'     // כל המערכת
  | 'custom';      // בחירה ידנית

export interface BackupConfig {
  strategy: BackupStrategy;
  tables: string[];
  includeFiles: boolean;
  includeSettings: boolean;
  compression: boolean;
  encryption: boolean;
  maxSize?: number; // MB
}

export const BACKUP_STRATEGIES: Record<BackupStrategy, Omit<BackupConfig, 'strategy'>> = {
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
        version: '2.0.0',
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
      this.updateProgress(5, 'מתחיל גיבוי חכם...');

      // שלב 1: גיבוי טבלאות לפי עדיפות
      const tables = this.config.tables.length > 0 
        ? this.config.tables 
        : BACKUP_STRATEGIES[this.config.strategy].tables;
      
      let tableIndex = 0;
      for (const tableName of tables) {
        tableIndex++;
        const progress = 10 + (tableIndex / tables.length) * 60;
        
        this.updateProgress(
          progress,
          `מגבה ${this.getTableLabel(tableName)} (${tableIndex}/${tables.length})...`
        );

        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*');

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
        this.updateProgress(75, 'מגבה הגדרות מערכת...');
        backup.settings = await this.backupSettings();
      }

      // שלב 3: רשימת קבצים (לא את הקבצים עצמם - רק metadata)
      if (this.config.includeFiles) {
        this.updateProgress(85, 'מגבה רשימת קבצים...');
        backup.files = await this.backupFileMetadata();
      }

      // שלב 4: חישוב גודל וסטטיסטיקות
      this.updateProgress(95, 'מסיים גיבוי...');
      const jsonString = JSON.stringify(backup);
      backup.statistics.sizeBytes = new Blob([jsonString]).size;
      backup.statistics.duration = Date.now() - startTime;

      // שלב 5: דחיסה (אם נדרש)
      let finalBackup = backup;
      if (this.config.compression) {
        this.updateProgress(98, 'דוחס גיבוי...');
        finalBackup = await this.compressBackup(backup);
      }

      this.updateProgress(100, 'גיבוי הושלם בהצלחה! ✅');
      
      return finalBackup;
    } catch (error) {
      console.error('❌ שגיאה בגיבוי חכם:', error);
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
        'theme',
        'language',
        'timelogs-view-mode',
        'timelogs-filters',
        'table-preferences',
        'dashboard-layout',
      ];

      localStorageKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          settings[key] = value;
        }
      });

      // הגדרות משתמש מ-Supabase
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .single();

      if (userSettings) {
        settings.userSettings = userSettings;
      }

      return settings;
    } catch (error) {
      console.warn('⚠️ לא ניתן לגבות הגדרות:', error);
      return {};
    }
  }

  /**
   * גיבוי metadata של קבצים (לא הקבצים עצמם)
   */
  private async backupFileMetadata() {
    try {
      const { data: files } = await supabase.storage
        .from('client-files')
        .list();

      return {
        totalFiles: files?.length || 0,
        files: files?.map(f => ({
          name: f.name,
          size: f.metadata?.size || 0,
          type: f.metadata?.mimetype || 'unknown',
          lastModified: f.updated_at,
        })) || [],
      };
    } catch (error) {
      console.warn('⚠️ לא ניתן לגבות רשימת קבצים:', error);
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
      clients: 'לקוחות',
      client_categories: 'קטגוריות לקוחות',
      client_sources: 'מקורות לקוחות',
      client_contacts: 'אנשי קשר',
      client_files: 'קבצים',
      client_messages: 'הודעות',
      client_notes: 'הערות',
      client_history: 'היסטוריה',
      client_portal_tokens: 'טוקני פורטל',
      client_custom_tabs: 'טאבים מותאמים',
      client_tab_columns: 'עמודות מותאמות',
      
      // פרויקטים ומשימות
      projects: 'פרויקטים',
      project_updates: 'עדכוני פרויקטים',
      tasks: 'משימות',
      
      // זמנים
      time_entries: 'רישומי זמן',
      time_logs: 'לוגי זמן',
      
      // פגישות ויומן
      meetings: 'פגישות',
      calendar_events: 'אירועי יומן',
      reminders: 'תזכורות',
      
      // הצעות מחיר וחוזים
      quotes: 'הצעות מחיר',
      quote_items: 'פריטי הצעות מחיר',
      quote_templates: 'תבניות הצעות מחיר',
      contracts: 'חוזים',
      contract_templates: 'תבניות חוזים',
      contract_documents: 'מסמכי חוזים',
      contract_amendments: 'תיקוני חוזים',
      
      // כספים
      invoices: 'חשבוניות',
      payments: 'תשלומים',
      payment_schedules: 'לוחות תשלום',
      
      // תקשורת
      call_logs: 'לוגי שיחות',
      whatsapp_log: 'לוגי וואטסאפ',
      notifications: 'התראות',
      
      // מסמכים וחתימות
      documents: 'מסמכים',
      signatures: 'חתימות',
      
      // תהליכי עבודה
      workflows: 'תהליכי עבודה',
      workflow_logs: 'לוגי תהליכים',
      
      // דוחות והגדרות
      custom_reports: 'דוחות מותאמים',
      custom_tables: 'טבלאות מותאמות',
      custom_table_data: 'נתוני טבלאות',
      settings: 'הגדרות',
      user_preferences: 'העדפות משתמש',
      
      // מערכת
      profiles: 'פרופילים',
      roles: 'תפקידים',
      permissions: 'הרשאות',
      audit_log: 'לוג ביקורת',
      activity_logs: 'לוגי פעילות',
      migration_logs: 'לוגי מיגרציות',
      analytics_events: 'אירועי analytics',
      search_history: 'היסטוריית חיפושים',
      user_sessions: 'סשנים',
    };

    return labels[tableName] || tableName;
  }

  /**
   * ייצוא לקובץ
   */
  exportToFile(backup: any, format: 'json' | 'xlsx' = 'json') {
    if (format === 'json') {
      return this.exportToJSON(backup);
    } else {
      return this.exportToExcel(backup);
    }
  }

  private exportToJSON(backup: any) {
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    a.download = `smart-backup-${backup.metadata.name}-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private async exportToExcel(backup: any) {
    // TODO: implement Excel export with XLSX
    console.log('Excel export not implemented yet');
  }
}

// ============================================
// גיבוי אוטומטי מתוזמן
// ============================================

export class AutoBackupScheduler {
  private config: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM
    strategy: BackupStrategy;
    maxBackups: number;
  };

  constructor(config: AutoBackupScheduler['config']) {
    this.config = config;
  }

  /**
   * התחלת גיבוי אוטומטי
   */
  start() {
    if (!this.config.enabled) return;

    const checkInterval = 60000; // כל דקה
    setInterval(() => {
      this.checkAndBackup();
    }, checkInterval);
  }

  private async checkAndBackup() {
    const now = new Date();
    const lastBackup = this.getLastBackupTime();

    if (this.shouldBackup(now, lastBackup)) {
      console.log('🔄 מתחיל גיבוי אוטומטי...');
      await this.performAutoBackup();
    }
  }

  private shouldBackup(now: Date, lastBackup: Date | null): boolean {
    if (!lastBackup) return true;

    const diffHours = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);

    switch (this.config.frequency) {
      case 'daily':
        return diffHours >= 24;
      case 'weekly':
        return diffHours >= 24 * 7;
      case 'monthly':
        return diffHours >= 24 * 30;
      default:
        return false;
    }
  }

  private async performAutoBackup() {
    try {
      const strategy = BACKUP_STRATEGIES[this.config.strategy];
      const backupSystem = new SmartBackupSystem({
        strategy: this.config.strategy,
        ...strategy,
      });

      const backup = await backupSystem.createSmartBackup(
        `auto-backup-${new Date().toISOString()}`
      );

      // שמירה ל-localStorage
      this.saveBackup(backup);
      
      // ניקוי גיבויים ישנים
      this.cleanOldBackups();

      this.setLastBackupTime(new Date());
      
      console.log('✅ גיבוי אוטומטי הושלם בהצלחה');
    } catch (error) {
      console.error('❌ שגיאה בגיבוי אוטומטי:', error);
    }
  }

  private getLastBackupTime(): Date | null {
    const stored = localStorage.getItem('last-auto-backup');
    return stored ? new Date(stored) : null;
  }

  private setLastBackupTime(date: Date) {
    localStorage.setItem('last-auto-backup', date.toISOString());
  }

  private saveBackup(backup: any) {
    const key = 'auto-backups';
    const stored = localStorage.getItem(key);
    const backups = stored ? JSON.parse(stored) : [];
    backups.push(backup);
    localStorage.setItem(key, JSON.stringify(backups));
  }

  private cleanOldBackups() {
    const key = 'auto-backups';
    const stored = localStorage.getItem(key);
    if (!stored) return;

    const backups = JSON.parse(stored);
    if (backups.length > this.config.maxBackups) {
      const cleaned = backups.slice(-this.config.maxBackups);
      localStorage.setItem(key, JSON.stringify(cleaned));
    }
  }
}

export default {
  SmartBackupSystem,
  AutoBackupScheduler,
  BACKUP_TABLES,
  BACKUP_STRATEGIES,
};
