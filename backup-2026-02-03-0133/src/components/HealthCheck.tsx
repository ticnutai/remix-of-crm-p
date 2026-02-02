import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, Eye, EyeOff, Copy, MessageSquare, Check, StopCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TestSafeguards } from '@/lib/testSafeguards';
import { useToast } from '@/hooks/use-toast';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'checking';
  message: string;
  responseTime?: number;
  lastChecked?: Date;
  details?: string;
}

interface TestLog {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

export function HealthCheck() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [testLogs, setTestLogs] = useState<TestLog[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const addLog = (level: TestLog['level'], message: string, data?: any) => {
    const log: TestLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    setTestLogs(prev => [...prev, log]);
    
    // גם ב-console
    const emoji = level === 'success' ? '✅' : level === 'error' ? '❌' : level === 'warning' ? '⚠️' : '🔍';
    console.log(`${emoji} [DEBUG] ${message}`, data || '');
  };

  const checkDatabaseConnection = async (): Promise<HealthMetric> => {
    const start = Date.now();
    console.log('🔍 [DEBUG] בדיקת חיבור למסד נתונים - התחלה');
    try {
      const { error } = await supabase.from('clients').select('count', { count: 'exact', head: true });
      const responseTime = Date.now() - start;
      console.log(`✅ [DEBUG] מסד נתונים הגיב תוך ${responseTime}ms`);
      
      if (error) {
        console.error('❌ [DEBUG] שגיאת מסד נתונים:', error);
        throw error;
      }
      
      return {
        name: 'מסד נתונים',
        status: responseTime < 500 ? 'healthy' : 'warning',
        message: responseTime < 500 ? 'מחובר ופעיל' : 'מחובר אך איטי',
        responseTime,
        lastChecked: new Date(),
        details: `זמן תגובה: ${responseTime}ms`
      };
    } catch (error) {
      const responseTime = Date.now() - start;
      console.error('❌ [DEBUG] שגיאת חיבור למסד נתונים - סוג:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('🔍 [DEBUG] הודעה:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error('🔍 [DEBUG] Stack trace:', error.stack);
      }
      return {
        name: 'מסד נתונים',
        status: 'error',
        message: 'שגיאת חיבור',
        responseTime,
        lastChecked: new Date(),
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      };
    }
  };

  const checkAuthentication = async (): Promise<HealthMetric> => {
    const start = Date.now();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const responseTime = Date.now() - start;
      
      return {
        name: 'אימות משתמשים',
        status: session ? 'healthy' : 'warning',
        message: session ? 'משתמש מחובר' : 'לא מחובר',
        responseTime,
        lastChecked: new Date(),
        details: session ? `משתמש: ${session.user.email}` : 'אין session פעיל'
      };
    } catch (error) {
      return {
        name: 'אימות משתמשים',
        status: 'error',
        message: 'שגיאה',
        responseTime: Date.now() - start,
        lastChecked: new Date(),
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      };
    }
  };

  const checkAllTables = async (): Promise<HealthMetric> => {
    const start = Date.now();
    console.log('🔍 [DEBUG] בדיקת כל הטבלאות - התחלה');
    const tables = [
      'clients', 'employees', 'tasks', 'time_entries', 'meetings',
      'quotes', 'invoices', 'payments', 'files', 'backups',
      'time_logs', 'client_contacts', 'client_sources', 'roles',
      'permissions', 'activity_logs'
    ];
    console.log(`📋 [DEBUG] בודק ${tables.length} טבלאות:`, tables);
    
    const results = await Promise.all(
      tables.map(async (table) => {
        try {
          const { error } = await (supabase.from(table as any) as any).select('count', { count: 'exact', head: true });
          return { table, accessible: !error, error: error?.message };
        } catch {
          return { table, accessible: false, error: 'שגיאת חיבור' };
        }
      })
    );
    
    const inaccessible = results.filter(r => !r.accessible);
    const responseTime = Date.now() - start;
    console.log(`✅ [DEBUG] בדיקת טבלאות הושלמה תוך ${responseTime}ms`);
    console.log(`📊 [DEBUG] ${results.length - inaccessible.length}/${results.length} טבלאות נגישות`);
    if (inaccessible.length > 0) {
      console.error('❌ [DEBUG] טבלאות לא נגישות:', inaccessible.map(t => `${t.table}: ${t.error}`));
    }
    
    return {
      name: 'טבלאות מסד נתונים',
      status: inaccessible.length === 0 ? 'healthy' : inaccessible.length < 3 ? 'warning' : 'error',
      message: `${results.length - inaccessible.length}/${results.length} טבלאות זמינות`,
      responseTime,
      lastChecked: new Date(),
      details: inaccessible.length > 0 
        ? `חסרות: ${inaccessible.map(t => t.table).join(', ')}` 
        : 'כל הטבלאות נגישות'
    };
  };

