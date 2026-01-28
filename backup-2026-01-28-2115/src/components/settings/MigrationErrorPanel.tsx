// Migration Error Panel - פאנל פרטי שגיאה מורחב
// e-control CRM Pro

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  XCircle,
  Copy,
  Wrench,
  BookOpen,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { parseError, type ErrorDetails } from '@/utils/sqlAnalyzer';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MigrationErrorPanelProps {
  error: string;
  sql?: string;
  onClose?: () => void;
  onAutoFix?: (fixedSql: string) => void;
}

// Gold gradient styles
const goldGradient = "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600";
const goldBorder = "border-2 border-yellow-500/50";
const goldIcon = "text-yellow-500";
const goldBg = "bg-white dark:bg-gray-900";

export function MigrationErrorPanel({ error, sql, onClose, onAutoFix }: MigrationErrorPanelProps) {
  const [showDetails, setShowDetails] = React.useState(true);
  const [showCode, setShowCode] = React.useState(true);
  
  const errorDetails = parseError(error, sql);
  
  const handleCopyError = () => {
    const errorText = [
      `שגיאה: ${errorDetails.message}`,
      errorDetails.code ? `קוד: ${errorDetails.code}` : '',
      errorDetails.line ? `שורה: ${errorDetails.line}` : '',
      errorDetails.hint ? `הצעה: ${errorDetails.hint}` : '',
      errorDetails.context ? `הקשר: ${errorDetails.context}` : '',
    ].filter(Boolean).join('\n');
    
    navigator.clipboard.writeText(errorText);
    toast.success('השגיאה הועתקה ללוח');
  };
  
  const handleAutoFix = () => {
    if (!sql || !errorDetails.suggestedFix || !onAutoFix) return;
    
    let fixedSql = sql;
    
    // Apply automatic fixes based on error code
    if (errorDetails.code === '42P07') {
      // Table already exists - add IF NOT EXISTS
      fixedSql = sql.replace(
        /CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/gi,
        'CREATE TABLE IF NOT EXISTS '
      );
    } else if (errorDetails.code === '42701') {
      // Column already exists - add IF NOT EXISTS
      fixedSql = sql.replace(
        /ADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS)/gi,
        'ADD COLUMN IF NOT EXISTS '
      );
    } else if (errorDetails.code === '42P01') {
      // Table doesn't exist - can't auto-fix, but show message
      toast.info('לא ניתן לתקן אוטומטית - יש ליצור את הטבלה תחילה');
      return;
    }
    
    if (fixedSql !== sql) {
      onAutoFix(fixedSql);
      toast.success('התיקון הוחל', {
        description: 'בדוק את ה-SQL המתוקן לפני הרצה'
      });
    } else {
      toast.info('לא נמצא תיקון אוטומטי', {
        description: 'יש לתקן ידנית לפי ההצעה'
      });
    }
  };
  
  const handleOpenDocs = () => {
    const docsUrl = errorDetails.code 
      ? `https://www.postgresql.org/docs/current/errcodes-appendix.html#${errorDetails.code}`
      : 'https://www.postgresql.org/docs/current/errcodes-appendix.html';
    window.open(docsUrl, '_blank');
  };
  
  // Get lines around the error for context
  const getCodeContext = () => {
    if (!sql || !errorDetails.line) return null;
    
    const lines = sql.split('\n');
    const errorLine = errorDetails.line - 1; // 0-indexed
    const startLine = Math.max(0, errorLine - 2);
    const endLine = Math.min(lines.length - 1, errorLine + 2);
    
    return lines.slice(startLine, endLine + 1).map((line, index) => ({
      lineNumber: startLine + index + 1,
      content: line,
      isError: startLine + index === errorLine,
    }));
  };
  
  const codeContext = getCodeContext();
  
  return (
    <Card className={cn(goldBg, "border-2 border-red-500/50 shadow-lg shadow-red-500/10")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-lg text-red-600 dark:text-red-400">
                המיגרציה נכשלה
              </CardTitle>
              {errorDetails.code && (
                <Badge variant="outline" className="mt-1 border-red-500/50 text-red-600">
                  קוד: {errorDetails.code}
                </Badge>
              )}
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Message */}
        <div className={cn(
          "rounded-xl p-4",
          "bg-red-500/5 border border-red-500/30"
        )}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-1 text-red-500 flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <p className="font-mono text-sm text-red-700 dark:text-red-300 break-all">
                {errorDetails.message}
              </p>
              {errorDetails.position && (
                <p className="text-xs text-red-500/70">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {errorDetails.line ? `שורה ${errorDetails.line}, ` : ''}
                  תו {errorDetails.position}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Suggested Fix */}
        {(errorDetails.hint || errorDetails.suggestedFix) && (
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">הצעה לתיקון</span>
                </div>
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className={cn(
                "rounded-xl p-4 mt-2",
                "bg-yellow-500/5 border border-yellow-500/30"
              )}>
                <div className="space-y-2">
                  {errorDetails.hint && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {errorDetails.hint}
                    </p>
                  )}
                  {errorDetails.suggestedFix && (
                    <div className="mt-2 p-2 rounded bg-yellow-500/10 font-mono text-xs">
                      <p className="text-yellow-600 dark:text-yellow-400">
                        💡 {errorDetails.suggestedFix}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Code Context */}
        {codeContext && codeContext.length > 0 && (
          <Collapsible open={showCode} onOpenChange={setShowCode}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">מיקום השגיאה בקוד</span>
                </div>
                {showCode ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className={cn(
                "rounded-xl overflow-hidden mt-2",
                "border border-muted"
              )}>
                <pre className="p-3 bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto">
                  {codeContext.map((line) => (
                    <div 
                      key={line.lineNumber} 
                      className={cn(
                        "flex",
                        line.isError && "bg-red-500/20 -mx-3 px-3"
                      )}
                    >
                      <span className={cn(
                        "select-none w-8 text-gray-500 text-right pr-2 border-r border-gray-700 mr-2",
                        line.isError && "text-red-400 font-bold"
                      )}>
                        {line.lineNumber}
                      </span>
                      <span className={line.isError ? "text-red-300" : ""}>
                        {line.content}
                      </span>
                      {line.isError && (
                        <span className="text-red-400 mr-2"> ← כאן</span>
                      )}
                    </div>
                  ))}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Context Info */}
        {errorDetails.context && (
          <div className={cn(
            "rounded-xl p-3",
            "bg-muted/50 border border-muted"
          )}>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">הקשר:</span> {errorDetails.context}
              </p>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyError}
            className="border-yellow-500/50 hover:bg-yellow-500/10"
          >
            <Copy className="h-4 w-4 ml-2" />
            העתק שגיאה
          </Button>
          
          {errorDetails.suggestedFix && onAutoFix && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoFix}
              className="border-green-500/50 hover:bg-green-500/10 text-green-600"
            >
              <Wrench className="h-4 w-4 ml-2" />
              תקן אוטומטי
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenDocs}
            className="border-blue-500/50 hover:bg-blue-500/10 text-blue-600"
          >
            <ExternalLink className="h-4 w-4 ml-2" />
            תיעוד PostgreSQL
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default MigrationErrorPanel;
