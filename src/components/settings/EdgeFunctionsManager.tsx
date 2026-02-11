// Edge Functions Manager - ניהול פונקציות Edge
import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Code2,
  Play,
  RefreshCcw,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ExternalLink,
  Rocket,
  FileCode,
  Terminal,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const goldGradient = "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600";
const goldBorder = "border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]";
const goldIcon = "text-yellow-500";
const goldBg = "bg-white dark:bg-gray-900";

// Known edge functions from the project
const KNOWN_FUNCTIONS = [
  { name: 'admin-reset-password', description: 'איפוס סיסמה למשתמש על ידי מנהל' },
  { name: 'ai-chat', description: 'צ\'אט AI חכם' },
  { name: 'auto-backup', description: 'גיבוי אוטומטי של המערכת' },
  { name: 'check-reminders', description: 'בדיקת תזכורות פעילות' },
  { name: 'create-admin-user', description: 'יצירת משתמש מנהל חדש' },
  { name: 'create-employee', description: 'יצירת עובד חדש במערכת' },
  { name: 'dev-scripts', description: 'סקריפטים לפיתוח ותחזוקה' },
  { name: 'execute-sql', description: 'הרצת SQL ישירות על הדאטאבייס' },
  { name: 'financial-alerts', description: 'התראות פיננסיות אוטומטיות' },
  { name: 'google-refresh-token', description: 'רענון טוקן Google' },
  { name: 'green-invoice', description: 'חשבוניות ירוקות - חשבונית ירוקה' },
  { name: 'import-backup', description: 'ייבוא גיבוי למערכת' },
  { name: 'invite-client', description: 'שליחת הזמנה ללקוח' },
  { name: 'process-email-queue', description: 'עיבוד תור דואר אלקטרוני' },
  { name: 'resend-webhook', description: 'Webhook עבור Resend' },
  { name: 'send-reminder-email', description: 'שליחת מייל תזכורת' },
  { name: 'send-task-notification', description: 'שליחת התראה על משימה' },
  { name: 'track-email-click', description: 'מעקב לחיצות באימייל' },
  { name: 'track-email-open', description: 'מעקב פתיחת אימייל' },
];

interface FunctionStatus {
  name: string;
  description: string;
  status: 'active' | 'error' | 'unknown';
  lastInvoked?: string;
  lastResponse?: { status: number; body: string };
}

interface TestResult {
  functionName: string;
  status: number;
  body: string;
  duration: number;
  timestamp: string;
}

