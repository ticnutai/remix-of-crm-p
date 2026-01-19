// Developer Settings Tab - e-control CRM Pro
// הגדרות פיתוח משודרגות עם שליטה מלאה ועיצוב זהב פרימיום
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Code2,
  Terminal,
  Bug,
  Trash2,
  RefreshCcw,
  Sparkles,
  Info,
  AlertTriangle,
  Gauge,
  Eye,
  Zap,
  Send,
  Power,
  CheckCircle2,
  XCircle,
  Database,
  FileCode,
  ExternalLink,
  Clock,
  Check,
  Loader2,
  GripVertical,
  Settings,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DEV_MODE_KEY = 'dev-tools-enabled';
const DEV_TOOLS_CONFIG_KEY = 'dev-tools-config';
const DEV_BUTTONS_CONFIG_KEY = 'dev-buttons-config';

interface DevToolConfig {
  console: boolean;
  inspector: boolean;
  performance: boolean;
  copilot: boolean;
  emptyPageDetector: boolean;
  gitControls: boolean;
}

interface DevButtonsConfig {
  console: boolean;
  inspector: boolean;
  performance: boolean;
  database: boolean;
  clear: boolean;
  refresh: boolean;
}

const defaultConfig: DevToolConfig = {
  console: true,
  inspector: true,
  performance: true,
  copilot: true,
  emptyPageDetector: true,
  gitControls: true,
};

const defaultFloatingConfig: DevButtonsConfig = {
  console: true,
  inspector: true,
  performance: true,
  database: true,
  clear: true,
  refresh: true,
};

// Gold gradient styles
const goldGradient = "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600";
const goldBorder = "border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]";
const goldIcon = "text-yellow-500";
const goldBg = "bg-white dark:bg-gray-900";

