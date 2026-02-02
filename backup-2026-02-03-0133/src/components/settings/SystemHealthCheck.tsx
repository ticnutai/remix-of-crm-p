// System Health Check Component
// קומפוננטה לבדיקת תקינות המערכת

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  Database,
  Shield,
  Code2,
  Link2,
  HardDrive,
  RefreshCcw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface HealthCheckResult {
  timestamp: string;
  database: string;
  version: string;
  status: string;
  summary: {
    total_tables: number;
    total_rows: number;
    total_functions: number;
    total_policies: number;
    total_foreign_keys: number;
    unused_indexes: number;
  };
  storage: {
    database_size: string;
    database_size_bytes: number;
    total_tables: number;
    total_rows: number;
    total_data_size: string;
  };
  tables: Array<{
    name: string;
    rows: number;
    size: string;
    size_bytes: number;
    last_vacuum: string;
    last_analyze: string;
  }>;
  indexes: Array<{
    table: string;
    index: string;
    size: string;
    times_used: number;
    unused: boolean;
  }>;
  foreign_keys: Array<{
    table: string;
    column: string;
    references_table: string;
    references_column: string;
    constraint: string;
  }>;
  functions: Array<{
    name: string;
    arguments: string;
    returns: string;
    security: string;
  }>;
  policies: Array<{
    table: string;
    policy: string;
    permissive: string;
    roles: string[];
    command: string;
  }>;
  recent_migrations: Array<{
    name: string;
    executed_at: string;
    success: boolean;
    error: string | null;
  }>;
}

interface QuickCheckResult {
  timestamp: string;
  status: 'HEALTHY' | 'ISSUES_FOUND';
  counts: {
    tables: number;
    functions: number;
    policies: number;
  };
  issues: Array<{
    type: 'warning' | 'error';
    message: string;
    details?: string;
  }>;
  database_size: string;
}