export function EdgeFunctionsManager() {
  const [functions, setFunctions] = useState<FunctionStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<FunctionStatus | null>(null);
  const [testBody, setTestBody] = useState('{}');
  const [testMethod, setTestMethod] = useState<'GET' | 'POST'>('POST');
  const [expandedFunction, setExpandedFunction] = useState<string | null>(null);
  const [showInvokeDialog, setShowInvokeDialog] = useState(false);
  const [invokeBody, setInvokeBody] = useState('{}');
  const [invokeResult, setInvokeResult] = useState<string | null>(null);
  const [invoking, setInvoking] = useState(false);

  // Load functions list
  const loadFunctions = useCallback(async () => {
    setLoading(true);
    try {
      const fns: FunctionStatus[] = KNOWN_FUNCTIONS.map(f => ({
        ...f,
        status: 'unknown' as const,
      }));
      setFunctions(fns);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFunctions();
  }, [loadFunctions]);

  // Test a function with health check
  const testFunction = useCallback(async (fn: FunctionStatus) => {
    setTesting(fn.name);
    const startTime = Date.now();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const url = `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/${fn.name}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ type: 'health_check' }),
      });

      const duration = Date.now() - startTime;
      let body = '';
      try {
        body = await response.text();
      } catch {
        body = 'No response body';
      }

      const result: TestResult = {
        functionName: fn.name,
        status: response.status,
        body: body.substring(0, 500),
        duration,
        timestamp: new Date().toISOString(),
      };

      setTestResults(prev => [result, ...prev.slice(0, 19)]);

      // Update function status
      setFunctions(prev => prev.map(f => 
        f.name === fn.name 
          ? { 
              ...f, 
              status: response.status < 500 ? 'active' : 'error',
              lastInvoked: new Date().toISOString(),
              lastResponse: { status: response.status, body: body.substring(0, 200) },
            } 
          : f
      ));

      if (response.status < 500) {
        toast.success(`✅ ${fn.name} - פעיל (${duration}ms)`);
      } else {
        toast.error(`❌ ${fn.name} - שגיאה (${response.status})`);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      setTestResults(prev => [{
        functionName: fn.name,
        status: 0,
        body: error.message,
        duration,
        timestamp: new Date().toISOString(),
      }, ...prev.slice(0, 19)]);

      setFunctions(prev => prev.map(f => 
        f.name === fn.name ? { ...f, status: 'error' } : f
      ));

      toast.error(`❌ ${fn.name} - לא ניתן להתחבר`);
    } finally {
      setTesting(null);
    }
  }, []);

  // Test all functions
  const testAllFunctions = useCallback(async () => {
    for (const fn of functions) {
      await testFunction(fn);
    }
  }, [functions, testFunction]);

  // Invoke a function with custom body
  const invokeFunction = useCallback(async () => {
    if (!selectedFunction) return;
    setInvoking(true);
    setInvokeResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const url = `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/${selectedFunction.name}`;
      
      let parsedBody: any;
      try {
        parsedBody = JSON.parse(invokeBody);
      } catch {
        toast.error('JSON לא תקין');
        setInvoking(false);
        return;
      }

      const startTime = Date.now();
      const response = await fetch(url, {
        method: testMethod,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        ...(testMethod === 'POST' ? { body: JSON.stringify(parsedBody) } : {}),
      });

      const duration = Date.now() - startTime;
      const responseText = await response.text();
      
      let formattedResult: string;
      try {
        formattedResult = JSON.stringify(JSON.parse(responseText), null, 2);
      } catch {
        formattedResult = responseText;
      }

      setInvokeResult(`Status: ${response.status} (${duration}ms)\n\n${formattedResult}`);
      
      if (response.status < 400) {
        toast.success(`✅ בוצע בהצלחה (${duration}ms)`);
      } else {
        toast.error(`שגיאה ${response.status}`);
      }
    } catch (error: any) {
      setInvokeResult(`Error: ${error.message}`);
      toast.error('שגיאה בהפעלת הפונקציה');
    } finally {
      setInvoking(false);
    }
  }, [selectedFunction, invokeBody, testMethod]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">✅ פעיל</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">❌ שגיאה</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">⏳ לא נבדק</Badge>;
    }
  };

  const activeCount = functions.filter(f => f.status === 'active').length;
  const errorCount = functions.filter(f => f.status === 'error').length;

  return (
    <>
      <Card className={cn(goldBg, goldBorder)}>
        <div className={cn(goldGradient, "h-1")} />
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Zap className={cn("h-5 w-5", goldIcon)} />
              <CardTitle className="text-lg">⚡ ניהול Edge Functions</CardTitle>
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">
                {functions.length} פונקציות
              </Badge>
              {activeCount > 0 && (
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                  {activeCount} פעילות
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
                  {errorCount} שגיאות
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTestDialog(true)}
                disabled={testResults.length === 0}
                className="border-yellow-500/50 hover:bg-yellow-500/10"
              >
                <Terminal className="h-4 w-4 ml-1" />
                לוגים ({testResults.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={testAllFunctions}
                disabled={loading || testing !== null}
                className="border-yellow-500/50 hover:bg-yellow-500/10"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 ml-1" />
                )}
                בדוק הכל
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadFunctions}
                disabled={loading}
                className="border-yellow-500/50 hover:bg-yellow-500/10"
              >
                <RefreshCcw className={cn("h-4 w-4 ml-1", loading && "animate-spin")} />
                רענן
              </Button>
            </div>
          </div>
          <CardDescription>
            רשימת כל ה-Edge Functions בפרויקט • בדיקת תקינות • הפעלה ידנית • צפייה בלוגים
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-yellow-500/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-yellow-500/5">
                  <TableHead className="text-right w-[200px]">שם הפונקציה</TableHead>
                  <TableHead className="text-right">תיאור</TableHead>
                  <TableHead className="text-center w-[100px]">סטטוס</TableHead>
                  <TableHead className="text-center w-[200px]">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {functions.map((fn) => (
                  <React.Fragment key={fn.name}>
                    <TableRow 
                      className="cursor-pointer hover:bg-yellow-500/5"
                      onClick={() => setExpandedFunction(expandedFunction === fn.name ? null : fn.name)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          {fn.name}
                          {expandedFunction === fn.name ? (
                            <ChevronUp className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fn.description}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(fn.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              testFunction(fn);
                            }}
                            disabled={testing === fn.name}
                            title="בדוק תקינות"
                          >
                            {testing === fn.name ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFunction(fn);
                              setInvokeBody('{}');
                              setInvokeResult(null);
                              setShowInvokeDialog(true);
                            }}
                            title="הפעל ידנית"
                          >
                            <Rocket className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/${fn.name}`;
                              navigator.clipboard.writeText(url);
                              toast.success('URL הועתק');
                            }}
                            title="העתק URL"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedFunction === fn.name && fn.lastResponse && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-muted/30 p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-medium">סטטוס אחרון:</span>
                              <Badge variant={fn.lastResponse.status < 400 ? "default" : "destructive"}>
                                {fn.lastResponse.status}
                              </Badge>
                              {fn.lastInvoked && (
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(fn.lastInvoked).toLocaleString('he-IL')}
                                </span>
                              )}
                            </div>
                            <pre className="text-xs bg-background p-3 rounded border overflow-auto max-h-40 direction-ltr text-left font-mono">
                              {fn.lastResponse.body}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator className="my-4 bg-yellow-500/20" />
          
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl",
            "bg-gradient-to-r from-yellow-500/10 to-orange-500/10",
            "border-2 border-yellow-500/30"
          )}>
            <AlertTriangle className={cn("h-5 w-5 mt-0.5", goldIcon)} />
            <div className="text-sm">
              <p className="font-medium text-yellow-700 dark:text-yellow-300">
                פריסה אוטומטית
              </p>
              <p className="text-yellow-600 dark:text-yellow-400 mt-1">
                Edge Functions נפרסות אוטומטית כשקוד נשמר דרך Lovable. 
                אין צורך בפריסה ידנית - כל שינוי בתיקיית <code className="bg-yellow-500/20 px-1 rounded">supabase/functions/</code> נפרס מיידית.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              לוגי בדיקות Edge Functions
            </DialogTitle>
            <DialogDescription>
              {testResults.length} תוצאות בדיקה אחרונות
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {testResults.map((result, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "p-3 rounded-lg border",
                  result.status > 0 && result.status < 500 
                    ? "border-green-500/30 bg-green-500/5" 
                    : "border-red-500/30 bg-red-500/5"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.status > 0 && result.status < 500 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-mono text-sm font-medium">{result.functionName}</span>
                    <Badge variant="outline">{result.status || 'ERR'}</Badge>
                    <span className="text-xs text-muted-foreground">{result.duration}ms</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(result.timestamp).toLocaleTimeString('he-IL')}
                  </span>
                </div>
                <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-24 direction-ltr text-left font-mono">
                  {result.body}
                </pre>
              </div>
            ))}
            {testResults.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                אין תוצאות בדיקה עדיין. לחץ "בדוק הכל" כדי לבדוק את כל הפונקציות.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoke Function Dialog */}
      <Dialog open={showInvokeDialog} onOpenChange={setShowInvokeDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              הפעלת {selectedFunction?.name}
            </DialogTitle>
            <DialogDescription>
              שלח בקשה ידנית לפונקציה וצפה בתוצאה
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <Label>Method</Label>
                <div className="flex gap-2">
                  <Button
                    variant={testMethod === 'POST' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTestMethod('POST')}
                  >
                    POST
                  </Button>
                  <Button
                    variant={testMethod === 'GET' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTestMethod('GET')}
                  >
                    GET
                  </Button>
                </div>
              </div>
              <div className="space-y-2 flex-[3]">
                <Label>URL</Label>
                <Input
                  readOnly
                  className="font-mono text-xs direction-ltr text-left"
                  value={`${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/${selectedFunction?.name}`}
                />
              </div>
            </div>

            {testMethod === 'POST' && (
              <div className="space-y-2">
                <Label>Request Body (JSON)</Label>
                <Textarea
                  value={invokeBody}
                  onChange={(e) => setInvokeBody(e.target.value)}
                  className="font-mono text-sm h-32 direction-ltr text-left"
                  placeholder='{ "type": "health_check" }'
                />
              </div>
            )}

            <Button
              onClick={invokeFunction}
              disabled={invoking}
              className={cn(goldGradient, "text-black font-bold w-full")}
            >
              {invoking ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 ml-2" />
              )}
              הפעל פונקציה
            </Button>

            {invokeResult && (
              <div className="space-y-2">
                <Label>תוצאה</Label>
                <pre className="text-xs bg-muted p-4 rounded-lg border overflow-auto max-h-60 direction-ltr text-left font-mono whitespace-pre-wrap">
                  {invokeResult}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
