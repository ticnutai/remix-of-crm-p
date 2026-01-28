import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExportOptions {
  users: boolean;
  clients: boolean;
  timeLogs: boolean;
  projects: boolean;
  tasks: boolean;
  meetings: boolean;
  spreadsheets: boolean;
  customTables: boolean;
}

export function ExportTab() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ExportOptions>({
    users: true,
    clients: true,
    timeLogs: true,
    projects: true,
    tasks: true,
    meetings: true,
    spreadsheets: true,
    customTables: true,
  });
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('לא מחובר');

      // Call Supabase Edge Function for export
      const { data, error: exportError } = await supabase.functions.invoke('export-backup', {
        body: { options }
      });

      if (exportError) throw exportError;

      // Download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'גיבוי הושלם בהצלחה',
        description: 'הקובץ הורד למחשב שלך',
      });
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'שגיאה בייצוא הנתונים');
      toast({
        title: 'שגיאה בייצוא',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const toggleOption = (key: keyof ExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = () => {
    setOptions({
      users: true,
      clients: true,
      timeLogs: true,
      projects: true,
      tasks: true,
      meetings: true,
      spreadsheets: true,
      customTables: true,
    });
  };

  const selectNone = () => {
    setOptions({
      users: false,
      clients: false,
      timeLogs: false,
      projects: false,
      tasks: false,
      meetings: false,
      spreadsheets: false,
      customTables: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">בחר נתונים לייצוא</h3>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>בחר הכל</Button>
              <Button variant="outline" size="sm" onClick={selectNone}>בטל הכל</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="users"
                checked={options.users}
                onCheckedChange={() => toggleOption('users')}
              />
              <Label htmlFor="users" className="cursor-pointer">משתמשים</Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="clients"
                checked={options.clients}
                onCheckedChange={() => toggleOption('clients')}
              />
              <Label htmlFor="clients" className="cursor-pointer">לקוחות</Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="timeLogs"
                checked={options.timeLogs}
                onCheckedChange={() => toggleOption('timeLogs')}
              />
              <Label htmlFor="timeLogs" className="cursor-pointer">רישומי זמן</Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="projects"
                checked={options.projects}
                onCheckedChange={() => toggleOption('projects')}
              />
              <Label htmlFor="projects" className="cursor-pointer">פרויקטים</Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="tasks"
                checked={options.tasks}
                onCheckedChange={() => toggleOption('tasks')}
              />
              <Label htmlFor="tasks" className="cursor-pointer">משימות</Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="meetings"
                checked={options.meetings}
                onCheckedChange={() => toggleOption('meetings')}
              />
              <Label htmlFor="meetings" className="cursor-pointer">פגישות</Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="spreadsheets"
                checked={options.spreadsheets}
                onCheckedChange={() => toggleOption('spreadsheets')}
              />
              <Label htmlFor="spreadsheets" className="cursor-pointer">טבלאות Excel</Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="customTables"
                checked={options.customTables}
                onCheckedChange={() => toggleOption('customTables')}
              />
              <Label htmlFor="customTables" className="cursor-pointer">טבלאות מותאמות</Label>
            </div>
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

      {/* Export Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleExport} 
          size="lg" 
          disabled={exporting || !Object.values(options).some(v => v)}
          className="gap-2"
        >
          {exporting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              מייצא...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              ייצא גיבוי
            </>
          )}
        </Button>
      </div>

      {/* Info */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          הגיבוי ישמר כקובץ JSON הכולל את כל הנתונים שנבחרו. ניתן לייבא אותו בכל עת.
        </AlertDescription>
      </Alert>
    </div>
  );
}
