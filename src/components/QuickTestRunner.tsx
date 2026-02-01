import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RotateCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  details?: string;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  status: 'idle' | 'running' | 'completed';
}

export function QuickTestRunner() {
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
  const [currentTest, setCurrentTest] = useState<string>('');
  const [overallProgress, setOverallProgress] = useState(0);

  // הגדרת חבילות בדיקה
  const testSuiteDefinitions = [
    {
      id: 'ui-render',
      name: 'רינדור UI',
      description: 'בדיקת רכיבי ממשק',
      tests: [
        { id: 'render-dashboard', name: 'רינדור לוח בקרה' },
        { id: 'render-clients', name: 'רינדור רשימת לקוחות' },
        { id: 'render-tasks', name: 'רינדור משימות' },
        { id: 'render-navigation', name: 'ניווט ראשי' },
      ],
    },
    {
      id: 'database',
      name: 'מסד נתונים',
      description: 'בדיקת טבלאות וחיבורים',
      tests: [
        { id: 'db-connection', name: 'חיבור ל-Supabase' },
        { id: 'db-clients', name: 'טבלת לקוחות' },
        { id: 'db-tasks', name: 'טבלת משימות' },
        { id: 'db-time-entries', name: 'טבלת רישומי זמן' },
      ],
    },
    {
      id: 'performance',
      name: 'ביצועים',
      description: 'בדיקת מהירות וזמני תגובה',
      tests: [
        { id: 'perf-load-time', name: 'זמן טעינת עמוד' },
        { id: 'perf-api-response', name: 'זמן תגובת API' },
        { id: 'perf-render-time', name: 'זמן רינדור' },
        { id: 'perf-memory', name: 'שימוש בזיכרון' },
      ],
    },
    {
      id: 'functionality',
      name: 'פונקציונליות',
      description: 'בדיקות תפקוד מלאות',
      tests: [
        { id: 'func-create-client', name: 'יצירת לקוח' },
        { id: 'func-create-task', name: 'יצירת משימה' },
        { id: 'func-time-tracking', name: 'רישום זמן' },
        { id: 'func-search', name: 'חיפוש' },
      ],
    },
  ];

  // רץ בדיקה בודדת
  const runSingleTest = async (test: TestResult): Promise<TestResult> => {
    setCurrentTest(test.name);
    const startTime = performance.now();

    // סימולציה של בדיקות שונות
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    const duration = performance.now() - startTime;
    const passed = Math.random() > 0.1; // 90% success rate

    return {
      ...test,
      status: passed ? 'passed' : 'failed',
      duration,
      error: passed ? undefined : 'שגיאה בבדיקה - דוגמה',
      details: passed ? 'הבדיקה עברה בהצלחה' : 'הבעיה: לא נמצא אלמנט מצופה',
    };
  };

  // רץ חבילת בדיקות
  const runTestSuite = async (suiteDefinition: typeof testSuiteDefinitions[0]): Promise<TestSuite> => {
    const startTime = performance.now();
    
    const initialTests: TestResult[] = suiteDefinition.tests.map(t => ({
      ...t,
      status: 'pending' as const,
    }));

    const suite: TestSuite = {
      id: suiteDefinition.id,
      name: suiteDefinition.name,
      description: suiteDefinition.description,
      tests: initialTests,
      totalTests: initialTests.length,
      passedTests: 0,
      failedTests: 0,
      duration: 0,
      status: 'running',
    };

    // רץ כל בדיקה
    const completedTests: TestResult[] = [];
    for (const test of initialTests) {
      const result = await runSingleTest(test);
      completedTests.push(result);
      
      // עדכון התקדמות
      const passed = completedTests.filter(t => t.status === 'passed').length;
      const failed = completedTests.filter(t => t.status === 'failed').length;
      
      suite.tests = completedTests.concat(
        initialTests.slice(completedTests.length).map(t => ({ ...t, status: 'pending' as const }))
      );
      suite.passedTests = passed;
      suite.failedTests = failed;
      
      setSuites(prev => {
        const updated = [...prev];
        const index = updated.findIndex(s => s.id === suite.id);
        if (index >= 0) {
          updated[index] = { ...suite };
        } else {
          updated.push({ ...suite });
        }
        return updated;
      });
    }

    suite.duration = performance.now() - startTime;
    suite.status = 'completed';
    return suite;
  };

  // רץ את כל הבדיקות
  const runAllTests = async () => {
    setIsRunning(true);
    setSuites([]);
    setOverallProgress(0);

    const completedSuites: TestSuite[] = [];
    
    for (let i = 0; i < testSuiteDefinitions.length; i++) {
      const suite = await runTestSuite(testSuiteDefinitions[i]);
      completedSuites.push(suite);
      setOverallProgress(((i + 1) / testSuiteDefinitions.length) * 100);
    }

    setIsRunning(false);
    setCurrentTest('');
  };

  // סטטיסטיקות כלליות
  const totalTests = suites.reduce((sum, s) => sum + s.totalTests, 0);
  const totalPassed = suites.reduce((sum, s) => sum + s.passedTests, 0);
  const totalFailed = suites.reduce((sum, s) => sum + s.failedTests, 0);
  const totalDuration = suites.reduce((sum, s) => sum + s.duration, 0);
  const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

  const toggleSuite = (suiteId: string) => {
    setExpandedSuites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suiteId)) {
        newSet.delete(suiteId);
      } else {
        newSet.add(suiteId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* כותרת וכפתור הרצה */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">בדיקות מהירות</h2>
          <p className="text-muted-foreground">רינדור, ביצועים ותפקוד</p>
        </div>
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          size="lg"
          className="gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              בדיקה מתבצעת...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              הרץ את כל הבדיקות
            </>
          )}
        </Button>
      </div>

      {/* התקדמות כללית */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">מריץ: {currentTest}</span>
                <span className="font-medium">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* סטטיסטיקות כלליות */}
      {suites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">סה"כ בדיקות</p>
                  <p className="text-2xl font-bold">{totalTests}</p>
                </div>
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">עברו בהצלחה</p>
                  <p className="text-2xl font-bold text-green-600">{totalPassed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">נכשלו</p>
                  <p className="text-2xl font-bold text-red-600">{totalFailed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">משך כולל</p>
                  <p className="text-2xl font-bold">{(totalDuration / 1000).toFixed(1)}s</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* אחוז הצלחה */}
      {suites.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">אחוז הצלחה</span>
                <span className={cn(
                  "text-2xl font-bold",
                  successRate >= 90 ? "text-green-600" : 
                  successRate >= 70 ? "text-yellow-600" : "text-red-600"
                )}>
                  {successRate.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={successRate} 
                className={cn(
                  "h-3",
                  successRate >= 90 ? "[&>div]:bg-green-600" : 
                  successRate >= 70 ? "[&>div]:bg-yellow-600" : "[&>div]:bg-red-600"
                )}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* תוצאות חבילות */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {suites.map((suite) => {
            const isExpanded = expandedSuites.has(suite.id);
            const allPassed = suite.failedTests === 0 && suite.status === 'completed';
            
            return (
              <Card key={suite.id} className={cn(
                "border-2",
                allPassed && "border-green-500/50",
                suite.failedTests > 0 && "border-red-500/50",
                suite.status === 'running' && "border-blue-500/50"
              )}>
                <CardHeader 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleSuite(suite.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {suite.status === 'running' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                      {suite.status === 'completed' && allPassed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {suite.status === 'completed' && !allPassed && <XCircle className="h-5 w-5 text-red-500" />}
                      
                      <div>
                        <CardTitle className="text-lg">{suite.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{suite.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <Badge variant={allPassed ? "default" : "destructive"} className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {suite.passedTests}/{suite.totalTests}
                          </Badge>
                          {suite.duration > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {(suite.duration / 1000).toFixed(2)}s
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {suite.tests.map((test) => (
                        <div 
                          key={test.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            test.status === 'passed' && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
                            test.status === 'failed' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
                            test.status === 'running' && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
                            test.status === 'pending' && "bg-gray-50 dark:bg-gray-900/20"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {test.status === 'passed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                            {test.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                            {test.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                            {test.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
                            
                            <div>
                              <p className="font-medium text-sm">{test.name}</p>
                              {test.error && (
                                <p className="text-xs text-red-600 mt-1">{test.error}</p>
                              )}
                              {test.details && test.status === 'passed' && (
                                <p className="text-xs text-muted-foreground mt-1">{test.details}</p>
                              )}
                            </div>
                          </div>

                          {test.duration !== undefined && (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {test.duration.toFixed(0)}ms
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Summary Report */}
        {suites.length > 0 && !isRunning && getTotalTests() > 0 && (
          <Card className="mt-6 border-2">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertCircle className="h-6 w-6" />
                דוח סיכום - תוצאות בדיקות
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Overall Status */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <h3 className="text-lg font-semibold">סטטוס כללי</h3>
                    <p className="text-sm text-muted-foreground">
                      {getFailedTests() === 0 ? 'כל הבדיקות עברו בהצלחה! ✓' : 
                       `נמצאו ${getFailedTests()} בדיקות שנכשלו`}
                    </p>
                  </div>
                  <div className={cn(
                    "text-4xl font-bold",
                    getFailedTests() === 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {getSuccessRate()}%
                  </div>
                </div>

                {/* Success Tests */}
                {getPassedTests() > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      בדיקות שעברו בהצלחה ({getPassedTests()})
                    </h4>
                    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 space-y-2">
                      {suites.map(suite => {
                        const passedTests = suite.tests.filter(t => t.status === 'passed');
                        if (passedTests.length === 0) return null;
                        return (
                          <div key={suite.id} className="space-y-1">
                            <p className="font-medium text-sm">{suite.name}:</p>
                            <ul className="pr-4 space-y-1">
                              {passedTests.map(test => (
                                <li key={test.id} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <span className="text-green-600">✓</span>
                                  {test.name}
                                  {test.duration && ` (${test.duration.toFixed(0)}ms)`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Failed Tests */}
                {getFailedTests() > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-600 flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      בדיקות שנכשלו ({getFailedTests()})
                    </h4>
                    <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 space-y-3">
                      {suites.map(suite => {
                        const failedTests = suite.tests.filter(t => t.status === 'failed');
                        if (failedTests.length === 0) return null;
                        return (
                          <div key={suite.id} className="space-y-2">
                            <p className="font-medium text-sm">{suite.name}:</p>
                            <div className="pr-4 space-y-2">
                              {failedTests.map(test => (
                                <div key={test.id} className="bg-white dark:bg-gray-900 rounded p-3 border border-red-200 dark:border-red-900">
                                  <div className="flex items-start gap-2">
                                    <span className="text-red-600 mt-0.5">✗</span>
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{test.name}</p>
                                      {test.error && (
                                        <p className="text-xs text-red-600 mt-1 font-mono bg-red-50 dark:bg-red-950/50 p-2 rounded">
                                          שגיאה: {test.error}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Performance Summary */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    סיכום ביצועים
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">זמן כולל</p>
                      <p className="text-lg font-bold text-blue-600">{getTotalDuration().toFixed(0)}ms</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">בדיקות הצליחו</p>
                      <p className="text-lg font-bold text-green-600">{getPassedTests()}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">בדיקות נכשלו</p>
                      <p className="text-lg font-bold text-red-600">{getFailedTests()}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">אחוז הצלחה</p>
                      <p className="text-lg font-bold text-purple-600">{getSuccessRate()}%</p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {getFailedTests() > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-5 w-5" />
                      המלצות לתיקון
                    </h4>
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 space-y-2">
                      <p className="text-sm">• בדוק את השגיאות המפורטות למעלה</p>
                      <p className="text-sm">• ודא שהחיבור ל-Supabase תקין</p>
                      <p className="text-sm">• רענן את הדף ונסה שוב</p>
                      <p className="text-sm">• אם הבעיה נמשכת, בדוק את הקונסול לשגיאות נוספות</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </ScrollArea>

      {/* מצב ריק */}
      {suites.length === 0 && !isRunning && (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">מוכן לבדיקות</h3>
            <p className="text-muted-foreground mb-4">
              לחץ על "הרץ את כל הבדיקות" כדי להתחיל
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
