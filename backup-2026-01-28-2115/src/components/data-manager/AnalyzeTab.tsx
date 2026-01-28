import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSearch, AlertCircle, CheckCircle2, TrendingUp, Users, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface FileAnalysis {
  totalSize: number;
  structure: {
    hasMetadata: boolean;
    hasStatistics: boolean;
    hasData: boolean;
  };
  entities: {
    name: string;
    count: number;
    fields: string[];
    duplicates?: number;
    orphans?: number;
  }[];
  issues: {
    type: 'warning' | 'error';
    message: string;
    details?: string;
  }[];
  recommendations: string[];
}

export function AnalyzeTab() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.json')) {
        setError('יש לבחור קובץ JSON בלבד');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setAnalysis(null);
    }
  };

  const analyzeFile = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const analysis: FileAnalysis = {
        totalSize: file.size,
        structure: {
          hasMetadata: !!data.metadata,
          hasStatistics: !!data.statistics,
          hasData: !!data.data,
        },
        entities: [],
        issues: [],
        recommendations: [],
      };

      // Analyze entities
      if (data.data) {
        const entities = ['users', 'clients', 'timeLogs', 'projects', 'tasks', 'meetings', 'spreadsheets'];
        
        for (const entity of entities) {
          if (data.data[entity]) {
            const items = data.data[entity];
            const firstItem = items[0];
            const fields = firstItem ? Object.keys(firstItem) : [];
            
            analysis.entities.push({
              name: entity,
              count: items.length,
              fields,
            });
          }
        }

        // Check for orphan timeLogs (logs without client)
        if (data.data.timeLogs && data.data.clients) {
          const clientIds = new Set(data.data.clients.map((c: any) => c.id));
          const orphanLogs = data.data.timeLogs.filter((log: any) => 
            log.client_id && !clientIds.has(log.client_id)
          );
          
          if (orphanLogs.length > 0) {
            analysis.issues.push({
              type: 'warning',
              message: `נמצאו ${orphanLogs.length} רישומי זמן יתומים (ללא לקוח)`,
              details: 'רישומים אלה לא ייובאו אלא אם תיצור את הלקוחות החסרים',
            });
            
            const orphanEntity = analysis.entities.find(e => e.name === 'timeLogs');
            if (orphanEntity) {
              orphanEntity.orphans = orphanLogs.length;
            }
          }
        }

        // Check for duplicate IDs
        for (const entity of analysis.entities) {
          const items = data.data[entity.name];
          const ids = items.map((item: any) => item.id).filter(Boolean);
          const uniqueIds = new Set(ids);
          
          if (ids.length !== uniqueIds.size) {
            const duplicates = ids.length - uniqueIds.size;
            entity.duplicates = duplicates;
            analysis.issues.push({
              type: 'error',
              message: `נמצאו ${duplicates} מזהים כפולים ב-${entity.name}`,
              details: 'מזהים כפולים עלולים לגרום לשגיאות בייבוא',
            });
          }
        }
      }

      // Add recommendations
      if (!data.metadata) {
        analysis.recommendations.push('מומלץ לכלול metadata עם מידע על הייצוא');
      }
      
      if (!data.statistics) {
        analysis.recommendations.push('מומלץ לכלול statistics לאימות מהיר');
      }

      if (analysis.issues.length === 0) {
        analysis.recommendations.push('הקובץ נראה תקין ומוכן לייבוא');
      }

      setAnalysis(analysis);
      toast({
        title: 'ניתוח הושלם',
        description: `נותחו ${analysis.entities.length} סוגי ישויות`,
      });
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'שגיאה בניתוח הקובץ');
      toast({
        title: 'שגיאה בניתוח',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">בחר קובץ לניתוח</h3>
          </div>

          <div className="flex gap-4">
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="flex-1"
              disabled={analyzing}
            />
            <Button 
              onClick={analyzeFile} 
              disabled={!file || analyzing}
              className="gap-2"
            >
              {analyzing ? 'מנתח...' : 'נתח קובץ'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* File Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">מידע כללי</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">גודל קובץ</div>
                <div className="text-2xl font-bold">{(analysis.totalSize / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Metadata</div>
                <div className="text-2xl font-bold">
                  {analysis.structure.hasMetadata ? '✓' : '✗'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Statistics</div>
                <div className="text-2xl font-bold">
                  {analysis.structure.hasStatistics ? '✓' : '✗'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">נתונים</div>
                <div className="text-2xl font-bold">
                  {analysis.structure.hasData ? '✓' : '✗'}
                </div>
              </div>
            </div>
          </Card>

          {/* Entities */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">ישויות</h3>
            <div className="space-y-4">
              {analysis.entities.map(entity => (
                <div key={entity.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{entity.name}</div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {entity.count} פריטים
                      </span>
                      {entity.orphans && entity.orphans > 0 && (
                        <span className="text-sm text-orange-500">
                          {entity.orphans} יתומים
                        </span>
                      )}
                      {entity.duplicates && entity.duplicates > 0 && (
                        <span className="text-sm text-destructive">
                          {entity.duplicates} כפולים
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    שדות: {entity.fields.slice(0, 5).join(', ')}
                    {entity.fields.length > 5 && ` +${entity.fields.length - 5} נוספים`}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Issues */}
          {analysis.issues.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">בעיות שנמצאו</h3>
              <div className="space-y-3">
                {analysis.issues.map((issue, idx) => (
                  <Alert key={idx} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold">{issue.message}</div>
                      {issue.details && (
                        <div className="text-sm mt-1">{issue.details}</div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">המלצות</h3>
              <div className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <Alert key={idx}>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