export function DeveloperSettings() {
  const [devMode, setDevMode] = React.useState(() => {
    return localStorage.getItem(DEV_MODE_KEY) === 'true';
  });
  
  const [toolsConfig, setToolsConfig] = useState<DevToolConfig>(() => {
    try {
      const saved = localStorage.getItem(DEV_TOOLS_CONFIG_KEY);
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch {
      return defaultConfig;
    }
  });

  const [floatingConfig, setFloatingConfig] = useState<DevButtonsConfig>(() => {
    try {
      const saved = localStorage.getItem(DEV_BUTTONS_CONFIG_KEY);
      return saved ? { ...defaultFloatingConfig, ...JSON.parse(saved) } : defaultFloatingConfig;
    } catch {
      return defaultFloatingConfig;
    }
  });

  // Save config changes
  useEffect(() => {
    localStorage.setItem(DEV_TOOLS_CONFIG_KEY, JSON.stringify(toolsConfig));
    // Notify DevTools about config changes
    window.dispatchEvent(new CustomEvent('devToolsConfigChanged', { detail: toolsConfig }));
  }, [toolsConfig]);

  // Save floating buttons config changes
  useEffect(() => {
    localStorage.setItem(DEV_BUTTONS_CONFIG_KEY, JSON.stringify(floatingConfig));
    // Notify Floating Buttons about config changes
    window.dispatchEvent(new CustomEvent('devButtonsConfigChanged', { detail: floatingConfig }));
  }, [floatingConfig]);

  const handleDevModeChange = (enabled: boolean) => {
    setDevMode(enabled);
    localStorage.setItem(DEV_MODE_KEY, String(enabled));
    
    if (enabled) {
      toast.success('מצב פיתוח הופעל', {
        description: 'כלי הפיתוח זמינים עכשיו בצד שמאל למטה'
      });
    } else {
      toast.info('מצב פיתוח כבוי');
    }
    
    window.dispatchEvent(new CustomEvent('devModeChanged', { detail: { enabled } }));
  };

  const handleToolToggle = (tool: keyof DevToolConfig, enabled: boolean) => {
    setToolsConfig(prev => ({ ...prev, [tool]: enabled }));
    toast.success(enabled ? `${toolNames[tool]} הופעל` : `${toolNames[tool]} כבוי`);
  };

  const handleFloatingButtonToggle = (button: keyof DevButtonsConfig, enabled: boolean) => {
    setFloatingConfig(prev => ({ ...prev, [button]: enabled }));
    toast.success(enabled ? `${floatingButtonNames[button]} הופעל` : `${floatingButtonNames[button]} כבוי`);
  };

  const handleEnableAll = () => {
    const allEnabled: DevToolConfig = {
      console: true,
      inspector: true,
      performance: true,
      copilot: true,
      emptyPageDetector: true,
      gitControls: true,
    };
    setToolsConfig(allEnabled);
    toast.success('כל הכלים הופעלו');
  };

  const handleDisableAll = () => {
    const allDisabled: DevToolConfig = {
      console: false,
      inspector: false,
      performance: false,
      copilot: false,
      emptyPageDetector: false,
      gitControls: false,
    };
    setToolsConfig(allDisabled);
    toast.info('כל הכלים כבויים');
  };

  const handleClearCache = async () => {
    try {
      const keysToKeep = [DEV_MODE_KEY, DEV_TOOLS_CONFIG_KEY];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      sessionStorage.clear();
      
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      
      toast.success('הקאש נוקה בהצלחה', {
        description: 'רענן את הדף לראות שינויים'
      });
    } catch (error) {
      toast.error('שגיאה בניקוי קאש');
      console.error('Cache clear error:', error);
    }
  };

  const handleHardRefresh = () => {
    window.location.reload();
  };

  const handleRunDiagnostics = () => {
    // Run comprehensive diagnostics
    const diagnostics = runPageDiagnostics();
    
    // Log all diagnostics
    console.group('🔍 אבחון עמוד מלא');
    console.log('📊 מידע כללי:', diagnostics.general);
    console.log('⚡ ביצועים:', diagnostics.performance);
    console.log('🌐 רשת:', diagnostics.network);
    console.log('💾 זיכרון:', diagnostics.memory);
    console.log('🎨 DOM:', diagnostics.dom);
    console.log('❌ שגיאות:', diagnostics.errors);
    console.log('⚠️ אזהרות:', diagnostics.warnings);
    console.groupEnd();
    
    // Show summary toast
    const errorCount = diagnostics.errors.length;
    const warningCount = diagnostics.warnings.length;
    
    if (errorCount > 0) {
      toast.error(`נמצאו ${errorCount} שגיאות ו-${warningCount} אזהרות`, {
        description: 'בדוק את הקונסול לפרטים מלאים'
      });
    } else if (warningCount > 0) {
      toast.warning(`נמצאו ${warningCount} אזהרות`, {
        description: 'בדוק את הקונסול לפרטים מלאים'
      });
    } else {
      toast.success('לא נמצאו בעיות!', {
        description: 'העמוד נראה תקין'
      });
    }
  };

  const toolNames: Record<keyof DevToolConfig, string> = {
    console: 'קונסול מפתחים',
    inspector: 'זיהוי אלמנטים',
    performance: 'מד ביצועים',
    copilot: 'חיבור Copilot',
    emptyPageDetector: 'זיהוי עמוד ריק',
    gitControls: 'בקרות Git',
  };

  const floatingButtonNames: Record<keyof DevButtonsConfig, string> = {
    console: 'קונסול',
    inspector: 'בודק אלמנטים',
    performance: 'ביצועים',
    database: 'מסד נתונים',
    clear: 'נקה Cache',
    refresh: 'רענן דף',
  };

  const allEnabled = Object.values(toolsConfig).every(v => v);
  const allDisabled = Object.values(toolsConfig).every(v => !v);
  const enabledCount = Object.values(toolsConfig).filter(v => v).length;

  const floatingEnabledCount = Object.values(floatingConfig).filter(v => v).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Main Dev Mode Toggle - Premium Gold Design */}
      <Card className={cn(goldBg, goldBorder, "overflow-hidden")}>
        <div className={cn(goldGradient, "h-1")} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-xl",
                goldBg,
                "border-2 border-yellow-500/50",
                "shadow-lg shadow-yellow-500/20"
              )}>
                <Power className={cn("h-6 w-6", goldIcon)} />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  מצב פיתוח
                  {devMode && (
                    <Badge className={cn(goldGradient, "text-white border-0")}>
                      פעיל
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  הפעל כלי פיתוח מתקדמים לדיבוג ובדיקות
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={devMode}
              onCheckedChange={handleDevModeChange}
              className="data-[state=checked]:bg-yellow-500 scale-125"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "rounded-xl p-4 transition-all",
            devMode 
              ? "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-2 border-yellow-500/30" 
              : "bg-muted/50 border border-muted"
          )}>
            <div className="flex items-start gap-3">
              <Info className={cn(
                "h-5 w-5 mt-0.5",
                devMode ? goldIcon : "text-muted-foreground"
              )} />
              <div className="space-y-2 text-sm">
                <p className={devMode ? "text-yellow-700 dark:text-yellow-300 font-medium" : "text-muted-foreground"}>
                  {devMode 
                    ? `מצב פיתוח פעיל - ${enabledCount} כלים מופעלים`
                    : "כשמצב פיתוח פעיל, יופיעו כפתורי כלים בצד שמאל למטה"
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Tool Controls - Premium Gold Cards */}
      {devMode && (
        <Card className={cn(goldBg, goldBorder)}>
          <div className={cn(goldGradient, "h-1")} />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className={cn("h-5 w-5", goldIcon)} />
                <CardTitle className="text-lg">כלי פיתוח</CardTitle>
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">
                  {enabledCount}/5 פעילים
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnableAll}
                  disabled={allEnabled}
                  className={cn(
                    "border-yellow-500/50 hover:bg-yellow-500/10",
                    allEnabled && "opacity-50"
                  )}
                >
                  <CheckCircle2 className={cn("h-4 w-4 mr-2", goldIcon)} />
                  הפעל הכל
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisableAll}
                  disabled={allDisabled}
                  className="hover:bg-destructive/10"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  כבה הכל
                </Button>
              </div>
            </div>
            <CardDescription>
              שליטה מלאה בכל כלי - הפעל או כבה כל אחד בנפרד
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Console Tool */}
              <ToolCard
                icon={Terminal}
                title="📟 קונסול מפתחים"
                description="יירוט console.log/error/warn + זיהוי עמודים ריקים"
                enabled={toolsConfig.console}
                onToggle={(enabled) => handleToolToggle('console', enabled)}
              />

              {/* Element Inspector */}
              <ToolCard
                icon={Eye}
                title="🔍 זיהוי אלמנטים"
                description="לחץ על אלמנט לזהות קומפוננטה וקובץ"
                enabled={toolsConfig.inspector}
                onToggle={(enabled) => handleToolToggle('inspector', enabled)}
              />

              {/* Performance Analyzer */}
              <ToolCard
                icon={Gauge}
                title="⚡ מד ביצועים משופר"
                description="Core Web Vitals, זיכרון, רשת + ניתוח מעמיק"
                enabled={toolsConfig.performance}
                onToggle={(enabled) => handleToolToggle('performance', enabled)}
              />

              {/* Copilot Integration */}
              <ToolCard
                icon={Send}
                title="🤖 חיבור Copilot"
                description="שלח מידע ישירות ל-VS Code Copilot"
                enabled={toolsConfig.copilot}
                onToggle={(enabled) => handleToolToggle('copilot', enabled)}
              />

              {/* Empty Page Detector */}
              <ToolCard
                icon={Bug}
                title="🚨 זיהוי עמוד ריק"
                description="אבחון אוטומטי של בעיות כשעמוד ריק"
                enabled={toolsConfig.emptyPageDetector}
                onToggle={(enabled) => handleToolToggle('emptyPageDetector', enabled)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Dev Buttons Configuration */}
      {devMode && (
        <Card className={cn(goldBg, goldBorder)}>
          <div className={cn(goldGradient, "h-1")} />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className={cn("h-5 w-5", goldIcon)} />
                <CardTitle className="text-lg">כפתורי פיתוח צפים</CardTitle>
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">
                  {floatingEnabledCount}/6 פעילים
                </Badge>
              </div>
            </div>
            <CardDescription>
              שליטה על הכפתורים הצפים - בחר אילו כפתורים להציג
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Console Button */}
              <ToolCard
                icon={Terminal}
                title="📟 קונסול"
                description="פותח חלון קונסול מתקדם"
                enabled={floatingConfig.console}
                onToggle={(enabled) => handleFloatingButtonToggle('console', enabled)}
              />

              {/* Inspector Button */}
              <ToolCard
                icon={Bug}
                title="🐛 בודק אלמנטים"
                description="מצב בדיקת אלמנטים"
                enabled={floatingConfig.inspector}
                onToggle={(enabled) => handleFloatingButtonToggle('inspector', enabled)}
              />

              {/* Performance Button */}
              <ToolCard
                icon={Zap}
                title="⚡ ביצועים"
                description="מוניטור ביצועים"
                enabled={floatingConfig.performance}
                onToggle={(enabled) => handleFloatingButtonToggle('performance', enabled)}
              />

              {/* Database Button */}
              <ToolCard
                icon={Database}
                title="🗄️ מסד נתונים"
                description="בודק מסד נתונים"
                enabled={floatingConfig.database}
                onToggle={(enabled) => handleFloatingButtonToggle('database', enabled)}
              />

              {/* Clear Cache Button */}
              <ToolCard
                icon={Trash2}
                title="🗑️ נקה Cache"
                description="ניקוי זיכרון מטמון"
                enabled={floatingConfig.clear}
                onToggle={(enabled) => handleFloatingButtonToggle('clear', enabled)}
              />

              {/* Refresh Button */}
              <ToolCard
                icon={RefreshCcw}
                title="🔄 רענן דף"
                description="רענון הדף"
                enabled={floatingConfig.refresh}
                onToggle={(enabled) => handleFloatingButtonToggle('refresh', enabled)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Management Section */}
      <MigrationManagement />

      {/* Quick Actions - Premium Gold Design */}
      <Card className={cn(goldBg, goldBorder)}>
        <div className={cn(goldGradient, "h-1")} />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className={cn("h-5 w-5", goldIcon)} />
            פעולות מהירות
          </CardTitle>
          <CardDescription>
            כלים שימושיים לפיתוח ודיבוג
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleRunDiagnostics}
              className={cn(
                goldBg,
                "border-2 border-yellow-500/50 hover:bg-yellow-500/10",
                "shadow-lg shadow-yellow-500/10"
              )}
            >
              <Bug className={cn("h-4 w-4 ml-2", goldIcon)} />
              אבחון עמוד מלא
            </Button>
            
            <Button
              variant="outline"
              onClick={handleClearCache}
              className={cn(
                goldBg,
                "border-2 border-yellow-500/50 hover:bg-yellow-500/10"
              )}
            >
              <Trash2 className={cn("h-4 w-4 ml-2", goldIcon)} />
              נקה קאש מלא
            </Button>
            
            <Button
              variant="outline"
              onClick={handleHardRefresh}
              className={cn(
                goldBg,
                "border-2 border-yellow-500/50 hover:bg-yellow-500/10"
              )}
            >
              <RefreshCcw className={cn("h-4 w-4 ml-2", goldIcon)} />
              רענן דף
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                console.log('🧪 Test log from Developer Settings');
                console.warn('⚠️ Test warning from Developer Settings');
                console.error('❌ Test error from Developer Settings');
                toast.success('נשלחו הודעות בדיקה לקונסול');
              }}
              className={cn(
                goldBg,
                "border-2 border-yellow-500/50 hover:bg-yellow-500/10"
              )}
            >
              <Terminal className={cn("h-4 w-4 ml-2", goldIcon)} />
              בדוק קונסול
            </Button>
          </div>

          <Separator className="bg-yellow-500/20" />

          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl",
            "bg-gradient-to-r from-yellow-500/10 to-orange-500/10",
            "border-2 border-yellow-500/30"
          )}>
            <AlertTriangle className={cn("h-5 w-5 mt-0.5", goldIcon)} />
            <div className="text-sm">
              <p className="font-medium text-yellow-700 dark:text-yellow-300">
                שים לב
              </p>
              <p className="text-yellow-600 dark:text-yellow-400 mt-1">
                כלי הפיתוח מיועדים לסביבת פיתוח בלבד. 
                לא מומלץ להפעיל בסביבת ייצור.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Migration Management Component
