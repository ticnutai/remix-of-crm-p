// Export Tab Component - טאב ייצוא נתונים
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  Loader2, 
  Users, 
  Clock, 
  FolderKanban, 
  CheckSquare, 
  Calendar, 
  FileText,
  Database,
  Table as TableIcon,
  CheckCircle,
  Package,
} from 'lucide-react';

import { ExportOptions, ExportProgress, DB_TABLES, TableName } from './types';

interface ExportTabProps {
  onComplete?: () => void;
}

const TABLE_INFO: Record<string, { name: string; icon: React.ElementType; description: string }> = {
  clients: { name: 'לקוחות', icon: Users, description: 'כל הלקוחות במערכת' },
  projects: { name: 'פרויקטים', icon: FolderKanban, description: 'פרויקטים ותיקים' },
  time_entries: { name: 'רישומי זמן', icon: Clock, description: 'לוגים של שעות עבודה' },
  tasks: { name: 'משימות', icon: CheckSquare, description: 'משימות ו-To-Do' },
  meetings: { name: 'פגישות', icon: Calendar, description: 'פגישות ואירועים' },
  quotes: { name: 'הצעות מחיר', icon: FileText, description: 'הצעות מחיר ללקוחות' },
  profiles: { name: 'פרופילים', icon: Users, description: 'פרופילי משתמשים' },
  client_custom_tabs: { name: 'טאבים מותאמים', icon: TableIcon, description: 'טאבים מותאמים ללקוחות' },
  client_tab_columns: { name: 'עמודות מותאמות', icon: TableIcon, description: 'עמודות בטאבים' },
  custom_tables: { name: 'טבלאות מותאמות', icon: Database, description: 'גיליונות אלקטרוניים' },
  custom_table_data: { name: 'נתוני טבלאות', icon: Database, description: 'שורות בגיליונות' },
};

