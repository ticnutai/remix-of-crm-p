// Google Sheets Settings Component
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sheet as SheetIcon, 
  FileSpreadsheet,
  ExternalLink,
  Download,
  Upload,
  CheckCircle2,
  Link
} from 'lucide-react';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function GoogleSheetsSettings() {
  const { user } = useAuth();
  const { 
    isConnected,
    isLoading, 
    config,
    connect,
    disconnect,
    readSheet,
    syncClientsToSheets,
    saveConfig,
    initializeGoogleApi
  } = useGoogleSheets();
  
  const [sheetData, setSheetData] = useState<string[][] | null>(null);
  const [isExportingClients, setIsExportingClients] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState(config?.spreadsheetId || '');

  const extractSpreadsheetId = (url: string): string => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const handleConnect = async () => {
    if (spreadsheetId) {
      saveConfig({
        clientId: config?.clientId || '203713636858-0bn66n8rd2gpkkvmhg233hs6ufeaml2s.apps.googleusercontent.com',
        apiKey: config?.apiKey || '',
        spreadsheetId: extractSpreadsheetId(spreadsheetId),
        sheetName: 'Sheet1'
      });
    }
    await connect();
  };

  const handleLoadData = async () => {
    const data = await readSheet();
    if (data) {
      setSheetData(data);
    }
  };

  const handleExportClients = async () => {
    if (!user || !isConnected) return;

    setIsExportingClients(true);
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (clients && clients.length > 0) {
        await syncClientsToSheets(clients);
      }
    } finally {
      setIsExportingClients(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <SheetIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle>Google Sheets</CardTitle>
              <CardDescription>ייצוא וייבוא נתונים מטבלאות Google</CardDescription>
            </div>
          </div>
          {isConnected && (
            <Button variant="outline" size="sm" onClick={disconnect}>
              התנתק
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="space-y-4">
            <div>
              <Label>קישור או מזהה Spreadsheet</Label>
              <Input
                placeholder="הדבק קישור ל-Google Sheet או מזהה..."
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleConnect} disabled={isLoading}>
              <Link className="h-4 w-4 ml-2" />
              {isLoading ? 'מתחבר...' : 'התחבר ל-Google Sheets'}
            </Button>
          </div>
        ) : (
          <>
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">מחובר ל-Google Sheets</span>
              </div>
              {config?.spreadsheetId && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 p-0 h-auto"
                  onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 ml-1" />
                  פתח את הטבלה
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleLoadData} disabled={isLoading} variant="outline">
                <Download className="h-4 w-4 ml-2" />
                {isLoading ? 'טוען...' : 'טען נתונים'}
              </Button>
              <Button onClick={handleExportClients} disabled={isExportingClients}>
                <Upload className="h-4 w-4 ml-2" />
                {isExportingClients ? 'מייצא...' : 'ייצא לקוחות'}
              </Button>
            </div>

            {sheetData && sheetData.length > 0 && (
              <div className="mt-4">
                <Label className="mb-2 block">תצוגה מקדימה:</Label>
                <div className="border rounded-lg overflow-auto max-h-[200px]">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {sheetData[0]?.map((cell, i) => (
                          <th key={i} className="p-2 text-right border-b font-medium">
                            {cell || `עמודה ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sheetData.slice(1, 6).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-muted/50">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="p-2 border-b">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {sheetData.length > 6 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    מציג 5 מתוך {sheetData.length - 1} שורות
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
