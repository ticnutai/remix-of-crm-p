// Error Monitor Component - Real-time error display
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  XCircle,
  Info,
  Trash2,
  Eye,
  Clock,
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
  TestTube,
  Database,
  Wifi,
  Terminal,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useErrorMonitoring, ErrorLog } from '@/hooks/useErrorMonitoring';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ErrorMonitorProps {
  enabled?: boolean;
  maxHeight?: string;
}

export function ErrorMonitor({ enabled = true, maxHeight = '600px' }: ErrorMonitorProps) {
  const { errors, stats, clearErrors, clearOldErrors, getErrorsByType, testErrorLogging, logError } = 
    useErrorMonitoring(enabled);
  
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterType, setFilterType] = useState<ErrorLog['type'] | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<ErrorLog['severity'] | 'all'>('all');
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Test button handler
  const handleTestErrors = () => {
    toast.info('מריץ בדיקות שגיאות...');
    testErrorLogging();
  };

  // Manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success('רשימת השגיאות עודכנה');
  };

  const toggleExpand = (errorId: string) => {
    setExpandedErrors(prev => {
      const next = new Set(prev);
      if (next.has(errorId)) {
        next.delete(errorId);
      } else {
        next.add(errorId);
      }
      return next;
    });
  };

  const filteredErrors = errors.filter(error => {
    if (filterType !== 'all' && error.type !== filterType) return false;
    if (filterSeverity !== 'all' && error.severity !== filterSeverity) return false;
    return true;
  });

  const getSeverityIcon = (severity: ErrorLog['severity']) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: ErrorLog['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-700';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-700';
    }
  };

  const getTypeColor = (type: ErrorLog['type']) => {
    switch (type) {
      case 'console':
        return 'bg-purple-500/10 text-purple-700';
      case 'runtime':
        return 'bg-red-500/10 text-red-700';
      case 'network':
        return 'bg-orange-500/10 text-orange-700';
      case 'migration':
        return 'bg-blue-500/10 text-blue-700';
      case 'supabase':
        return 'bg-green-500/10 text-green-700';
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  if (!enabled) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            מוניטור שגיאות
          </CardTitle>
          <CardDescription>
            מוניטור השגיאות כבוי. הפעל אותו כדי לעקוב אחר שגיאות בזמן אמת.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-yellow-200 dark:border-yellow-800/30 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Activity className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-lg">מוניטור שגיאות ריאל-טיים</CardTitle>
                <CardDescription>זיהוי אוטומטי של שגיאות וכישלונות במערכת</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats.errorRate > 5 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  קצב גבוה: {stats.errorRate}/דקה
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-2"
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                רענן
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestErrors}
                className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <TestTube className="h-4 w-4" />
                בדוק מערכת
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearOldErrors}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                נקה ישנות
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={clearErrors}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                נקה הכל
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-muted">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">{stats.total}</div>
                  <div className="text-sm text-muted-foreground mt-1">סה"כ אירועים</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{stats.errors}</div>
                  <div className="text-sm text-muted-foreground mt-1">שגיאות</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 dark:border-yellow-800/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{stats.warnings}</div>
                  <div className="text-sm text-muted-foreground mt-1">אזהרות</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{stats.errorRate}</div>
                  <div className="text-sm text-muted-foreground mt-1">לדקה</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">סינון:</span>
            <Button
              variant={filterSeverity === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterSeverity('all')}
            >
              הכל
            </Button>
            <Button
              variant={filterSeverity === 'error' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setFilterSeverity('error')}
              className="gap-1"
            >
              <XCircle className="h-3 w-3" />
              שגיאות ({stats.errors})
            </Button>
            <Button
              variant={filterSeverity === 'warning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterSeverity('warning')}
              className="gap-1"
            >
              <AlertTriangle className="h-3 w-3" />
              אזהרות ({stats.warnings})
            </Button>

            <Separator orientation="vertical" className="h-6 mx-2" />

            {['console', 'runtime', 'network', 'migration', 'supabase'].map(type => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(type as ErrorLog['type'])}
              >
                {type} ({getErrorsByType(type as ErrorLog['type']).length})
              </Button>
            ))}
          </div>

          {/* Error List */}
          <ScrollArea style={{ maxHeight }}>
            <div className="space-y-2">
              {filteredErrors.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">אין שגיאות להצגה</p>
                  <p className="text-sm mt-1">המערכת פועלת תקין או שהפילטר ריק</p>
                </div>
              ) : (
                filteredErrors.map(error => {
                  const isExpanded = expandedErrors.has(error.id);
                  
                  return (
                    <Card
                      key={error.id}
                      className={cn(
                        'border transition-all',
                        getSeverityColor(error.severity)
                      )}
                    >
                      <CardContent className="pt-4 pb-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              {getSeverityIcon(error.severity)}
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-sm break-words">{error.message}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(error.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <Badge variant="outline" className={getTypeColor(error.type)}>
                              {error.type}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(error.timestamp)}
                            </Badge>
                            {error.source && (
                              <Badge variant="outline">{error.source}</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedError(error);
                                setShowDetails(true);
                              }}
                              className="h-6 px-2 gap-1 mr-auto"
                            >
                              <Eye className="h-3 w-3" />
                              פרטים
                            </Button>
                          </div>

                          {isExpanded && error.stack && (
                            <div className="mt-2 pt-2 border-t">
                              <pre className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto">
                                {error.stack}
                              </pre>
                            </div>
                          )}

                          {isExpanded && error.context && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs font-medium mb-1">הקשר:</p>
                              <pre className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto">
                                {JSON.stringify(error.context, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent dir="rtl" className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedError && getSeverityIcon(selectedError.severity)}
              פרטי שגיאה מלאים
            </DialogTitle>
            <DialogDescription>
              מידע מפורט אודות השגיאה שזוהתה
            </DialogDescription>
          </DialogHeader>

          {selectedError && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">הודעה:</h4>
                <p className="font-mono text-sm bg-muted p-3 rounded">{selectedError.message}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-1 text-sm">סוג:</h4>
                  <Badge className={getTypeColor(selectedError.type)}>{selectedError.type}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-1 text-sm">רמת חומרה:</h4>
                  <Badge variant="outline" className="gap-1">
                    {getSeverityIcon(selectedError.severity)}
                    {selectedError.severity}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-1 text-sm">זמן:</h4>
                  <Badge variant="outline">{formatTimestamp(selectedError.timestamp)}</Badge>
                </div>
              </div>

              {selectedError.source && (
                <div>
                  <h4 className="font-medium mb-1">מקור:</h4>
                  <p className="text-sm text-muted-foreground">{selectedError.source}</p>
                </div>
              )}

              {selectedError.stack && (
                <div>
                  <h4 className="font-medium mb-1">Stack Trace:</h4>
                  <pre className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded overflow-x-auto max-h-60">
                    {selectedError.stack}
                  </pre>
                </div>
              )}

              {selectedError.context && (
                <div>
                  <h4 className="font-medium mb-1">הקשר נוסף:</h4>
                  <pre className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded overflow-x-auto max-h-40">
                    {JSON.stringify(selectedError.context, null, 2)}
                  </pre>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedError, null, 2));
                  toast.success('פרטי השגיאה הועתקו ללוח');
                }}
              >
                <FileText className="h-4 w-4 ml-2" />
                העתק ללוח
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
