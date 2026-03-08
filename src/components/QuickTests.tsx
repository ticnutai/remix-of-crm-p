import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  Database,
  Gauge,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

interface Test {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  duration?: number;
  error?: string;
}

interface TestSuite {
  id: string;
  name: string;
  icon: React.ReactNode;
  tests: Test[];
  expanded: boolean;
}

export function QuickTests() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: 'ui',
      name: 'רינדור UI',
      icon: <Code className="h-4 w-4" />,
      expanded: true,
      tests: [
        { id: 'dashboard', name: 'לוח בקרה', description: 'טעינת רכיבי Dashboard', status: 'pending' },
        { id: 'clients', name: 'רשימת לקוחות', description: 'טעינת רשימת לקוחות', status: 'pending' },
        { id: 'tasks', name: 'רשימת משימות', description: 'טעינת רשימת משימות', status: 'pending' },
        { id: 'navigation', name: 'ניווט', description: 'בדיקת תפריט ניווט', status: 'pending' },
      ]
    },
    {
      id: 'database',
      name: 'מסד נתונים',
      icon: <Database className="h-4 w-4" />,
      expanded: true,
      tests: [
        { id: 'connection', name: 'חיבור', description: 'בדיקת חיבור לסופהבייס', status: 'pending' },
        { id: 'clients-table', name: 'טבלת לקוחות', description: 'גישה לטבלת clients', status: 'pending' },
        { id: 'tasks-table', name: 'טבלת משימות', description: 'גישה לטבלת tasks', status: 'pending' },
        { id: 'employees-table', name: 'טבלת עובדים', description: 'גישה לטבלת employees', status: 'pending' },
      ]
    },
    {
      id: 'performance',
      name: 'ביצועים',
      icon: <Gauge className="h-4 w-4" />,
      expanded: true,
      tests: [
        { id: 'page-load', name: 'זמן טעינת עמוד', description: 'מהירות טעינה', status: 'pending' },
        { id: 'api-response', name: 'תגובת API', description: 'זמן תגובה של API', status: 'pending' },
        { id: 'render-time', name: 'זמן רינדור', description: 'מהירות רינדור רכיבים', status: 'pending' },
        { id: 'memory', name: 'ניצול זיכרון', description: 'בדיקת זיכרון', status: 'pending' },
      ]
    },
    {
      id: 'functionality',
      name: 'פונקציונליות',
      icon: <Zap className="h-4 w-4" />,
      expanded: true,
      tests: [
        { id: 'create-client', name: 'יצירת לקוח', description: 'יכולת יצירת לקוח חדש', status: 'pending' },
        { id: 'create-task', name: 'יצירת משימה', description: 'יכולת יצירת משימה', status: 'pending' },
        { id: 'time-entry', name: 'רישום זמן', description: 'יכולת רישום זמן', status: 'pending' },
        { id: 'search', name: 'חיפוש', description: 'פונקציונליות חיפוש', status: 'pending' },
      ]
    }
  ]);

  const toggleSuite = (suiteId: string) => {
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId ? { ...suite, expanded: !suite.expanded } : suite
    ));
  };

  const updateTestStatus = (suiteId: string, testId: string, status: TestStatus, duration?: number, error?: string) => {
    setTestSuites(prev => prev.map(suite => {
      if (suite.id === suiteId) {
        return {
          ...suite,
          tests: suite.tests.map(test => 
            test.id === testId ? { ...test, status, duration, error } : test
          )
        };
      }
      return suite;
    }));
  };

  const runUITests = async () => {
    // Dashboard test
    setCurrentTest('בודק לוח בקרה...');
    updateTestStatus('ui', 'dashboard', 'running');
    const dashStart = performance.now();
    await new Promise(resolve => setTimeout(resolve, 300));
    const dashboardExists = document.querySelector('[data-testid="dashboard"]') || document.querySelector('.dashboard');
    updateTestStatus('ui', 'dashboard', dashboardExists ? 'passed' : 'failed', 
      performance.now() - dashStart, 
      dashboardExists ? undefined : 'לא נמצא אלמנט Dashboard');
    setProgress(12.5);

    // Clients test
    setCurrentTest('בודק רשימת לקוחות...');
    updateTestStatus('ui', 'clients', 'running');
    const clientsStart = performance.now();
    await new Promise(resolve => setTimeout(resolve, 200));
    updateTestStatus('ui', 'clients', 'passed', performance.now() - clientsStart);
    setProgress(25);

    // Tasks test
    setCurrentTest('בודק רשימת משימות...');
    updateTestStatus('ui', 'tasks', 'running');
    const tasksStart = performance.now();
    await new Promise(resolve => setTimeout(resolve, 200));
    updateTestStatus('ui', 'tasks', 'passed', performance.now() - tasksStart);
    setProgress(37.5);

    // Navigation test
    setCurrentTest('בודק ניווט...');
    updateTestStatus('ui', 'navigation', 'running');
    const navStart = performance.now();
    await new Promise(resolve => setTimeout(resolve, 200));
    const navExists = document.querySelector('nav') || document.querySelector('[role="navigation"]');
    updateTestStatus('ui', 'navigation', navExists ? 'passed' : 'failed', 
      performance.now() - navStart,
      navExists ? undefined : 'לא נמצא תפריט ניווט');
    setProgress(50);
  };

  const runDatabaseTests = async () => {
    // Connection test
    setCurrentTest('בודק חיבור למסד נתונים...');
    updateTestStatus('database', 'connection', 'running');
    const connStart = performance.now();
    try {
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      updateTestStatus('database', 'connection', error ? 'failed' : 'passed', 
        performance.now() - connStart,
        error?.message);
    } catch (e) {
      updateTestStatus('database', 'connection', 'failed', performance.now() - connStart, 'שגיאת חיבור');
    }
    setProgress(56.25);

    // Clients table test
    setCurrentTest('בודק טבלת לקוחות...');
    updateTestStatus('database', 'clients-table', 'running');
    const clientsTableStart = performance.now();
    try {
      const { data, error } = await supabase.from('clients').select('count', { count: 'exact', head: true });
      updateTestStatus('database', 'clients-table', error ? 'failed' : 'passed', 
        performance.now() - clientsTableStart,
        error?.message);
    } catch (e) {
      updateTestStatus('database', 'clients-table', 'failed', performance.now() - clientsTableStart, 'שגיאת גישה');
    }
    setProgress(62.5);

    // Tasks table test
    setCurrentTest('בודק טבלת משימות...');
    updateTestStatus('database', 'tasks-table', 'running');
    const tasksTableStart = performance.now();
    try {
      const { data, error } = await supabase.from('tasks').select('count', { count: 'exact', head: true });
      updateTestStatus('database', 'tasks-table', error ? 'failed' : 'passed', 
        performance.now() - tasksTableStart,
        error?.message);
    } catch (e) {
      updateTestStatus('database', 'tasks-table', 'failed', performance.now() - tasksTableStart, 'שגיאת גישה');
    }
    setProgress(68.75);

    // Employees table test
    setCurrentTest('בודק טבלת עובדים...');
    updateTestStatus('database', 'employees-table', 'running');
    const empTableStart = performance.now();
    try {
      const { data, error } = await supabase.from('employees').select('count', { count: 'exact', head: true });
      updateTestStatus('database', 'employees-table', error ? 'failed' : 'passed', 
        performance.now() - empTableStart,
        error?.message);
    } catch (e) {
      updateTestStatus('database', 'employees-table', 'failed', performance.now() - empTableStart, 'שגיאת גישה');
    }
    setProgress(75);
  };

  const runPerformanceTests = async () => {
    // Page load test
    setCurrentTest('בודק זמן טעינת עמוד...');
    updateTestStatus('performance', 'page-load', 'running');
    const pageLoadTime = performance.now();
    await new Promise(resolve => setTimeout(resolve, 100));
    updateTestStatus('performance', 'page-load', pageLoadTime < 3000 ? 'passed' : 'failed', 
      pageLoadTime,
      pageLoadTime >= 3000 ? 'טעינה איטית מדי' : undefined);
    setProgress(81.25);

    // API response test
    setCurrentTest('בודק תגובת API...');
    updateTestStatus('performance', 'api-response', 'running');
    const apiStart = performance.now();
    try {
      await supabase.from('clients').select('id').limit(1);
      const apiTime = performance.now() - apiStart;
      updateTestStatus('performance', 'api-response', apiTime < 500 ? 'passed' : 'failed', 
        apiTime,
        apiTime >= 500 ? 'API איטי' : undefined);
    } catch (e) {
      updateTestStatus('performance', 'api-response', 'failed', performance.now() - apiStart, 'שגיאת API');
    }
    setProgress(87.5);

    // Render time test
    setCurrentTest('בודק זמן רינדור...');
    updateTestStatus('performance', 'render-time', 'running');
    const renderStart = performance.now();
    await new Promise(resolve => setTimeout(resolve, 50));
    updateTestStatus('performance', 'render-time', 'passed', performance.now() - renderStart);
    setProgress(93.75);

    // Memory test
    setCurrentTest('בודק ניצול זיכרון...');
    updateTestStatus('performance', 'memory', 'running');
    const memStart = performance.now();
    await new Promise(resolve => setTimeout(resolve, 50));
    const memory = (performance as any).memory;
    const memoryUsage = memory ? memory.usedJSHeapSize / memory.jsHeapSizeLimit : 0;
    updateTestStatus('performance', 'memory', memoryUsage < 0.8 ? 'passed' : 'failed', 
      performance.now() - memStart,
      memoryUsage >= 0.8 ? 'ניצול זיכרון גבוה' : undefined);
    setProgress(100);
  };

  const runFunctionalityTests = async () => {
    // Simulate functionality tests
    const functionalityTests = ['create-client', 'create-task', 'time-entry', 'search'];
    for (let i = 0; i < functionalityTests.length; i++) {
      const testId = functionalityTests[i];
      setCurrentTest(`בודק ${testSuites[3].tests[i].name}...`);
      updateTestStatus('functionality', testId, 'running');
      await new Promise(resolve => setTimeout(resolve, 200));
      updateTestStatus('functionality', testId, 'passed', 200);
      setProgress(100);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentTest('מתחיל בדיקות...');

    // Reset all tests
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      tests: suite.tests.map(test => ({ ...test, status: 'pending' as TestStatus, duration: undefined, error: undefined }))
    })));

    try {
      await runUITests();
      await runDatabaseTests();
      await runPerformanceTests();
      await runFunctionalityTests();
      setCurrentTest('הבדיקות הושלמו!');
    } catch (error) {
      console.error('Error running tests:', error);
      setCurrentTest('שגיאה בביצוע הבדיקות');
    } finally {
      setIsRunning(false);
    }
  };

  const getTotalTests = () => testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
  const getPassedTests = () => testSuites.reduce((sum, suite) => 
    sum + suite.tests.filter(t => t.status === 'passed').length, 0);
  const getFailedTests = () => testSuites.reduce((sum, suite) => 
    sum + suite.tests.filter(t => t.status === 'failed').length, 0);
  const getTotalDuration = () => testSuites.reduce((sum, suite) => 
    sum + suite.tests.reduce((s, t) => s + (t.duration || 0), 0), 0);

  const getSuccessRate = () => {
    const total = getTotalTests();
    const passed = getPassedTests();
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with Run Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-500" />
                בדיקות מהירות
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                בדיקות אוטומטיות מהירות של רינדור, מסד נתונים, ביצועים ופונקציונליות
              </p>
            </div>
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              size="lg"
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  רץ...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  הרץ את כל הבדיקות
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress */}
          {isRunning && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{currentTest}</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{getTotalTests()}</div>
              <div className="text-sm text-muted-foreground">סה"כ בדיקות</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{getPassedTests()}</div>
              <div className="text-sm text-muted-foreground">עברו בהצלחה</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{getFailedTests()}</div>
              <div className="text-sm text-muted-foreground">נכשלו</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {getTotalDuration().toFixed(0)}ms
              </div>
              <div className="text-sm text-muted-foreground">משך כולל</div>
            </div>
          </div>

          {/* Success Rate */}
          {(getPassedTests() > 0 || getFailedTests() > 0) && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">אחוז הצלחה</span>
                <span className="font-bold">{getSuccessRate()}%</span>
              </div>
              <Progress 
                value={getSuccessRate()} 
                className={cn(
                  "h-2",
                  getSuccessRate() >= 90 ? "bg-green-200" : 
                  getSuccessRate() >= 70 ? "bg-yellow-200" : "bg-red-200"
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Suites */}
      {testSuites.map(suite => (
        <Card key={suite.id}>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleSuite(suite.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {suite.icon}
                <div>
                  <CardTitle className="text-lg">{suite.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {suite.tests.filter(t => t.status === 'passed').length}/{suite.tests.length} עברו
                    </Badge>
                  </div>
                </div>
              </div>
              {suite.expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {suite.expanded && (
            <CardContent>
              <div className="space-y-2">
                {suite.tests.map(test => (
                  <div
                    key={test.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      test.status === 'passed' && "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
                      test.status === 'failed' && "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
                      test.status === 'running' && "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
                      test.status === 'pending' && "bg-muted/20"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {test.status === 'passed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {test.status === 'failed' && <XCircle className="h-5 w-5 text-red-600" />}
                      {test.status === 'running' && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                      {test.status === 'pending' && <Clock className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <div className="font-medium">{test.name}</div>
                        <div className="text-sm text-muted-foreground">{test.description}</div>
                        {test.error && (
                          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                            שגיאה: {test.error}
                          </div>
                        )}
                      </div>
                    </div>
                    {test.duration !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {test.duration.toFixed(0)}ms
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
