/**
 * useAutoBackup - Hook לניהול גיבוי אוטומטי
 * מנהל את ה-AutoBackupScheduler וסנכרון הגדרות
 */

import { useEffect, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { AutoBackupScheduler, AutoBackupConfig } from '@/lib/smartBackup';

export function useAutoBackup() {
  const { user } = useAuth();
  const [scheduler, setScheduler] = useState<AutoBackupScheduler | null>(null);
  const [status, setStatus] = useState<{
    enabled: boolean;
    lastBackup: Date | null;
    nextBackup: Date | null;
    config: AutoBackupConfig;
  } | null>(null);

  // אתחול ה-scheduler כשמשתמש מתחבר
  useEffect(() => {
    if (!user?.id) {
      // עצירת ה-scheduler אם המשתמש מתנתק
      if (scheduler) {
        scheduler.stop();
        setScheduler(null);
        setStatus(null);
      }
      return;
    }

    // טעינת הגדרות ויצירת instance
    const config = AutoBackupScheduler.loadConfig();
    const instance = AutoBackupScheduler.getInstance(config);
    setScheduler(instance);

    // הפעלה אם מופעל
    if (config.enabled) {
      instance.start();
    }

    // עדכון סטטוס
    setStatus(instance.getStatus());

    // עדכון סטטוס כל 30 שניות
    const statusInterval = setInterval(() => {
      setStatus(instance.getStatus());
    }, 30000);

    return () => {
      clearInterval(statusInterval);
    };
  }, [user?.id]);

  /**
   * עדכון הגדרות הגיבוי
   */
  const updateConfig = useCallback((newConfig: Partial<AutoBackupConfig>) => {
    if (!scheduler) return;

    scheduler.updateConfig(newConfig);
    
    // אם שינו את enabled
    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled) {
        scheduler.start();
      } else {
        scheduler.stop();
      }
    }

    setStatus(scheduler.getStatus());
  }, [scheduler]);

  /**
   * הפעלת גיבוי ידני
   */
  const triggerBackup = useCallback(async () => {
    if (!scheduler) throw new Error('Scheduler not initialized');
    
    const result = await scheduler.triggerManualBackup();
    setStatus(scheduler.getStatus());
    return result;
  }, [scheduler]);

  /**
   * קבלת גיבויים מהענן
   */
  const getCloudBackups = useCallback(async () => {
    if (!scheduler) return [];
    return await scheduler.getCloudBackups();
  }, [scheduler]);

  /**
   * שחזור מגיבוי ענן
   */
  const restoreFromCloud = useCallback(async (fileName: string) => {
    if (!scheduler) throw new Error('Scheduler not initialized');
    return await scheduler.restoreFromCloud(fileName);
  }, [scheduler]);

  /**
   * קבלת היסטוריית גיבויים
   */
  const getHistory = useCallback(() => {
    if (!scheduler) return [];
    return scheduler.getBackupHistory();
  }, [scheduler]);

  return {
    status,
    updateConfig,
    triggerBackup,
    getCloudBackups,
    restoreFromCloud,
    getHistory,
    isReady: !!scheduler,
  };
}
