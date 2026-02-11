// Edge Functions Manager - ניהול פונקציות Edge
// UI מסודר עם קטגוריות, בדיקות תקינות והפעלה ידנית
import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  RefreshCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Rocket,
  FileCode,
  Terminal,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Mail,
  Shield,
  Database,
  Brain,
  Bell,
  Receipt,
  Code2,
  Info,
  Activity,
  Download,
  Upload,
  FolderUp,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const goldGradient =
  "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600";
const goldBorder =
  "border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]";
const goldIcon = "text-yellow-500";
const goldBg = "bg-white dark:bg-gray-900";

// Categories for Edge Functions
type FunctionCategory =
  | "email"
  | "auth"
  | "backup"
  | "finance"
  | "tasks"
  | "ai"
  | "dev";

interface KnownFunction {
  name: string;
  description: string;
  category: FunctionCategory;
  usedInApp: boolean;
  notes?: string;
}

const CATEGORY_META: Record<
  FunctionCategory,
  {
    label: string;
    icon: typeof Mail;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  email: {
    label: "📧 דואר אלקטרוני",
    icon: Mail,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  auth: {
    label: "🔐 הרשאות ומשתמשים",
    icon: Shield,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  backup: {
    label: "💾 גיבוי ויבוא",
    icon: Database,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  finance: {
    label: "💰 פיננסי וחשבונות",
    icon: Receipt,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  tasks: {
    label: "🔔 משימות ותזכורות",
    icon: Bell,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
  ai: {
    label: "🤖 בינה מלאכותית",
    icon: Brain,
    color: "text-pink-600",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
  },
  dev: {
    label: "🛠️ כלי פיתוח",
    icon: Code2,
    color: "text-gray-600",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
  },
};

const KNOWN_FUNCTIONS: KnownFunction[] = [
  // Email
  {
    name: "process-email-queue",
    description: "עיבוד תור שליחת אימיילים",
    category: "email",
    usedInApp: true,
  },
  {
    name: "send-reminder-email",
    description: "שליחת אימייל תזכורת ללקוח או עובד",
    category: "email",
    usedInApp: true,
  },
  {
    name: "resend-webhook",
    description: "Webhook לקבלת עדכוני סטטוס מ-Resend",
    category: "email",
    usedInApp: true,
  },
  {
    name: "track-email-click",
    description: "מעקב אחר לחיצות על קישורים באימייל",
    category: "email",
    usedInApp: true,
  },
  {
    name: "track-email-open",
    description: "מעקב אחר פתיחת אימיילים",
    category: "email",
    usedInApp: true,
  },
  // Auth
  {
    name: "admin-reset-password",
    description: 'איפוס סיסמה למשתמש ע"י מנהל',
    category: "auth",
    usedInApp: false,
    notes: "מוחלף ב-SQL ישיר",
  },
  {
    name: "create-admin-user",
    description: "יצירת משתמש מנהל ראשי",
    category: "auth",
    usedInApp: true,
  },
  {
    name: "create-employee",
    description: "יצירת חשבון עובד חדש עם הרשאות",
    category: "auth",
    usedInApp: true,
  },
  {
    name: "invite-client",
    description: "שליחת הזמנת הרשמה ללקוח",
    category: "auth",
    usedInApp: true,
  },
  // Backup
  {
    name: "auto-backup",
    description: "גיבוי אוטומטי של כל הנתונים",
    category: "backup",
    usedInApp: true,
  },
  {
    name: "import-backup",
    description: "שחזור נתונים מקובץ גיבוי",
    category: "backup",
    usedInApp: true,
  },
  // Finance
  {
    name: "financial-alerts",
    description: "התראות על תשלומים, חובות ויתרות",
    category: "finance",
    usedInApp: true,
  },
  {
    name: "green-invoice",
    description: "הנפקת חשבוניות דרך חשבונית ירוקה",
    category: "finance",
    usedInApp: true,
  },
  {
    name: "google-refresh-token",
    description: "רענון אסימון Google לשירותים חיצוניים",
    category: "finance",
    usedInApp: true,
  },
  // Tasks
  {
    name: "check-reminders",
    description: "בדיקת תזכורות שהגיע זמנן",
    category: "tasks",
    usedInApp: true,
  },
  {
    name: "send-task-notification",
    description: "שליחת התראה על משימה חדשה/עדכון",
    category: "tasks",
    usedInApp: true,
  },
  // AI
  {
    name: "ai-chat",
    description: "צ׳אט AI חכם לניתוח נתונים ושאלות",
    category: "ai",
    usedInApp: true,
  },
  // Dev
  {
    name: "dev-scripts",
    description: "סקריפטים לפיתוח, תחזוקה ודיבוג",
    category: "dev",
    usedInApp: false,
    notes: "לפיתוח בלבד",
  },
  {
    name: "execute-sql",
    description: "הרצת שאילתות SQL ישירות (מסוכן!)",
    category: "dev",
    usedInApp: false,
    notes: "שימוש זהיר בלבד",
  },
];

interface FunctionStatus {
  name: string;
  description: string;
  category: FunctionCategory;
  usedInApp: boolean;
  notes?: string;
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
  const [showInvokeDialog, setShowInvokeDialog] = useState(false);
  const [invokeBody, setInvokeBody] = useState('{}');
  const [invokeResult, setInvokeResult] = useState<string | null>(null);
  const [invoking, setInvoking] = useState(false);
  const [testMethod, setTestMethod] = useState<'GET' | 'POST'>('POST');
  const [expandedCategory, setExpandedCategory] = useState<FunctionCategory | null>(null);
  const [testingAll, setTestingAll] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; content: string; size: number }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  // Test a single function with health check
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

      setTestResults(prev => [result, ...prev.slice(0, 29)]);

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
        toast.success(`✅ ${fn.name} — פעיל (${duration}ms)`);
      } else {
        toast.error(`❌ ${fn.name} — שגיאה (${response.status})`);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      setTestResults(prev => [{
        functionName: fn.name,
        status: 0,
        body: error.message,
        duration,
        timestamp: new Date().toISOString(),
      }, ...prev.slice(0, 29)]);

      setFunctions(prev => prev.map(f => 
        f.name === fn.name ? { ...f, status: 'error' } : f
      ));

      toast.error(`❌ ${fn.name} — לא ניתן להתחבר`);
    } finally {
      setTesting(null);
    }
  }, []);

  // Test all functions
  const testAllFunctions = useCallback(async () => {
    setTestingAll(true);
    for (const fn of functions) {
      await testFunction(fn);
    }
    setTestingAll(false);
    toast.success('✅ בדיקת כל הפונקציות הושלמה');
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

  // Handle file upload for deployment
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setUploadedFiles(prev => {
          const existing = prev.findIndex(f => f.name === file.name);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = { name: file.name, content, size: file.size };
            return updated;
          }
          return [...prev, { name: file.name, content, size: file.size }];
        });
      };
      reader.readAsText(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Generate & download full test report
  const downloadReport = useCallback(() => {
    const now = new Date();
    const successResults = testResults.filter(r => r.status > 0 && r.status < 500);
    const failedResults = testResults.filter(r => r.status === 0 || r.status >= 500);

    const report = {
      title: 'Edge Functions Health Report — tenarch CRM Pro',
      generatedAt: now.toISOString(),
      generatedAtLocal: now.toLocaleString('he-IL'),
      summary: {
        totalFunctions: functions.length,
        usedInApp: functions.filter(f => f.usedInApp).length,
        tested: functions.filter(f => f.status !== 'unknown').length,
        active: functions.filter(f => f.status === 'active').length,
        errors: functions.filter(f => f.status === 'error').length,
        notTested: functions.filter(f => f.status === 'unknown').length,
      },
      functionsByCategory: Object.fromEntries(
        categories.map(cat => [
          CATEGORY_META[cat].label,
          functions.filter(f => f.category === cat).map(f => ({
            name: f.name,
            description: f.description,
            status: f.status,
            usedInApp: f.usedInApp,
            notes: f.notes || null,
            lastInvoked: f.lastInvoked || null,
            lastResponseStatus: f.lastResponse?.status || null,
            lastResponseBody: f.lastResponse?.body || null,
          }))
        ])
      ),
      successfulTests: successResults.map(r => ({
        function: r.functionName,
        httpStatus: r.status,
        duration: `${r.duration}ms`,
        timestamp: r.timestamp,
        response: r.body,
      })),
      failedTests: failedResults.map(r => ({
        function: r.functionName,
        httpStatus: r.status || 'CONNECTION_ERROR',
        duration: `${r.duration}ms`,
        timestamp: r.timestamp,
        errorBody: r.body,
        possibleCauses: r.status === 0
          ? ['הפונקציה לא נפרסה', 'שגיאת רשת / CORS', 'URL שגוי', 'הפונקציה לא קיימת ב-Supabase']
          : r.status >= 500
            ? ['שגיאה פנימית בפונקציה', 'חסרים משתני סביבה', 'באג בקוד הפונקציה', 'תלות חסרה (import)']
            : r.status === 401 || r.status === 403
              ? ['טוקן לא תקין', 'אין הרשאת גישה', 'סשן פג תוקף']
              : r.status === 400
                ? ['גוף הבקשה לא תקין', 'חסרים פרמטרים']
                : ['שגיאה לא מזוהה'],
      })),
      allTestLogs: testResults.map(r => ({
        function: r.functionName,
        httpStatus: r.status,
        duration: `${r.duration}ms`,
        timestamp: r.timestamp,
        response: r.body,
        success: r.status > 0 && r.status < 500,
      })),
      debugInfo: {
        supabaseUrl: (import.meta as any).env.VITE_SUPABASE_URL,
        userAgent: navigator.userAgent,
        timestamp: now.toISOString(),
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edge-functions-report-${now.toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('📄 דוח בדיקות הורד בהצלחה');
  }, [testResults, functions, categories]);

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">✅ פעיל</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30 text-xs">❌ שגיאה</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground text-xs">⏳ לא נבדק</Badge>;
    }
  };

  const activeCount = functions.filter(f => f.status === 'active').length;
  const errorCount = functions.filter(f => f.status === 'error').length;
  const usedCount = functions.filter(f => f.usedInApp).length;

  // Group functions by category
  const categories = Object.keys(CATEGORY_META) as FunctionCategory[];
  const groupedFunctions = categories.map(cat => ({
    category: cat,
    meta: CATEGORY_META[cat],
    functions: functions.filter(f => f.category === cat),
  })).filter(g => g.functions.length > 0);

  return (
    <>
      <Card className={cn(goldBg, goldBorder)}>
        <div className={cn(goldGradient, "h-1.5")} />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl",
                goldBg,
                "border-2 border-yellow-500/50",
                "shadow-lg shadow-yellow-500/20"
              )}>
                <Zap className={cn("h-6 w-6", goldIcon)} />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  ⚡ Edge Functions
                  <Badge className={cn(goldGradient, "text-white border-0 text-xs")}>
                    {functions.length} פונקציות
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  ניהול ובדיקת כל הפונקציות השרת-צדיות בפרויקט
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {testResults.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTestDialog(true)}
                  className="border-yellow-500/50 hover:bg-yellow-500/10"
                >
                  <Terminal className="h-4 w-4 ml-1" />
                  לוגים ({testResults.length})
                </Button>
              )}
              {testResults.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadReport}
                  className="border-green-500/50 hover:bg-green-500/10 text-green-600"
                >
                  <Download className="h-4 w-4 ml-1" />
                  הורד דוח
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={testAllFunctions}
                disabled={loading || testingAll}
                className="border-yellow-500/50 hover:bg-yellow-500/10"
              >
                {testingAll ? (
                  <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                ) : (
                  <Activity className="h-4 w-4 ml-1" />
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
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl p-3 bg-yellow-500/10 border border-yellow-500/20 text-center">
              <div className="text-2xl font-bold text-yellow-600">{functions.length}</div>
              <div className="text-xs text-muted-foreground">סה״כ פונקציות</div>
            </div>
            <div className="rounded-xl p-3 bg-blue-500/10 border border-blue-500/20 text-center">
              <div className="text-2xl font-bold text-blue-600">{usedCount}</div>
              <div className="text-xs text-muted-foreground">בשימוש פעיל</div>
            </div>
            <div className="rounded-xl p-3 bg-green-500/10 border border-green-500/20 text-center">
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
              <div className="text-xs text-muted-foreground">נבדקו תקין</div>
            </div>
            <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-center">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-xs text-muted-foreground">שגיאות</div>
            </div>
          </div>

          {/* Info Banner */}
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl",
            "bg-gradient-to-r from-blue-500/10 to-indigo-500/10",
            "border border-blue-500/30"
          )}>
            <Info className="h-5 w-5 mt-0.5 text-blue-500 shrink-0" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-blue-700 dark:text-blue-300">
                איך זה עובד?
              </p>
              <p className="text-blue-600/80 dark:text-blue-400/80">
                Edge Functions נפרסות <strong>אוטומטית</strong> כשקוד נשמר דרך Lovable.
                כל שינוי בתיקיית <code className="bg-blue-500/20 px-1.5 py-0.5 rounded text-xs">supabase/functions/</code> נפרס מיידית.
                השתמש בכפתור "בדוק הכל" לוודא שהפונקציות פעילות.
              </p>
            </div>
          </div>

          <Separator className="bg-yellow-500/20" />

          {/* Category Cards */}
          <div className="space-y-3">
            {groupedFunctions.map(({ category, meta, functions: catFns }) => {
              const Icon = meta.icon;
              const isExpanded = expandedCategory === category;
              const catActive = catFns.filter(f => f.status === 'active').length;
              const catError = catFns.filter(f => f.status === 'error').length;

              return (
                <div key={category} className={cn(
                  "rounded-xl border overflow-hidden transition-all",
                  meta.borderColor,
                  isExpanded ? meta.bgColor : "hover:bg-muted/30"
                )}>
                  {/* Category Header */}
                  <button
                    className="w-full flex items-center justify-between p-4 text-right"
                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", meta.bgColor)}>
                        <Icon className={cn("h-5 w-5", meta.color)} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{meta.label}</div>
                        <div className="text-xs text-muted-foreground">{catFns.length} פונקציות</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {catActive > 0 && (
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                          {catActive} פעילות
                        </Badge>
                      )}
                      {catError > 0 && (
                        <Badge className="bg-red-500/20 text-red-600 border-red-500/30 text-xs">
                          {catError} שגיאות
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Functions List */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4 space-y-2">
                      {catFns.map(fn => (
                        <div key={fn.name} className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          "bg-background border transition-all hover:shadow-sm"
                        )}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <FileCode className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-mono text-sm font-medium">{fn.name}</span>
                              {getStatusBadge(fn.status)}
                              {!fn.usedInApp && (
                                <Badge variant="outline" className="text-xs text-muted-foreground">לא פעיל באפליקציה</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 mr-6">
                              {fn.description}
                              {fn.notes && (
                                <span className="text-yellow-600 mr-2">• {fn.notes}</span>
                              )}
                            </div>
                            {fn.lastResponse && (
                              <div className="text-xs text-muted-foreground mt-1 mr-6 flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                סטטוס {fn.lastResponse.status} • {fn.lastInvoked ? new Date(fn.lastInvoked).toLocaleTimeString('he-IL') : ''}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => testFunction(fn)}
                              disabled={testing === fn.name}
                              title="בדוק תקינות"
                              className="h-8 w-8 p-0"
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
                              onClick={() => {
                                setSelectedFunction(fn);
                                setInvokeBody('{}');
                                setInvokeResult(null);
                                setShowInvokeDialog(true);
                              }}
                              title="הפעל ידנית"
                              className="h-8 w-8 p-0"
                            >
                              <Rocket className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const url = `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/${fn.name}`;
                                navigator.clipboard.writeText(url);
                                toast.success('URL הועתק');
                              }}
                              title="העתק URL"
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Warning Note */}
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl",
            "bg-gradient-to-r from-yellow-500/10 to-orange-500/10",
            "border border-yellow-500/30"
          )}>
            <AlertTriangle className={cn("h-5 w-5 mt-0.5 shrink-0", goldIcon)} />
            <div className="text-sm">
              <p className="font-medium text-yellow-700 dark:text-yellow-300">
                💡 שים לב
              </p>
              <p className="text-yellow-600/80 dark:text-yellow-400/80 mt-1">
                בדיקת תקינות שולחת <code className="bg-yellow-500/20 px-1.5 py-0.5 rounded text-xs">health_check</code> לכל פונקציה.
                חלק מהפונקציות עלולות להחזיר שגיאה אם הן מצפות לפרמטרים ספציפיים — זה תקין.
                השתמש ב"הפעל ידנית" כדי לשלוח בקשה מותאמת אישית.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deploy Section */}
      <Card className={cn(goldBg, "border-2 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]")}>
        <div className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-600 h-1.5" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl",
              goldBg,
              "border-2 border-indigo-500/50",
              "shadow-lg shadow-indigo-500/20"
            )}>
              <FolderUp className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                🚀 פריסת Edge Functions
              </CardTitle>
              <CardDescription className="mt-1">
                העלה קבצי פונקציה חדשים ושלח ל-Lovable לפריסה
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* How to Deploy Guide */}
          <div className={cn(
            "p-4 rounded-xl space-y-3",
            "bg-gradient-to-r from-indigo-500/10 to-purple-500/10",
            "border border-indigo-500/30"
          )}>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-indigo-500" />
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">איך לפרוס Edge Function חדשה?</span>
            </div>
            <div className="text-sm text-indigo-600/80 dark:text-indigo-400/80 space-y-2">
              <div className="flex items-start gap-2">
                <Badge className="bg-indigo-500/20 text-indigo-600 border-indigo-500/30 text-xs mt-0.5 shrink-0">1</Badge>
                <span>צור תיקייה בשם הפונקציה תחת <code className="bg-indigo-500/20 px-1.5 py-0.5 rounded text-xs">supabase/functions/שם-הפונקציה/</code></span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-indigo-500/20 text-indigo-600 border-indigo-500/30 text-xs mt-0.5 shrink-0">2</Badge>
                <span>צור קובץ <code className="bg-indigo-500/20 px-1.5 py-0.5 rounded text-xs">index.ts</code> בתוך התיקייה עם הקוד של הפונקציה</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-indigo-500/20 text-indigo-600 border-indigo-500/30 text-xs mt-0.5 shrink-0">3</Badge>
                <span>שמור דרך <strong>Lovable</strong> — הפריסה תקרה <strong>אוטומטית</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-indigo-500/20 text-indigo-600 border-indigo-500/30 text-xs mt-0.5 shrink-0">4</Badge>
                <span>לחלופין — העלה קובץ כאן למטה, והקוד ישמר בפרויקט</span>
              </div>
            </div>
          </div>

          {/* File Upload area */}
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".ts,.js"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-indigo-500/50 hover:bg-indigo-500/10"
              >
                <Upload className="h-4 w-4 ml-2" />
                העלה קבצי Edge Function (.ts / .js)
              </Button>
              {uploadedFiles.length > 0 && (
                <Badge className="bg-indigo-500/20 text-indigo-600 border-indigo-500/30">
                  {uploadedFiles.length} קבצים מוכנים
                </Badge>
              )}
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-background rounded-lg p-3 border">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-indigo-500" />
                      <span className="font-mono font-medium">{f.name}</span>
                      <Badge variant="outline" className="text-xs">{(f.size / 1024).toFixed(1)} KB</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(f.content);
                          toast.success(`📋 תוכן ${f.name} הועתק`);
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        <Copy className="h-3 w-3 ml-1" />
                        העתק קוד
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Instructions after upload */}
                <div className={cn(
                  "p-3 rounded-lg",
                  "bg-gradient-to-r from-green-500/10 to-emerald-500/10",
                  "border border-green-500/30"
                )}>
                  <div className="text-sm space-y-2">
                    <p className="font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      מה עכשיו?
                    </p>
                    <ol className="text-green-600/80 dark:text-green-400/80 space-y-1 mr-6 list-decimal">
                      <li>לחץ "העתק קוד" על הקובץ שהעלית</li>
                      <li>פתח את Lovable ונווט ל <code className="bg-green-500/20 px-1 py-0.5 rounded text-xs">supabase/functions/שם-הפונקציה/index.ts</code></li>
                      <li>הדבק את הקוד ושמור — Lovable יפרוס אוטומטית!</li>
                      <li>חזור לכאן ולחץ "בדוק הכל" לוודא שהפונקציה פעילה</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Direct Lovable Link */}
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl",
            "bg-gradient-to-r from-purple-500/10 to-pink-500/10",
            "border border-purple-500/30"
          )}>
            <Rocket className="h-5 w-5 mt-0.5 text-purple-500 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-purple-700 dark:text-purple-300">
                פריסה ישירה דרך Lovable
              </p>
              <p className="text-purple-600/80 dark:text-purple-400/80 mt-1">
                הדרך הכי פשוטה: פתח את <strong>Lovable</strong>, ערוך או צור קובץ בתיקיית 
                <code className="bg-purple-500/20 px-1.5 py-0.5 rounded text-xs mx-1">supabase/functions/</code>
                ושמור. הפריסה אוטומטית ומיידית.
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
              {selectedFunction?.description}
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