import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileJson, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImportStats {
  users?: number;
  clients?: number;
  timeLogs?: number;
  projects?: number;
  tasks?: number;
  meetings?: number;
  spreadsheets?: number;
}

export function ImportTab() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats | null>(null);
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
      analyzeFile(selectedFile);
    }
  };

  const analyzeFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.statistics) {
        setStats(data.statistics);
      } else if (data.data) {
        // Count data
        const fileStats: ImportStats = {
          users: data.data.users?.length || 0,
          clients: data.data.clients?.length || 0,
          timeLogs: data.data.timeLogs?.length || 0,
          projects: data.data.projects?.length || 0,
          tasks: data.data.tasks?.length || 0,
          meetings: data.data.meetings?.length || 0,
          spreadsheets: data.data.spreadsheets?.length || 0,
        };
        setStats(fileStats);
      }
    } catch (err) {
      console.error('Error analyzing file:', err);
      setError('שגיאה בניתוח הקובץ');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setError(null);

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      // Call Supabase Edge Function for import
      const { data, error: importError } = await supabase.functions.invoke('import-backup', {
        body: { backup }
      });

      if (importError) throw importError;

      setProgress(100);
      toast({
        title: 'ייבוא הושלם בהצלחה',
        description: `יובאו ${data.results.clients.success} לקוחות, ${data.results.timeLogs.success} לוגים`,
      });
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'שגיאה בייבוא הנתונים');
      toast({
        title: 'שגיאה בייבוא',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">בחר קובץ לייבוא</h3>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="import-file"
              disabled={importing}
            />
            <label htmlFor="import-file" className="cursor-pointer">
              <FileJson className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                {file ? file.name : 'גרור קובץ JSON או לחץ לבחירה'}
              </p>
              <p className="text-xs text-muted-foreground">
                JSON בלבד • עד 100MB
              </p>
            </label>
          </div>
        </div>
      </Card>

      {/* File Statistics */}
      {stats && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">סטטיסטיקת הקובץ</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.users !== undefined && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.users}</div>
                  <div className="text-sm text-muted-foreground">משתמשים</div>
                </div>
              )}
              {stats.clients !== undefined && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.clients}</div>
                  <div className="text-sm text-muted-foreground">לקוחות</div>
                </div>
              )}
              {stats.timeLogs !== undefined && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.timeLogs}</div>
                  <div className="text-sm text-muted-foreground">רישומי זמן</div>
                </div>
              )}
              {stats.projects !== undefined && stats.projects > 0 && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.projects}</div>
                  <div className="text-sm text-muted-foreground">פרויקטים</div>
                </div>
              )}
              {stats.tasks !== undefined && stats.tasks > 0 && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.tasks}</div>
                  <div className="text-sm text-muted-foreground">משימות</div>
                </div>
              )}
              {stats.meetings !== undefined && stats.meetings > 0 && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.meetings}</div>
                  <div className="text-sm text-muted-foreground">פגישות</div>
                </div>
              )}
              {stats.spreadsheets !== undefined && stats.spreadsheets > 0 && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.spreadsheets}</div>
                  <div className="text-sm text-muted-foreground">טבלאות</div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Import Progress */}
      {importing && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary animate-pulse" />
              <h3 className="text-lg font-semibold">מייבא נתונים...</h3>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">{progress}% הושלם</p>
          </div>
        </Card>
      )}

      {/* Import Button */}
      {file && !importing && (
        <div className="flex justify-end">
          <Button onClick={handleImport} size="lg" className="gap-2">
            <CheckCircle2 className="h-5 w-5" />
            התחל ייבוא
          </Button>
        </div>
      )}
    </div>
  );
}
