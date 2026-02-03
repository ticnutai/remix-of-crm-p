// Script Runner Component - ממשק הרצת סקריפטים
// tenarch CRM Pro

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Play,
  Search,
  Trash2,
  BarChart3,
  RefreshCcw,
  AlertTriangle,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Terminal,
  Wrench,
  Database,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SqlEditor } from './SqlEditor';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Gold gradient styles
const goldGradient = "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600";
const goldBorder = "border-2 border-yellow-500/50";
const goldIcon = "text-yellow-500";
const goldBg = "bg-white dark:bg-gray-900";

interface ScriptResult {
  success: boolean;
  data?: any[];
  error?: string;
  executionTime?: number;
  rowCount?: number;
}

interface QuickScript {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  script: string;
  type: 'sql' | 'rpc';
  rpcName?: string;
}

const quickScripts: QuickScript[] = [
  {
    id: 'diagnostic',
    name: '🔍 אבחון מערכת',
    description: 'הרצת בדיקת בריאות מלאה',
    icon: Search,
    script: '',
    type: 'rpc',
    rpcName: 'run_system_diagnostic',
  },
  {
    id: 'stats',
    name: '📊 סטטיסטיקות',
    description: 'ספירת רשומות בטבלאות',
    icon: BarChart3,
    script: `SELECT 
  'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'time_entries', COUNT(*) FROM time_entries
ORDER BY table_name;`,
    type: 'sql',
  },
  {
    id: 'recent_activity',
    name: '📋 פעילות אחרונה',
    description: '10 פעולות אחרונות',
    icon: Clock,
    script: `SELECT action, entity_type, entity_id, created_at 
FROM activity_log 
ORDER BY created_at DESC 
LIMIT 10;`,
    type: 'sql',
  },
  {
    id: 'migration_history',
    name: '📜 היסטוריית מיגרציות',
    description: 'מיגרציות אחרונות',
    icon: FileText,
    script: '',
    type: 'rpc',
    rpcName: 'get_migration_history',
  },
  {
    id: 'check_rls',
    name: '⚠️ בדיקת RLS',
    description: 'טבלאות ללא RLS',
    icon: AlertTriangle,
    script: `SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT IN (
    SELECT tablename FROM pg_policies WHERE schemaname = 'public'
  )
ORDER BY tablename;`,
    type: 'sql',
  },
  {
    id: 'orphan_files',
    name: '📋 קבצים יתומים',
    description: 'קבצים ללא קישור',
    icon: Trash2,
    script: `SELECT cf.id, cf.file_name, cf.client_id
FROM client_files cf
LEFT JOIN clients c ON cf.client_id = c.id
WHERE c.id IS NULL
LIMIT 50;`,
    type: 'sql',
  },
];