  const checkStorage = async (): Promise<HealthMetric> => {
    const start = Date.now();
    console.log('🔍 [DEBUG] בדיקת אחסון - התחלה');
    try {
      const { data, error } = await supabase.storage.listBuckets();
      const responseTime = Date.now() - start;
      console.log(`✅ [DEBUG] בדיקת אחסון הושלמה תוך ${responseTime}ms, buckets:`, data?.length || 0);
      
      if (error) {
        console.error('❌ [DEBUG] שגיאת אחסון:', error);
        throw error;
      }
      
      return {
        name: 'אחסון קבצים',
        status: 'healthy',
        message: `${data.length} buckets זמינים`,
        responseTime,
        lastChecked: new Date(),
        details: data.map(b => b.name).join(', ')
      };
    } catch (error) {
      return {
        name: 'אחסון קבצים',
        status: 'error',
        message: 'לא זמין',
        responseTime: Date.now() - start,
        lastChecked: new Date(),
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      };
    }
  };

  const checkPerformance = async (): Promise<HealthMetric> => {
    const start = Date.now();
    try {
      // בדיקת זמן טעינת נתונים בסיסיים
      await Promise.all([
        supabase.from('clients').select('count', { count: 'exact', head: true }),
        supabase.from('tasks').select('count', { count: 'exact', head: true }),
        supabase.from('employees').select('count', { count: 'exact', head: true })
      ]);
      
      const responseTime = Date.now() - start;
      
      return {
        name: 'ביצועים',
        status: responseTime < 1000 ? 'healthy' : responseTime < 2000 ? 'warning' : 'error',
        message: responseTime < 1000 ? 'מעולה' : responseTime < 2000 ? 'סביר' : 'איטי',
        responseTime,
        lastChecked: new Date(),
        details: `זמן לטעינת 3 שאילתות: ${responseTime}ms`
      };
    } catch (error) {
      return {
        name: 'ביצועים',
        status: 'error',
        message: 'שגיאה',
        responseTime: Date.now() - start,
        lastChecked: new Date(),
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      };
    }
  };

  const checkConsoleErrors = (): HealthMetric => {
    console.log('🔍 [DEBUG] בדיקת שגיאות קונסול...');
    // ספירת שגיאות console (אם יש)
    const errorCount = (window as any).__errorCount || 0;
    console.log(`📊 [DEBUG] נמצאו ${errorCount} שגיאות קונסול`);
    
    return {
      name: 'שגיאות JavaScript',
      status: errorCount === 0 ? 'healthy' : errorCount < 5 ? 'warning' : 'error',
      message: errorCount === 0 ? 'אין שגיאות' : `${errorCount} שגיאות`,
      lastChecked: new Date(),
      details: errorCount === 0 ? 'Console נקי' : 'בדוק את ה-console'
    };
  };