export function ExportTab({ onComplete }: ExportTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [backupName, setBackupName] = useState(() => {
    const date = new Date().toISOString().split('T')[0];
    return `גיבוי-${date}`;
  });
  const [selectedTables, setSelectedTables] = useState<Set<string>>(
    new Set(['clients', 'projects', 'time_entries', 'tasks', 'meetings'])
  );
  const [exportFormat, setExportFormat] = useState<'json' | 'excel' | 'both'>('both');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  
  // Toggle table selection
  const toggleTable = (table: string) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(table)) {
      newSelected.delete(table);
    } else {
      newSelected.add(table);
    }
    setSelectedTables(newSelected);
  };
  
  // Select all / none
  const selectAll = () => {
    setSelectedTables(new Set(Object.keys(TABLE_INFO)));
  };
  
  const selectNone = () => {
    setSelectedTables(new Set());
  };
  
  // Fetch data from selected tables
  const fetchTableData = async (tableName: string): Promise<any[]> => {
    const { data, error } = await (supabase as any)
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return [];
    }
    
    return data || [];
  };
  
  // Export to JSON
  const exportToJSON = (data: Record<string, any[]>, filename: string) => {
    const exportData = {
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: user?.email,
        version: '2.0.0',
        format: 'e-control-crm',
        tables: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v?.length || 0])
        ),
        totalRecords: Object.values(data).reduce((sum, arr) => sum + (arr?.length || 0), 0),
      },
      data,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Export to Excel
  const exportToExcel = async (data: Record<string, any[]>, filename: string) => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    
    // Create a sheet for each table with data
    Object.entries(data).forEach(([tableName, records]) => {
      if (records && records.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(records);
        const sheetName = (TABLE_INFO[tableName]?.name || tableName).substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    });
    
    // Add metadata sheet if enabled
    if (includeMetadata) {
      const metadataSheet = XLSX.utils.json_to_sheet([{
        'תאריך_יצירה': new Date().toLocaleString('he-IL'),
        'יוצר': user?.email || 'unknown',
        'גרסה': '2.0.0',
        'סה_כ_טבלאות': Object.keys(data).length,
        'סה_כ_רשומות': Object.values(data).reduce((sum, arr) => sum + (arr?.length || 0), 0),
      }]);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'מטא-דאטה');
    }
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };
  
  // Execute export
  const executeExport = async () => {
    if (selectedTables.size === 0) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור לפחות טבלה אחת לייצוא',
        variant: 'destructive',
      });
      return;
    }
    
    if (!backupName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם לגיבוי',
        variant: 'destructive',
      });
      return;
    }
    
    setIsExporting(true);
    setProgress({
      phase: 'fetching',
      processedTables: 0,
      totalTables: selectedTables.size,
      totalRecords: 0,
    });
    
    try {
      const data: Record<string, any[]> = {};
      const tables = Array.from(selectedTables);
      let totalRecords = 0;
      
      // Fetch each table
      for (let i = 0; i < tables.length; i++) {
        const tableName = tables[i];
        
        setProgress(prev => ({
          ...prev!,
          currentTable: TABLE_INFO[tableName]?.name || tableName,
          processedTables: i,
        }));
        
        const tableData = await fetchTableData(tableName);
        data[tableName] = tableData;
        totalRecords += tableData.length;
        
        setProgress(prev => ({
          ...prev!,
          totalRecords,
        }));
      }
      
      setProgress(prev => ({
        ...prev!,
        phase: 'packaging',
        processedTables: tables.length,
      }));
      
      // Generate safe filename
      const dateStr = new Date().toISOString().split('T')[0];
      const safeBackupName = backupName.replace(/[^a-zA-Z0-9א-ת\s-]/g, '').trim();
      const filename = `${safeBackupName}-${dateStr}`;
      
      setProgress(prev => ({
        ...prev!,
        phase: 'downloading',
      }));
      
      // Export based on format selection
      if (exportFormat === 'json' || exportFormat === 'both') {
        exportToJSON(data, filename);
      }
      
      if (exportFormat === 'excel' || exportFormat === 'both') {
        exportToExcel(data, filename);
      }
      
      setProgress(prev => ({
        ...prev!,
        phase: 'complete',
      }));
      
      const formatText = exportFormat === 'both' ? 'JSON + Excel' : 
                        exportFormat === 'json' ? 'JSON' : 'Excel';
      
      toast({
        title: 'הייצוא הושלם! 🎉',
        description: `נשמרו ${totalRecords} רשומות מ-${tables.length} טבלאות (${formatText})`,
      });
      
    } catch (error: any) {
      console.error('Export error:', error);
      setProgress(prev => prev ? { ...prev, phase: 'error' } : null);
      toast({
        title: 'שגיאה בייצוא',
        description: error.message || 'לא ניתן לייצא את הנתונים',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="p-4 space-y-6">
      {/* Backup name */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" />
            שם הגיבוי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={backupName}
            onChange={(e) => setBackupName(e.target.value)}
            placeholder="שם הגיבוי..."
            className="text-right"
          />
        </CardContent>
      </Card>
      
      {/* Table selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              בחר טבלאות לייצוא
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                בחר הכל
              </Button>
              <Button variant="ghost" size="sm" onClick={selectNone}>
                נקה
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {selectedTables.size} טבלאות נבחרו
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {Object.entries(TABLE_INFO).map(([key, info]) => {
              const Icon = info.icon;
              const isSelected = selectedTables.has(key);
              
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleTable(key)}
                >
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={() => toggleTable(key)}
                  />
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="font-medium">{info.name}</span>
                    <span className="text-muted-foreground text-xs mr-2">
                      {info.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Export format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">פורמט ייצוא</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={exportFormat === 'json' ? 'default' : 'outline'}
              className="flex-1 gap-2"
              onClick={() => setExportFormat('json')}
            >
              <FileJson className="w-4 h-4" />
              JSON בלבד
            </Button>
            <Button
              variant={exportFormat === 'excel' ? 'default' : 'outline'}
              className="flex-1 gap-2"
              onClick={() => setExportFormat('excel')}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel בלבד
            </Button>
            <Button
              variant={exportFormat === 'both' ? 'default' : 'outline'}
              className="flex-1 gap-2"
              onClick={() => setExportFormat('both')}
            >
              <Download className="w-4 h-4" />
              שניהם
            </Button>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <Checkbox 
              id="metadata"
              checked={includeMetadata}
              onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
            />
            <Label htmlFor="metadata" className="text-sm cursor-pointer">
              כלול מטא-דאטה (תאריך, יוצר, סטטיסטיקות)
            </Label>
          </div>
        </CardContent>
      </Card>
      
      {/* Progress */}
      {progress && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {progress.phase === 'fetching' && `מוריד: ${progress.currentTable}`}
                  {progress.phase === 'packaging' && 'אורז נתונים...'}
                  {progress.phase === 'downloading' && 'מוריד קבצים...'}
                  {progress.phase === 'complete' && 'הושלם!'}
                </span>
                {progress.phase === 'complete' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin" />
                )}
              </div>
              
              <Progress 
                value={(progress.processedTables / progress.totalTables) * 100} 
              />
              
              <div className="text-xs text-muted-foreground text-center">
                {progress.processedTables} / {progress.totalTables} טבלאות • {progress.totalRecords} רשומות
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Export button */}
      <Button
        className="w-full gap-2"
        size="lg"
        onClick={executeExport}
        disabled={isExporting || selectedTables.size === 0}
      >
        {isExporting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        ייצא גיבוי
      </Button>
    </div>
  );
}