export function ScriptRunner() {
  const [customScript, setCustomScript] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [dryRun, setDryRun] = useState(false);
  const [verbose, setVerbose] = useState(false);
  const [timeout, setTimeout] = useState(30);
  const [showOutput, setShowOutput] = useState(true);
  
  const executeScript = async (script: string, type: 'sql' | 'rpc', rpcName?: string) => {
    setIsRunning(true);
    setResult(null);
    
    const startTime = Date.now();
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('יש להתחבר כמנהל להרצת סקריפטים');
      }
      
      if (type === 'rpc' && rpcName) {
        // Execute RPC function
        const { data, error } = await supabase.rpc(rpcName as any);
        
        const executionTime = Date.now() - startTime;
        
        if (error) {
          setResult({
            success: false,
            error: error.message,
            executionTime,
          });
          toast.error('הסקריפט נכשל', { description: error.message });
        } else {
          const dataArray = Array.isArray(data) ? data : [data];
          setResult({
            success: true,
            data: dataArray,
            executionTime,
            rowCount: dataArray.length,
          });
          toast.success('הסקריפט הורץ בהצלחה', {
            description: `${executionTime}ms • ${dataArray.length} שורות`
          });
        }
      } else {
        // Execute SQL via edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-sql`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.session.access_token}`,
            },
            body: JSON.stringify({
              sql: script,
              mode: dryRun ? 'dry_run' : 'execute',
            }),
          }
        );
        
        const executionTime = Date.now() - startTime;
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          setResult({
            success: false,
            error: result.error || 'שגיאה לא ידועה',
            executionTime,
          });
          toast.error('הסקריפט נכשל', { description: result.error });
        } else {
          setResult({
            success: true,
            data: result.data || [],
            executionTime,
            rowCount: result.rows_affected ?? result.data?.length ?? 0,
          });
          toast.success(dryRun ? 'בדיקה עברה בהצלחה' : 'הסקריפט הורץ בהצלחה', {
            description: `${executionTime}ms`
          });
        }
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      setResult({
        success: false,
        error: error.message || 'שגיאה לא ידועה',
        executionTime,
      });
      toast.error('שגיאה בהרצת הסקריפט', { description: error.message });
    } finally {
      setIsRunning(false);
    }
  };
  
  const handleQuickScript = (script: QuickScript) => {
    if (script.type === 'rpc') {
      executeScript('', 'rpc', script.rpcName);
    } else {
      setCustomScript(script.script);
      executeScript(script.script, 'sql');
    }
  };
  
  const handleRunCustom = () => {
    if (!customScript.trim()) {
      toast.error('אין סקריפט להרצה');
      return;
    }
    executeScript(customScript, 'sql');
  };
  
  // Render data table
  const renderDataTable = (data: any[]) => {
    if (!data || data.length === 0) {
      return <p className="text-sm text-muted-foreground">אין נתונים להצגה</p>;
    }
    
    const columns = Object.keys(data[0] || {});
    
    return (
      <div className="rounded-lg border border-yellow-500/30 overflow-auto max-h-64">
        <Table>
          <TableHeader>
            <TableRow className="bg-yellow-500/10">
              {columns.map((col) => (
                <TableHead key={col} className="text-right font-mono text-xs">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 50).map((row, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col} className="font-mono text-xs max-w-[200px] truncate">
                    {typeof row[col] === 'object' 
                      ? JSON.stringify(row[col]).slice(0, 100) 
                      : String(row[col] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length > 50 && (
          <p className="p-2 text-center text-xs text-muted-foreground">
            מציג 50 מתוך {data.length} שורות
          </p>
        )}
      </div>
    );
  };
  
  return (
    <Card className={cn(goldBg, goldBorder)}>
      <div className={cn(goldGradient, "h-1")} />
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wrench className={cn("h-5 w-5", goldIcon)} />
          <CardTitle className="text-lg">הרצת סקריפטים</CardTitle>
          <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">
            Admin
          </Badge>
        </div>
        <CardDescription>
          הרץ סקריפטים מובנים או SQL מותאם אישית
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Scripts */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Terminal className={cn("h-4 w-4", goldIcon)} />
            סקריפטים מהירים
          </h4>
          <div className="flex flex-wrap gap-2">
            {quickScripts.map((script) => (
              <Button
                key={script.id}
                variant="outline"
                size="sm"
                onClick={() => handleQuickScript(script)}
                disabled={isRunning}
                className={cn(
                  goldBg,
                  "border-yellow-500/30 hover:border-yellow-500/50 hover:bg-yellow-500/10",
                  "text-xs"
                )}
                title={script.description}
              >
                {script.name}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Custom Script Editor */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Database className={cn("h-4 w-4", goldIcon)} />
            סקריפט מותאם
          </h4>
          <SqlEditor
            value={customScript}
            onChange={setCustomScript}
            minHeight="150px"
            maxHeight="300px"
            placeholder="-- כתוב SQL כאן...&#10;SELECT * FROM profiles LIMIT 10;"
          />
        </div>
        
        {/* Options */}
        <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Switch
              id="dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
              className="data-[state=checked]:bg-yellow-500"
            />
            <Label htmlFor="dry-run" className="text-sm cursor-pointer">
              הרצת בדיקה (Dry Run)
            </Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="verbose"
              checked={verbose}
              onCheckedChange={setVerbose}
              className="data-[state=checked]:bg-yellow-500"
            />
            <Label htmlFor="verbose" className="text-sm cursor-pointer">
              פלט מפורט
            </Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="timeout" className="text-sm">
              Timeout:
            </Label>
            <Input
              id="timeout"
              type="number"
              value={timeout}
              onChange={(e) => setTimeout(parseInt(e.target.value) || 30)}
              className="w-16 h-8 text-center"
              min={5}
              max={120}
            />
            <span className="text-sm text-muted-foreground">שניות</span>
          </div>
        </div>
        
        {/* Run Button */}
        <Button
          onClick={handleRunCustom}
          disabled={isRunning || !customScript.trim()}
          className={cn(
            "w-full",
            goldGradient,
            "text-white font-bold",
            "shadow-lg shadow-yellow-500/30"
          )}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              מריץ...
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              {dryRun ? 'בדוק סקריפט' : 'הרץ סקריפט'}
            </>
          )}
        </Button>
        
        {/* Output */}
        {result && (
          <Collapsible open={showOutput} onOpenChange={setShowOutput}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">
                    {result.success ? 'הסקריפט הורץ בהצלחה' : 'הסקריפט נכשל'}
                  </span>
                  {result.executionTime && (
                    <Badge variant="outline" className="text-xs">
                      {result.executionTime}ms
                    </Badge>
                  )}
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className={cn(
                "rounded-xl p-4 mt-2 space-y-3",
                result.success 
                  ? "bg-green-500/5 border border-green-500/30"
                  : "bg-red-500/5 border border-red-500/30"
              )}>
                {result.success ? (
                  <>
                    <div className="flex items-center gap-4 text-sm">
                      <span>⏱️ זמן: {result.executionTime}ms</span>
                      <span>📊 שורות: {result.rowCount}</span>
                    </div>
                    {result.data && result.data.length > 0 && (
                      renderDataTable(result.data)
                    )}
                  </>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-red-500" />
                    <p className="font-mono text-sm text-red-600 dark:text-red-400">
                      {result.error}
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

export default ScriptRunner;