interface MigrationLog {
  id: string;
  name: string;
  executed_at: string;
  success: boolean;
  error: string | null;
}

function MigrationManagement() {
  const [migrationLogs, setMigrationLogs] = useState<MigrationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // SQL Upload state
  const [sqlContent, setSqlContent] = useState<string>('');
  const [sqlFileName, setSqlFileName] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const fetchMigrationLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .rpc('get_migration_history');
      
      if (queryError) {
        console.log('Migration history query error:', queryError);
        setError('לא נמצאו לוגים של מיגרציות עדיין');
        setMigrationLogs([]);
      } else {
        setMigrationLogs((data as MigrationLog[]) || []);
        if (data && data.length > 0) {
          toast.success(`נמצאו ${data.length} מיגרציות`);
        }
      }
    } catch (e) {
      console.error('Migration check error:', e);
      setError('שגיאה בטעינת היסטוריית מיגרציות');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.sql')) {
      toast.error('יש להעלות קובץ SQL בלבד');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSqlContent(content);
      setSqlFileName(file.name);
      setShowPreview(true);
      toast.success(`קובץ ${file.name} נטען`, {
        description: `${content.length} תווים`
      });
    };
    reader.onerror = () => {
      toast.error('שגיאה בקריאת הקובץ');
    };
    reader.readAsText(file);
  };

  const handleExecuteMigration = async () => {
    if (!sqlContent.trim()) {
      toast.error('אין תוכן SQL להרצה');
      return;
    }
    
    // Confirm before execution
    if (!window.confirm(`האם להריץ את המיגרציה "${sqlFileName || 'Manual SQL'}"?\n\nזו פעולה שלא ניתן לבטל!`)) {
      return;
    }
    
    setExecuting(true);
    try {
      const { data, error: execError } = await supabase
        .rpc('execute_safe_migration', {
          p_migration_name: sqlFileName || `manual_${Date.now()}`,
          p_migration_sql: sqlContent
        });
      
      if (execError) {
        console.error('Migration execution error:', execError);
        toast.error('שגיאה בהרצת המיגרציה', {
          description: execError.message
        });
        return;
      }
      
      const result = data as { success: boolean; error?: string; message?: string };
      
      if (result.success) {
        toast.success('המיגרציה הורצה בהצלחה! ✅', {
          description: result.message || sqlFileName
        });
        setSqlContent('');
        setSqlFileName('');
        setShowPreview(false);
        // Refresh logs
        await fetchMigrationLogs();
      } else {
        toast.error('המיגרציה נכשלה ❌', {
          description: result.error || 'שגיאה לא ידועה'
        });
      }
    } catch (e: any) {
      console.error('Migration error:', e);
      toast.error('שגיאה בהרצת המיגרציה', {
        description: e.message || 'שגיאה לא ידועה'
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.sql')) {
      toast.error('יש להעלות קובץ SQL בלבד');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setSqlContent(content);
      setSqlFileName(file.name);
      setShowPreview(true);
      toast.success(`קובץ ${file.name} נטען`);
    };
    reader.readAsText(file);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className={cn(goldBg, goldBorder)}>
      <div className={cn(goldGradient, "h-1")} />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className={cn("h-5 w-5", goldIcon)} />
            <CardTitle className="text-lg">ניהול מיגרציות</CardTitle>
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">
              Database
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMigrationLogs}
            disabled={loading}
            className={cn(
              "border-yellow-500/50 hover:bg-yellow-500/10"
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4 ml-2" />
            )}
            בדוק סטטוס
          </Button>
        </div>
        <CardDescription>
          העלה והרץ מיגרציות SQL ישירות מהממשק
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SQL Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "rounded-xl p-6 text-center transition-all cursor-pointer",
            "border-2 border-dashed",
            sqlContent 
              ? "border-green-500/50 bg-green-500/5" 
              : "border-yellow-500/30 hover:border-yellow-500/50 hover:bg-yellow-500/5"
          )}
          onClick={() => document.getElementById('sql-file-input')?.click()}
        >
          <input
            id="sql-file-input"
            type="file"
            accept=".sql"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          {sqlContent ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <span className="font-medium text-green-700 dark:text-green-300">
                  {sqlFileName}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {sqlContent.length.toLocaleString()} תווים • 
                {sqlContent.split('\n').length.toLocaleString()} שורות
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSqlContent('');
                  setSqlFileName('');
                  setShowPreview(false);
                }}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <XCircle className="h-4 w-4 mr-1" />
                נקה
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <FileCode className={cn("h-10 w-10 mx-auto", goldIcon)} />
              <p className="font-medium">גרור קובץ SQL לכאן</p>
              <p className="text-sm text-muted-foreground">
                או לחץ לבחירת קובץ
              </p>
            </div>
          )}
        </div>

        {/* SQL Preview */}
        {showPreview && sqlContent && (
          <div className={cn(
            "rounded-xl overflow-hidden",
            "border-2 border-yellow-500/30"
          )}>
            <div className={cn(
              "flex items-center justify-between px-4 py-2",
              "bg-yellow-500/10 border-b border-yellow-500/30"
            )}>
              <span className="font-medium text-sm flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                תצוגה מקדימה
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <pre className={cn(
              "p-4 overflow-auto max-h-64 text-xs font-mono",
              "bg-gray-900 text-gray-100"
            )}>
              {sqlContent.slice(0, 5000)}
              {sqlContent.length > 5000 && (
                <span className="text-yellow-400">
                  {'\n\n... (עוד {sqlContent.length - 5000} תווים)'}
                </span>
              )}
            </pre>
          </div>
        )}

        {/* Execute Button */}
        {sqlContent && (
          <Button
            onClick={handleExecuteMigration}
            disabled={executing}
            className={cn(
              "w-full",
              goldGradient,
              "text-white font-bold",
              "shadow-lg shadow-yellow-500/30",
              "hover:shadow-yellow-500/50"
            )}
          >
            {executing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                מריץ מיגרציה...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                הרץ מיגרציה
              </>
            )}
          </Button>
        )}

        {/* Error Message */}
        {error && (
          <div className={cn(
            "rounded-xl p-4",
            "bg-yellow-500/10 border-2 border-yellow-500/30"
          )}>
            <div className="flex items-start gap-2">
              <Info className={cn("h-4 w-4 mt-0.5", goldIcon)} />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">{error}</p>
            </div>
          </div>
        )}

        {/* Migration History */}
        {migrationLogs.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Clock className={cn("h-4 w-4", goldIcon)} />
              היסטוריית מיגרציות
            </h4>
            <div className="rounded-xl border border-yellow-500/30 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-yellow-500/10">
                    <TableHead className="text-right">סטטוס</TableHead>
                    <TableHead className="text-right">שם</TableHead>
                    <TableHead className="text-right">תאריך</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {migrationLogs.slice(0, 10).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.success ? (
                          <Badge className="bg-green-500 text-white">
                            <Check className="h-3 w-3 mr-1" />
                            הצלחה
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            נכשל
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">
                        {log.name}
                        {log.error && (
                          <p className="text-xs text-red-500 truncate mt-1">
                            {log.error}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(log.executed_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className={cn(
              goldBg,
              "border-2 border-yellow-500/50 hover:bg-yellow-500/10",
              "shadow-lg shadow-yellow-500/10"
            )}
            onClick={() => {
              // Open Lovable Cloud backend panel
              const backendUrl = `https://lovable.dev/projects/${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'eadeymehidcndudeycnf'}/backend`;
              window.open(backendUrl, '_blank');
              toast.success('פותח את ממשק ה-Backend בחלון חדש');
            }}
          >
            <ExternalLink className={cn("h-4 w-4 ml-2", goldIcon)} />
            פתח Backend
          </Button>
          
          <Button
            variant="outline"
            className={cn(
              goldBg,
              "border-2 border-yellow-500/50 hover:bg-yellow-500/10"
            )}
            onClick={async () => {
              const healthCheckToast = toast.loading('בודק חיבור לדאטאבייס...');
              try {
                // Test multiple tables to verify connectivity
                const [profilesResult, clientsResult, tablesResult] = await Promise.all([
                  supabase.from('profiles').select('*', { count: 'exact', head: true }),
                  supabase.from('clients').select('*', { count: 'exact', head: true }),
                  supabase.from('migration_logs').select('*', { count: 'exact', head: true })
                ]);
                
                const errors = [profilesResult.error, clientsResult.error, tablesResult.error].filter(Boolean);
                
                if (errors.length > 0) {
                  toast.error('בעיה בחיבור לדאטאבייס', {
                    id: healthCheckToast,
                    description: errors[0]?.message || 'שגיאה לא ידועה'
                  });
                  return;
                }
                
                toast.success('הדאטאבייס תקין! ✅', {
                  id: healthCheckToast,
                  description: `${profilesResult.count || 0} פרופילים • ${clientsResult.count || 0} לקוחות • ${tablesResult.count || 0} מיגרציות`
                });
              } catch (e: any) {
                toast.error('שגיאה בבדיקת הדאטאבייס', {
                  id: healthCheckToast,
                  description: e?.message || 'שגיאה לא ידועה'
                });
              }
            }}
          >
            <Database className={cn("h-4 w-4 ml-2", goldIcon)} />
            בדיקת בריאות
          </Button>
        </div>

        <Separator className="bg-yellow-500/20" />

        <div className={cn(
          "flex items-start gap-3 p-4 rounded-xl",
          "bg-gradient-to-r from-green-500/10 to-emerald-500/10",
          "border-2 border-green-500/30"
        )}>
          <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-500" />
          <div className="text-sm">
            <p className="font-medium text-green-700 dark:text-green-300">
              מערכת מאובטחת
            </p>
            <p className="text-green-600 dark:text-green-400 mt-1">
              רק משתמשי Admin יכולים להריץ מיגרציות • כל הפעולות נרשמות בלוג
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Premium Tool Card Component
interface ToolCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

function ToolCard({ icon: Icon, title, description, enabled, onToggle }: ToolCardProps) {
  return (
    <div className={cn(
      "relative p-4 rounded-xl transition-all duration-300",
      goldBg,
      enabled 
        ? "border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20" 
        : "border-2 border-muted hover:border-yellow-500/30"
    )}>
      {/* Active indicator glow */}
      {enabled && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/5 to-yellow-600/5 pointer-events-none" />
      )}
      
      <div className="relative flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-all",
            enabled 
              ? "bg-yellow-500/10 border border-yellow-500/30" 
              : "bg-muted"
          )}>
            <Icon className={cn(
              "h-5 w-5 transition-colors",
              enabled ? goldIcon : "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1">
            <h4 className={cn(
              "font-medium text-sm transition-colors",
              enabled ? "text-foreground" : "text-muted-foreground"
            )}>
              {title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-yellow-500"
        />
      </div>
    </div>
  );
}

// Comprehensive page diagnostics function
function runPageDiagnostics() {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // General page info
  const general = {
    url: window.location.href,
    pathname: window.location.pathname,
    title: document.title || '(ללא כותרת)',
    readyState: document.readyState,
    visibilityState: document.visibilityState,
    referrer: document.referrer || '(ישיר)',
  };
  
  // Check for empty page
  const bodyContent = document.body?.textContent?.trim() || '';
  const mainContent = document.querySelector('main')?.textContent?.trim() || '';
  const appRoot = document.getElementById('root') || document.getElementById('app');
  
  if (bodyContent.length < 50) {
    errors.push('⚠️ העמוד נראה ריק או עם מעט מאוד תוכן');
  }
  
  if (appRoot && (!appRoot.children.length || appRoot.innerHTML.trim().length < 100)) {
    errors.push('❌ אלמנט הבסיס (root/app) ריק או כמעט ריק - ייתכן שגיאת React');
  }
  
  // Check for loading states stuck
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="skeleton"]');
  if (loadingElements.length > 5) {
    warnings.push(`⏳ נמצאו ${loadingElements.length} אלמנטי טעינה - ייתכן שהדף תקוע`);
  }
  
  // Check for error boundaries
  const errorBoundaries = document.querySelectorAll('[class*="error"], [class*="Error"]');
  if (errorBoundaries.length > 0) {
    errorBoundaries.forEach(el => {
      const text = el.textContent?.slice(0, 100);
      if (text?.toLowerCase().includes('error') || text?.toLowerCase().includes('שגיאה')) {
        errors.push(`❌ נמצאה שגיאה בדף: ${text}...`);
      }
    });
  }
  
  // Performance metrics
  let performanceData: any = {};
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
    
    performanceData = {
      domContentLoaded: navigation?.domContentLoadedEventEnd?.toFixed(0) + 'ms',
      loadComplete: navigation?.loadEventEnd?.toFixed(0) + 'ms',
      firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime?.toFixed(0) + 'ms',
      firstContentfulPaint: fcpEntry?.startTime?.toFixed(0) + 'ms',
      ttfb: ((navigation?.responseStart || 0) - (navigation?.requestStart || 0)).toFixed(0) + 'ms',
      resourceCount: resourceEntries.length,
      totalTransferSize: (resourceEntries.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024 / 1024).toFixed(2) + 'MB',
    };
    
    // Performance warnings
    if (navigation?.domContentLoadedEventEnd > 3000) {
      warnings.push(`⏱️ זמן טעינת DOM ארוך: ${navigation.domContentLoadedEventEnd.toFixed(0)}ms`);
    }
    
    if (fcpEntry && fcpEntry.startTime > 2500) {
      warnings.push(`🎨 FCP איטי: ${fcpEntry.startTime.toFixed(0)}ms`);
    }
    
    if (resourceEntries.length > 100) {
      warnings.push(`📦 יותר מדי משאבים: ${resourceEntries.length} בקשות`);
    }
  } catch (e) {
    warnings.push('⚠️ לא ניתן לקרוא מדדי ביצועים');
  }
  
  // Network info
  let networkData: any = { status: 'לא זמין' };
  try {
    const connection = (navigator as any).connection;
    if (connection) {
      networkData = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink + ' Mbps',
        rtt: connection.rtt + 'ms',
        saveData: connection.saveData ? 'כן' : 'לא',
      };
      
      if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
        warnings.push('🌐 חיבור רשת איטי');
      }
    }
  } catch (e) {
    // Network API not available
  }
  
  // Memory info
  let memoryData: any = { status: 'לא זמין' };
  try {
    const memory = (performance as any).memory;
    if (memory) {
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
      const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
      const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1);
      const usagePercent = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1);
      
      memoryData = {
        used: usedMB + 'MB',
        total: totalMB + 'MB',
        limit: limitMB + 'MB',
        usagePercent: usagePercent + '%',
      };
      
      if (parseFloat(usagePercent) > 80) {
        warnings.push(`💾 שימוש גבוה בזיכרון: ${usagePercent}%`);
      }
    }
  } catch (e) {
    // Memory API not available
  }
  
  // DOM analysis
  const allElements = document.querySelectorAll('*');
  const domData = {
    totalElements: allElements.length,
    scripts: document.querySelectorAll('script').length,
    stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
    images: document.querySelectorAll('img').length,
    forms: document.querySelectorAll('form').length,
    buttons: document.querySelectorAll('button').length,
    inputs: document.querySelectorAll('input, textarea, select').length,
    tables: document.querySelectorAll('table').length,
    iframes: document.querySelectorAll('iframe').length,
  };
  
  if (allElements.length > 1500) {
    warnings.push(`🏗️ עץ DOM גדול: ${allElements.length} אלמנטים`);
  }
  
  // Check for common issues
  const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
  if (imagesWithoutAlt.length > 0) {
    warnings.push(`🖼️ ${imagesWithoutAlt.length} תמונות ללא alt`);
  }
  
  const formsWithoutAction = document.querySelectorAll('form:not([action])');
  if (formsWithoutAction.length > 0) {
    warnings.push(`📝 ${formsWithoutAction.length} טפסים ללא action`);
  }
  
  // Check React error overlay
  const reactErrorOverlay = document.querySelector('[class*="react-error-overlay"], #webpack-dev-server-client-overlay');
  if (reactErrorOverlay) {
    errors.push('❌ שגיאת React/Webpack מוצגת');
  }
  
  return {
    general,
    performance: performanceData,
    network: networkData,
    memory: memoryData,
    dom: domData,
    errors,
    warnings,
  };
}

// Export config reader for DevToolsFloat
export function getDevToolsConfig(): DevToolConfig {
  try {
    const saved = localStorage.getItem(DEV_TOOLS_CONFIG_KEY);
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
  } catch {
    return defaultConfig;
  }
}

// Export config reader for FloatingDevButtons
export function getDevButtonsConfig(): DevButtonsConfig {
  try {
    const saved = localStorage.getItem(DEV_BUTTONS_CONFIG_KEY);
    return saved ? { ...defaultFloatingConfig, ...JSON.parse(saved) } : defaultFloatingConfig;
  } catch {
    return defaultFloatingConfig;
  }
}

export type { DevButtonsConfig, DevToolConfig };