  const runAllChecks = async () => {
    // בדיקת rate limit
    const rateLimitCheck = TestSafeguards.checkRateLimit('health-check');
    if (!rateLimitCheck.ok) {
      toast({
        title: "המתן רגע",
        description: rateLimitCheck.error,
        variant: "destructive"
      });
      return;
    }

    setTestLogs([]); // נקה לוגים קודמים
    addLog('info', '========== התחלת בדיקות בריאות ==========');
    const overallStart = Date.now();
    setIsChecking(true);
    
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      const checks = [
        TestSafeguards.withRetry(() => checkDatabaseConnection(), 2, 1000, 'בדיקת מסד נתונים'),
        TestSafeguards.withRetry(() => checkAuthentication(), 2, 1000, 'בדיקת אימות'),
        TestSafeguards.withRetry(() => checkAllTables(), 2, 1000, 'בדיקת טבלאות'),
        TestSafeguards.withRetry(() => checkStorage(), 2, 1000, 'בדיקת אחסון'),
        TestSafeguards.withRetry(() => checkPerformance(), 2, 1000, 'בדיקת ביצועים'),
        Promise.resolve(checkConsoleErrors())
      ].map(check => TestSafeguards.withTimeout(check, 30000, 'בדיקה'));
      
      const results = await Promise.all(checks);
      setMetrics(results);
      
      const overallDuration = Date.now() - overallStart;
      const passed = results.filter(m => m.status === 'healthy').length;
      const warnings = results.filter(m => m.status === 'warning').length;
      const errors = results.filter(m => m.status === 'error').length;
      addLog('success', `========== בדיקות הושלמו תוך ${overallDuration}ms ==========`);
      addLog('info', `תוצאות: ✅ ${passed} תקין | ⚠️ ${warnings} אזהרה | ❌ ${errors} שגיאה`);
    } catch (error) {
      addLog('error', 'שגיאה בהרצת בדיקות', error);
      toast({
        title: "שגיאה בבדיקות",
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
      setAbortController(null);
    }
  };

  const stopChecks = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsChecking(false);
    addLog('warning', 'בדיקות הופסקו על ידי המשתמש');
    toast({
      title: "בדיקות הופסקו",
      description: "הבדיקות הופסקו"
    });
  };