export function SystemHealthCheck() {
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [fullResult, setFullResult] = useState<HealthCheckResult | null>(null);
  const [quickResult, setQuickResult] = useState<QuickCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tables: true,
    indexes: false,
    functions: false,
    policies: false,
    foreignKeys: false,
    migrations: false,
  });

  const runQuickCheck = async () => {
    setQuickLoading(true);
    setError(null);
    try {
      // Use type assertion to bypass TypeScript strict checking for dynamic RPC calls
      const { data, error: rpcError } = await (supabase.rpc as any)('quick_health_check');
      
      if (rpcError) throw rpcError;
      
      setQuickResult(data as unknown as QuickCheckResult);
      toast.success('בדיקה מהירה הושלמה');
    } catch (err: any) {
      console.error('Quick check error:', err);
      setError(err.message);
      toast.error('שגיאה בבדיקה', { description: err.message });
    } finally {
      setQuickLoading(false);
    }
  };

  const runFullCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use type assertion to bypass TypeScript strict checking for dynamic RPC calls
      const { data, error: rpcError } = await (supabase.rpc as any)('run_system_health_check');
      
      if (rpcError) throw rpcError;
      
      setFullResult(data as unknown as HealthCheckResult);
      toast.success('בדיקה מלאה הושלמה');
    } catch (err: any) {
      console.error('Full check error:', err);
      setError(err.message);
      toast.error('שגיאה בבדיקה', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success('הועתק ללוח');
  };

  const downloadReport = (format: 'json' | 'txt' = 'txt') => {
    if (!fullResult) return;
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(fullResult, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-check-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('הדוח הורד בפורמט JSON');
      return;
    }

    // Generate readable Hebrew report
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                    דוח בדיקת תקינות מערכת                      ');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`תאריך: ${new Date(fullResult.timestamp).toLocaleString('he-IL')}`);
    lines.push(`מסד נתונים: ${fullResult.database}`);
    lines.push(`סטטוס: ${fullResult.status}`);
    lines.push('');
    
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                           סיכום                               ');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push(`סה"כ טבלאות: ${fullResult.summary.total_tables}`);
    lines.push(`סה"כ שורות: ${fullResult.summary.total_rows.toLocaleString('he-IL')}`);
    lines.push(`סה"כ פונקציות: ${fullResult.summary.total_functions}`);
    lines.push(`סה"כ מדיניות אבטחה: ${fullResult.summary.total_policies}`);
    lines.push(`סה"כ מפתחות זרים: ${fullResult.summary.total_foreign_keys}`);
    lines.push('');
    
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                         אחסון                                 ');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push(`גודל מסד הנתונים: ${fullResult.storage.database_size}`);
    lines.push(`גודל הנתונים: ${fullResult.storage.total_data_size}`);
    lines.push('');
    
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                         טבלאות                                ');
    lines.push('───────────────────────────────────────────────────────────────');
    fullResult.tables.forEach((table, i) => {
      lines.push(`${i + 1}. ${table.name}`);
      lines.push(`   שורות: ${table.rows.toLocaleString('he-IL')} | גודל: ${table.size}`);
    });
    lines.push('');
    
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                        פונקציות RPC                           ');
    lines.push('───────────────────────────────────────────────────────────────');
    fullResult.functions.forEach((func, i) => {
      lines.push(`${i + 1}. ${func.name}(${func.arguments || ''})`);
      lines.push(`   מחזיר: ${func.returns} | אבטחה: ${func.security}`);
    });
    lines.push('');
    
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                      מדיניות אבטחה (RLS)                      ');
    lines.push('───────────────────────────────────────────────────────────────');
    const policyByTable: Record<string, typeof fullResult.policies> = {};
    fullResult.policies.forEach(p => {
      if (!policyByTable[p.table]) policyByTable[p.table] = [];
      policyByTable[p.table].push(p);
    });
    Object.entries(policyByTable).forEach(([table, policies]) => {
      lines.push(`טבלה: ${table}`);
      policies.forEach(p => {
        lines.push(`  - ${p.policy} (${p.command})`);
      });
    });
    lines.push('');
    
    if (fullResult.indexes.length > 0) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('                        אינדקסים                              ');
      lines.push('───────────────────────────────────────────────────────────────');
      fullResult.indexes.forEach((idx, i) => {
        const status = idx.unused ? '⚠️ לא בשימוש' : '✓ פעיל';
        lines.push(`${i + 1}. ${idx.index} (${idx.table}) - ${status}`);
        lines.push(`   שימושים: ${idx.times_used}`);
      });
      lines.push('');
    }
    
    if (fullResult.foreign_keys.length > 0) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('                       מפתחות זרים                            ');
      lines.push('───────────────────────────────────────────────────────────────');
      fullResult.foreign_keys.forEach((fk, i) => {
        lines.push(`${i + 1}. ${fk.table}.${fk.column} → ${fk.references_table}.${fk.references_column}`);
      });
      lines.push('');
    }
    
    if (fullResult.recent_migrations.length > 0) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('                     מיגרציות אחרונות                         ');
      lines.push('───────────────────────────────────────────────────────────────');
      fullResult.recent_migrations.forEach((m, i) => {
        const status = m.success ? '✓ הצליח' : '✗ נכשל';
        lines.push(`${i + 1}. ${m.name} - ${status}`);
        lines.push(`   תאריך: ${new Date(m.executed_at).toLocaleString('he-IL')}`);
        if (m.error) lines.push(`   שגיאה: ${m.error}`);
      });
    }
    
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                      סוף הדוח                                 ');
    lines.push('═══════════════════════════════════════════════════════════════');
    
    const content = lines.join('\n');
    const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' }); // BOM for Hebrew
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `דוח-בדיקת-מערכת-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('הדוח הורד בהצלחה');
  };

  return (
    <div className="space-y-6">
      {/* Quick Check Card */}
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Activity className="h-5 w-5" />
            בדיקת תקינות מהירה
          </CardTitle>
          <CardDescription>
            בדיקה מהירה של מצב המערכת - טבלאות, פונקציות ומדיניות אבטחה
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={runQuickCheck}
              disabled={quickLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {quickLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              הרץ בדיקה מהירה
            </Button>

            {quickResult && (
              <Badge
                variant={quickResult.status === 'HEALTHY' ? 'default' : 'destructive'}
                className={cn(
                  'text-sm px-3 py-1',
                  quickResult.status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-red-500'
                )}
              >
                {quickResult.status === 'HEALTHY' ? (
                  <><CheckCircle2 className="h-4 w-4 mr-1" /> תקין</>
                ) : (
                  <><AlertTriangle className="h-4 w-4 mr-1" /> נמצאו בעיות</>
                )}
              </Badge>
            )}
          </div>

          {quickResult && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-emerald-600">{quickResult.counts.tables}</div>
                <div className="text-sm text-muted-foreground">טבלאות</div>
              </div>
              <div className="bg-white rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{quickResult.counts.functions}</div>
                <div className="text-sm text-muted-foreground">פונקציות</div>
              </div>
              <div className="bg-white rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{quickResult.counts.policies}</div>
                <div className="text-sm text-muted-foreground">מדיניות RLS</div>
              </div>
              <div className="bg-white rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-orange-600">{quickResult.database_size}</div>
                <div className="text-sm text-muted-foreground">גודל DB</div>
              </div>
            </div>
          )}

          {quickResult && quickResult.issues.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-red-600">בעיות שנמצאו:</h4>
              {quickResult.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-3 rounded-lg flex items-start gap-2',
                    issue.type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                  )}
                >
                  {issue.type === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium">{issue.message}</div>
                    {issue.details && (
                      <div className="text-sm text-muted-foreground mt-1">{issue.details}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Check Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Database className="h-5 w-5" />
                בדיקת תקינות מלאה
              </CardTitle>
              <CardDescription>
                סריקה מקיפה של מסד הנתונים - טבלאות, אינדקסים, מפתחות זרים ועוד
              </CardDescription>
            </div>
            {fullResult && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(fullResult)}>
                  <Copy className="h-4 w-4 mr-1" />
                  העתק
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadReport('txt')}>
                  <Download className="h-4 w-4 mr-1" />
                  הורד דוח
                </Button>
                <Button variant="ghost" size="sm" onClick={() => downloadReport('json')}>
                  <Code2 className="h-4 w-4 mr-1" />
                  JSON
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runFullCheck}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4 mr-2" />
            )}
            הרץ בדיקה מלאה
          </Button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {fullResult && (
            <div className="mt-6 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-emerald-700">{fullResult.summary.total_tables}</div>
                  <div className="text-xs text-emerald-600">טבלאות</div>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-700">{fullResult.summary.total_rows.toLocaleString()}</div>
                  <div className="text-xs text-blue-600">שורות</div>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-700">{fullResult.summary.total_functions}</div>
                  <div className="text-xs text-purple-600">פונקציות</div>
                </div>
                <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-orange-700">{fullResult.summary.total_policies}</div>
                  <div className="text-xs text-orange-600">מדיניות</div>
                </div>
                <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-pink-700">{fullResult.summary.total_foreign_keys}</div>
                  <div className="text-xs text-pink-600">FK</div>
                </div>
                <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-red-700">{fullResult.summary.unused_indexes}</div>
                  <div className="text-xs text-red-600">אינדקסים לא בשימוש</div>
                </div>
              </div>

              {/* Tables Section */}
              <Collapsible open={expandedSections.tables} onOpenChange={() => toggleSection('tables')}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 bg-emerald-100 rounded-lg cursor-pointer hover:bg-emerald-200">
                    <div className="flex items-center gap-2 font-medium text-emerald-800">
                      <Database className="h-4 w-4" />
                      טבלאות ({fullResult.tables.length})
                    </div>
                    {expandedSections.tables ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ScrollArea className="h-[300px] mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>שם טבלה</TableHead>
                          <TableHead className="text-left">שורות</TableHead>
                          <TableHead className="text-left">גודל</TableHead>
                          <TableHead className="text-left">Vacuum אחרון</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fullResult.tables.map((table, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">{table.name}</TableCell>
                            <TableCell className="text-left">{table.rows.toLocaleString()}</TableCell>
                            <TableCell className="text-left">{table.size}</TableCell>
                            <TableCell className="text-left text-xs text-muted-foreground">
                              {table.last_vacuum === 'Never' ? '❌ מעולם' : table.last_vacuum}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              {/* Functions Section */}
              <Collapsible open={expandedSections.functions} onOpenChange={() => toggleSection('functions')}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 bg-purple-100 rounded-lg cursor-pointer hover:bg-purple-200">
                    <div className="flex items-center gap-2 font-medium text-purple-800">
                      <Code2 className="h-4 w-4" />
                      פונקציות RPC ({fullResult.functions.length})
                    </div>
                    {expandedSections.functions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ScrollArea className="h-[300px] mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>שם פונקציה</TableHead>
                          <TableHead className="text-left">פרמטרים</TableHead>
                          <TableHead className="text-left">מחזיר</TableHead>
                          <TableHead className="text-left">אבטחה</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fullResult.functions.map((func, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm text-purple-700">{func.name}</TableCell>
                            <TableCell className="text-left text-xs max-w-[200px] truncate">{func.arguments || '-'}</TableCell>
                            <TableCell className="text-left text-xs">{func.returns}</TableCell>
                            <TableCell className="text-left">
                              <Badge variant={func.security === 'SECURITY DEFINER' ? 'destructive' : 'secondary'} className="text-xs">
                                {func.security}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              {/* Policies Section */}
              <Collapsible open={expandedSections.policies} onOpenChange={() => toggleSection('policies')}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 bg-orange-100 rounded-lg cursor-pointer hover:bg-orange-200">
                    <div className="flex items-center gap-2 font-medium text-orange-800">
                      <Shield className="h-4 w-4" />
                      מדיניות RLS ({fullResult.policies.length})
                    </div>
                    {expandedSections.policies ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ScrollArea className="h-[300px] mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>טבלה</TableHead>
                          <TableHead className="text-left">מדיניות</TableHead>
                          <TableHead className="text-left">פקודה</TableHead>
                          <TableHead className="text-left">תפקידים</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fullResult.policies.map((policy, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">{policy.table}</TableCell>
                            <TableCell className="text-left text-xs">{policy.policy}</TableCell>
                            <TableCell className="text-left">
                              <Badge variant="outline" className="text-xs">{policy.command}</Badge>
                            </TableCell>
                            <TableCell className="text-left text-xs">{policy.roles?.join(', ')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              {/* Foreign Keys Section */}
              <Collapsible open={expandedSections.foreignKeys} onOpenChange={() => toggleSection('foreignKeys')}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 bg-pink-100 rounded-lg cursor-pointer hover:bg-pink-200">
                    <div className="flex items-center gap-2 font-medium text-pink-800">
                      <Link2 className="h-4 w-4" />
                      מפתחות זרים ({fullResult.foreign_keys.length})
                    </div>
                    {expandedSections.foreignKeys ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ScrollArea className="h-[300px] mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>טבלה</TableHead>
                          <TableHead className="text-left">עמודה</TableHead>
                          <TableHead className="text-left">מפנה לטבלה</TableHead>
                          <TableHead className="text-left">מפנה לעמודה</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fullResult.foreign_keys.map((fk, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">{fk.table}</TableCell>
                            <TableCell className="text-left text-sm">{fk.column}</TableCell>
                            <TableCell className="text-left font-mono text-sm text-pink-600">{fk.references_table}</TableCell>
                            <TableCell className="text-left text-sm">{fk.references_column}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              {/* Recent Migrations Section */}
              <Collapsible open={expandedSections.migrations} onOpenChange={() => toggleSection('migrations')}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                    <div className="flex items-center gap-2 font-medium text-gray-800">
                      <HardDrive className="h-4 w-4" />
                      מיגרציות אחרונות ({fullResult.recent_migrations.length})
                    </div>
                    {expandedSections.migrations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ScrollArea className="h-[200px] mt-2">
                    <div className="space-y-2">
                      {fullResult.recent_migrations.map((mig, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'p-3 rounded-lg border',
                            mig.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">{mig.name}</span>
                            {mig.success ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(mig.executed_at).toLocaleString('he-IL')}
                          </div>
                          {mig.error && (
                            <div className="text-xs text-red-600 mt-1">{mig.error}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SystemHealthCheck;
