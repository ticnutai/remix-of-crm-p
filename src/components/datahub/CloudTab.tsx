// Cloud Backup Tab Component - טאב גיבוי ענן
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAutoBackup } from '@/hooks/useAutoBackup';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Cloud, 
  CloudUpload, 
  Loader2, 
  RefreshCw, 
  Trash2,
  Clock,
  Database,
  CheckCircle,
  AlertCircle,
  Calendar,
  Settings2,
  Download,
  MoreVertical,
  Play,
  HardDrive,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { CloudBackup, CloudBackupSettings } from './types';

interface CloudTabProps {
  onRestore?: (backup: CloudBackup) => void;
}

const TABLE_NAMES = [
  'clients',
  'projects', 
  'time_entries',
  'tasks',
  'meetings',
  'quotes',
  'custom_tables',
  'custom_table_data',
];

export function CloudTab({ onRestore }: CloudTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { status: autoBackupStatus, updateConfig, triggerBackup, isReady } = useAutoBackup();
  
  // State
  const [cloudBackups, setCloudBackups] = useState<CloudBackup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isTriggeringBackup, setIsTriggeringBackup] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<CloudBackupSettings>({
    autoBackup: false,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    maxBackups: 10,
    selectedTables: TABLE_NAMES,
    saveToCloud: true,
    saveToLocal: true,
    autoDownload: false,
  });
  const [showSettings, setShowSettings] = useState(false);

  // Load settings from autoBackupStatus
  useEffect(() => {
    if (autoBackupStatus?.config) {
      setSettings(prev => ({
        ...prev,
        autoBackup: autoBackupStatus.config.enabled,
        backupFrequency: autoBackupStatus.config.frequency,
        backupTime: autoBackupStatus.config.time,
        maxBackups: autoBackupStatus.config.maxBackups,
        saveToCloud: autoBackupStatus.config.saveToCloud,
        saveToLocal: autoBackupStatus.config.saveToLocal,
        autoDownload: autoBackupStatus.config.autoDownload,
      }));
    }
  }, [autoBackupStatus?.config]);
  
  // Load cloud backups
  const fetchCloudBackups = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('cloud_backups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setCloudBackups((data || []) as CloudBackup[]);
    } catch (error: any) {
      console.error('Error fetching cloud backups:', error);
      // Table might not exist yet
      setCloudBackups([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCloudBackups();
  }, []);
  
  // Create cloud backup
  const createCloudBackup = async () => {
    if (!user) return;
    
    setIsCreating(true);
    setProgress(0);
    
    try {
      // Collect data from all tables
      const backupData: Record<string, any[]> = {};
      let totalRecords = 0;
      
      for (let i = 0; i < settings.selectedTables.length; i++) {
        const tableName = settings.selectedTables[i];
        setProgress((i / settings.selectedTables.length) * 70);
        
        const { data, error } = await (supabase as any)
          .from(tableName)
          .select('*');
        
        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          continue;
        }
        
        if (data && data.length > 0) {
          backupData[tableName] = data;
          totalRecords += data.length;
        }
      }
      
      setProgress(80);
      
      // Create backup record
      const backupName = `גיבוי אוטומטי - ${new Date().toLocaleDateString('he-IL')}`;
      
      const { data: backup, error: createError } = await (supabase as any)
        .from('cloud_backups')
        .insert({
          name: backupName,
          created_by: user.id,
          tables_count: Object.keys(backupData).length,
          records_count: totalRecords,
          backup_data: backupData,
          status: 'active',
          source: 'manual',
        })
        .select()
        .single();
      
      if (createError) {
        // If table doesn't exist, create it first
        if (createError.code === '42P01') {
          toast({
            title: 'טבלת גיבויי ענן לא קיימת',
            description: 'יש ליצור את הטבלה במסד הנתונים תחילה',
            variant: 'destructive',
          });
          return;
        }
        throw createError;
      }
      
      setProgress(100);
      
      toast({
        title: 'גיבוי ענן נוצר! ☁️',
        description: `נשמרו ${totalRecords} רשומות מ-${Object.keys(backupData).length} טבלאות`,
      });
      
      fetchCloudBackups();
      
    } catch (error: any) {
      console.error('Cloud backup error:', error);
      toast({
        title: 'שגיאה ביצירת גיבוי',
        description: error.message || 'לא ניתן ליצור גיבוי ענן',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
      setProgress(0);
    }
  };
  
  // Delete cloud backup
  const deleteCloudBackup = async (backupId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('cloud_backups')
        .delete()
        .eq('id', backupId);
      
      if (error) throw error;
      
      setCloudBackups(prev => prev.filter(b => b.id !== backupId));
      
      toast({
        title: 'גיבוי נמחק',
        description: 'הגיבוי הוסר מהענן',
      });
    } catch (error: any) {
      toast({
        title: 'שגיאה במחיקה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmId(null);
    }
  };
  
  // Download backup as JSON
  const downloadBackup = async (backup: CloudBackup) => {
    try {
      const { data, error } = await (supabase as any)
        .from('cloud_backups')
        .select('backup_data')
        .eq('id', backup.id)
        .single();
      
      if (error) throw error;
      
      const exportData = {
        metadata: {
          createdAt: backup.created_at,
          name: backup.name,
          tablesCount: backup.tables_count,
          recordsCount: backup.records_count,
        },
        data: (data as any)?.backup_data,
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cloud-backup-${backup.id.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'גיבוי הורד',
        description: 'הקובץ נשמר במחשב שלך',
      });
    } catch (error: any) {
      toast({
        title: 'שגיאה בהורדה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Format file size
  const formatSize = (bytes?: number) => {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <div className="p-4 space-y-6">
      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-500" />
              גיבוי ענן
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            גיבויים נשמרים בענן ונגישים מכל מקום
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCreating && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                יוצר גיבוי... {Math.round(progress)}%
              </p>
            </div>
          )}
          
          <Button
            className="w-full gap-2"
            onClick={createCloudBackup}
            disabled={isCreating}
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CloudUpload className="w-4 h-4" />
            )}
            צור גיבוי ענן חדש
          </Button>
        </CardContent>
      </Card>
      
      {/* Settings panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>הגדרות גיבוי אוטומטי</span>
              {autoBackupStatus?.lastBackup && (
                <Badge variant="outline" className="text-xs font-normal">
                  גיבוי אחרון: {formatDate(autoBackupStatus.lastBackup.toISOString())}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>גיבוי אוטומטי</Label>
                <p className="text-xs text-muted-foreground">
                  יצירת גיבוי אוטומטית בזמן קבוע
                </p>
              </div>
              <Switch
                checked={settings.autoBackup}
                onCheckedChange={(checked) => {
                  setSettings(prev => ({ ...prev, autoBackup: checked }));
                  updateConfig({ enabled: checked });
                  toast({
                    title: checked ? 'גיבוי אוטומטי הופעל' : 'גיבוי אוטומטי כבוי',
                    description: checked 
                      ? `יגבה כל ${settings.backupFrequency === 'hourly' ? 'שעה' : settings.backupFrequency === 'daily' ? 'יום' : settings.backupFrequency === 'weekly' ? 'שבוע' : 'חודש'}`
                      : 'הגיבוי האוטומטי הושבת',
                  });
                }}
              />
            </div>
            
            {settings.autoBackup && (
              <>
                {/* כפתור גיבוי ידני */}
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={async () => {
                    setIsTriggeringBackup(true);
                    try {
                      await triggerBackup();
                      toast({
                        title: 'גיבוי הושלם! ✅',
                        description: 'הגיבוי נשמר בהצלחה לפי ההגדרות',
                      });
                      fetchCloudBackups();
                    } catch (error: any) {
                      toast({
                        title: 'שגיאה בגיבוי',
                        description: error.message,
                        variant: 'destructive',
                      });
                    } finally {
                      setIsTriggeringBackup(false);
                    }
                  }}
                  disabled={isTriggeringBackup}
                >
                  {isTriggeringBackup ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  הפעל גיבוי עכשיו
                </Button>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>תדירות</Label>
                    <Select 
                      value={settings.backupFrequency}
                      onValueChange={(v: any) => {
                        setSettings(prev => ({ ...prev, backupFrequency: v }));
                        updateConfig({ frequency: v });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">שעתי</SelectItem>
                        <SelectItem value="daily">יומי</SelectItem>
                        <SelectItem value="weekly">שבועי</SelectItem>
                        <SelectItem value="monthly">חודשי</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>שעה</Label>
                    <Input
                      type="time"
                      value={settings.backupTime}
                      onChange={(e) => {
                        setSettings(prev => ({ ...prev, backupTime: e.target.value }));
                        updateConfig({ time: e.target.value });
                      }}
                    />
                  </div>
                </div>
                
                {/* יעדי גיבוי */}
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    יעדי גיבוי
                  </Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">שמירה לענן ☁️</Label>
                      <p className="text-xs text-muted-foreground">
                        גיבוי ל-Supabase Storage
                      </p>
                    </div>
                    <Switch
                      checked={settings.saveToCloud ?? true}
                      onCheckedChange={(checked) => {
                        setSettings(prev => ({ ...prev, saveToCloud: checked }));
                        updateConfig({ saveToCloud: checked });
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">שמירה מקומית 💾</Label>
                      <p className="text-xs text-muted-foreground">
                        גיבוי ל-localStorage בדפדפן
                      </p>
                    </div>
                    <Switch
                      checked={settings.saveToLocal ?? true}
                      onCheckedChange={(checked) => {
                        setSettings(prev => ({ ...prev, saveToLocal: checked }));
                        updateConfig({ saveToLocal: checked });
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">הורדה אוטומטית 📥</Label>
                      <p className="text-xs text-muted-foreground">
                        הורדת קובץ JSON למחשב בכל גיבוי
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoDownload ?? false}
                      onCheckedChange={(checked) => {
                        setSettings(prev => ({ ...prev, autoDownload: checked }));
                        updateConfig({ autoDownload: checked });
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>מספר גיבויים לשמור</Label>
                  <Input
                    type="number"
                    min={3}
                    max={30}
                    value={settings.maxBackups}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 7;
                      setSettings(prev => ({ ...prev, maxBackups: val }));
                      updateConfig({ maxBackups: val });
                    }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Backups list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>גיבויים קיימים</span>
            <Button variant="ghost" size="sm" onClick={fetchCloudBackups}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : cloudBackups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cloud className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>אין גיבויי ענן</p>
              <p className="text-sm">צור גיבוי ראשון לשמירת הנתונים בענן</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {cloudBackups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Cloud className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{backup.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(backup.created_at)}
                          <span>•</span>
                          <Database className="w-3 h-3" />
                          {backup.records_count} רשומות
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {backup.tables_count} טבלאות
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => onRestore?.(backup)}
                            className="gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            שחזר
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => downloadBackup(backup)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            הורד
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteConfirmId(backup.id)}
                            className="gap-2 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            מחק
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת גיבוי</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הגיבוי? פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirmId && deleteCloudBackup(deleteConfirmId)}
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