  const downloadReport = () => {
    const report = {
      testType: 'בדיקות בריאות מערכת',
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString('he-IL'),
      summary: {
        total: metrics.length,
        healthy: metrics.filter(m => m.status === 'healthy').length,
        warnings: metrics.filter(m => m.status === 'warning').length,
        errors: metrics.filter(m => m.status === 'error').length
      },
      metrics: metrics.map(m => ({
        name: m.name,
        status: m.status,
        message: m.message,
        details: m.details,
        responseTime: m.responseTime,
        lastChecked: m.lastChecked?.toISOString()
      })),
      logs: testLogs
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-check-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    runAllChecks();
    
    if (autoRefresh) {
      const interval = setInterval(runAllChecks, 60000); // כל דקה
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusIcon = (status: HealthMetric['status']) => {
    switch (status) {
      case 'healthy': return '🟢';
      case 'warning': return '🟡';
      case 'error': return '🔴';
      case 'checking': return '⚪';
    }
  };

  const toggleErrorExpand = (index: number) => {
    setExpandedErrors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const copyError = async (metric: HealthMetric, index: number) => {
    const errorText = `
שגיאה במערכת: ${metric.name}
סטטוס: ${metric.status}
הודעה: ${metric.message}
פרטים: ${metric.details}
זמן: ${metric.lastChecked?.toLocaleString('he-IL')}
${metric.responseTime ? `זמן תגובה: ${metric.responseTime}ms` : ''}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const askCopilot = (metric: HealthMetric) => {
    const errorText = `@workspace שגיאה במערכת בדיקות הבריאות:

מערכת: ${metric.name}
סטטוס: ${metric.status}
הודעה: ${metric.message}
פרטים: ${metric.details}
${metric.responseTime ? `זמן תגובה: ${metric.responseTime}ms` : ''}

בבקשה עזור לי לתקן את השגיאה הזו. מה הסיבה האפשרית ומה הפתרון?`;

    // העתקה ללוח
    navigator.clipboard.writeText(errorText).then(() => {
      alert('✅ השאלה הועתקה ללוח!\n\n📋 עכשיו:\n1. לחץ Ctrl+Shift+I (או Cmd+Shift+I במק)\n2. הדבק את השאלה בצ\'אט של Copilot\n3. Copilot יעזור לך לפתור את הבעיה\n\nאו פשוט פתח את Copilot Chat והדבק (Ctrl+V)');
    }).catch(() => {
      alert('⚠️ לא הצלחתי להעתיק. העתק ידנית:\n\n' + errorText);
    });
  };

  const getStatusColor = (status: HealthMetric['status']) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'checking': return 'bg-gray-400';
    }
  };

  const healthyCount = metrics.filter(m => m.status === 'healthy').length;
  const warningCount = metrics.filter(m => m.status === 'warning').length;
  const errorCount = metrics.filter(m => m.status === 'error').length;
  const overallStatus = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'healthy';

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">בריאות המערכת</h2>
          <p className="text-muted-foreground">מעקב אחר מצב המערכת בזמן אמת</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg ${autoRefresh ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            {autoRefresh ? '🔄 רענון אוטומטי' : '⏸️ מושהה'}
          </button>
          {isChecking && (
            <button
              onClick={stopChecks}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <StopCircle className="inline h-4 w-4 ml-1" /> עצור בדיקות
            </button>
          )}
          <button
            onClick={runAllChecks}
            disabled={isChecking}
            data-test-id="health-check-button"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isChecking ? '⏳ בודק...' : '🔍 בדוק עכשיו'}
          </button>
          {metrics.length > 0 && (
            <button
              onClick={downloadReport}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              📥 הורד דוח
            </button>
          )}
        </div>
      </div>

      {/* סיכום כללי */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={`border-2 ${overallStatus === 'healthy' ? 'border-green-500' : overallStatus === 'warning' ? 'border-yellow-500' : 'border-red-500'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">סטטוס כללי</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStatus === 'healthy' ? '✅ תקין' : overallStatus === 'warning' ? '⚠️ אזהרה' : '❌ בעיה'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">תקין</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">🟢 {healthyCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">אזהרות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">🟡 {warningCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">שגיאות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">🔴 {errorCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* רשימת בדיקות */}
      <div className="grid gap-4 md:grid-cols-2">
        {metrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(metric.status)}`} />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  {metric.name}
                </CardTitle>
                {metric.responseTime && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {metric.responseTime}ms
                  </Badge>
                )}
              </div>
              <CardDescription>{metric.message}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {metric.details}
                </div>
                {metric.lastChecked && (
                  <div className="text-xs text-muted-foreground">
                    נבדק לאחרונה: {metric.lastChecked.toLocaleTimeString('he-IL')}
                  </div>
                )}
                
                {/* כפתורי פעולה לשגיאות */}
                {(metric.status === 'error' || metric.status === 'warning') && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleErrorExpand(index)}
                      className="gap-2"
                    >
                      {expandedErrors.has(index) ? (
                        <>
                          <EyeOff className="h-3 w-3" />
                          הסתר פרטים
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" />
                          הצג פרטים
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyError(metric, index)}
                      className="gap-2"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="h-3 w-3 text-green-500" />
                          הועתק!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          העתק שגיאה
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => askCopilot(metric)}
                      className="gap-2"
                    >
                      <MessageSquare className="h-3 w-3" />
                      שאל Copilot
                    </Button>
                  </div>
                )}
                
                {/* פרטי שגיאה מורחבים */}
                {expandedErrors.has(index) && (metric.status === 'error' || metric.status === 'warning') && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm font-medium text-red-800 mb-2">📋 פרטי השגיאה המלאים:</div>
                    <pre className="text-xs text-red-900 whitespace-pre-wrap font-mono bg-white p-2 rounded border border-red-200">
{`שם המערכת: ${metric.name}
סטטוס: ${metric.status === 'error' ? '🔴 שגיאה' : '🟡 אזהרה'}
הודעה: ${metric.message}
פרטים: ${metric.details}
זמן בדיקה: ${metric.lastChecked?.toLocaleString('he-IL')}
${metric.responseTime ? `זמן תגובה: ${metric.responseTime}ms` : ''}`}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* אזהרות והמלצות */}
      {(warningCount > 0 || errorCount > 0) && (
        <Alert variant={errorCount > 0 ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {errorCount > 0 ? '⚠️ נמצאו בעיות שדורשות טיפול' : '💡 המלצות לשיפור'}
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {metrics.filter(m => m.status === 'error').map((m, i) => (
                <li key={i}>{m.name}: {m.details}</li>
              ))}
              {metrics.filter(m => m.status === 'warning').map((m, i) => (
                <li key={i}>{m.name}: {m.details}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
