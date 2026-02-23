// Import Tab Component - טאב ייבוא נתונים
import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Users, 
  Clock, 
  FolderKanban, 
  Settings2, 
  Database, 
  Eye, 
  FileSpreadsheet, 
  ArrowRight,
  RefreshCw,
  Sparkles,
  FileJson,
  Table as TableIcon,
  Zap,
} from 'lucide-react';
import type * as XLSXTypes from 'xlsx';

import { 
  ImportAnalysis, 
  ImportProgress, 
  DetectedEntity,
  EntityMapping,
  DB_TABLES,
} from './types';
import { analyzeImportData, autoMapFields, validateEntityMapping } from './dataAnalyzer';

interface ImportTabProps {
  onComplete?: () => void;
}

const ENTITY_ICONS: Record<string, React.ElementType> = {
  clients: Users,
  projects: FolderKanban,
  time_entries: Clock,
  tasks: CheckCircle,
  meetings: FileSpreadsheet,
  quotes: FileText,
  users: Users,
  custom_tables: TableIcon,
  custom_table_data: Database,
  documents: FileText,
  other: FileText,
};

const ENTITY_NAMES_HE: Record<string, string> = {
  clients: 'לקוחות',
  projects: 'פרויקטים',
  time_entries: 'רישומי זמן',
  tasks: 'משימות',
  meetings: 'פגישות',
  quotes: 'הצעות מחיר',
  users: 'משתמשים',
  custom_tables: 'טבלאות מותאמות',
  custom_table_data: 'נתוני טבלאות',
  documents: 'מסמכים',
  other: 'אחר',
};

export function ImportTab({ onComplete }: ImportTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [step, setStep] = useState<'upload' | 'analyze' | 'map' | 'preview' | 'import' | 'complete'>('upload');
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());
  const [entityMappings, setEntityMappings] = useState<Map<string, EntityMapping>>(new Map());
  const [previewEntity, setPreviewEntity] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'overwrite' | 'merge'>('skip');
  
  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    setStep('analyze');
    
    try {
      let data: any;
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.json')) {
        const text = await file.text();
        // Remove BOM if present
        const cleanText = text.replace(/^\ufeff/, '').trim();
        data = JSON.parse(cleanText);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(buffer, { type: 'array' });
        data = await parseExcelWorkbook(workbook);
      } else if (fileName.endsWith('.csv')) {
        const text = await file.text();
        data = parseCSVContent(text);
      } else {
        throw new Error('פורמט קובץ לא נתמך. נא להעלות JSON, Excel או CSV');
      }
      
      // Analyze the data
      const analysisResult = analyzeImportData(data, file.name);
      setAnalysis(analysisResult);
      
      // Auto-select all recognized entities
      const recognized = new Set(
        analysisResult.entities
          .filter(e => e.type !== 'other')
          .map(e => e.type)
      );
      setSelectedEntities(recognized);
      
      // Auto-generate mappings
      const mappings = new Map<string, EntityMapping>();
      for (const entity of analysisResult.entities) {
        if (entity.type !== 'other' && entity.targetTable) {
          const fieldMappings = autoMapFields(entity, entity.targetTable);
          mappings.set(entity.type, {
            sourceEntity: entity.type,
            targetTable: entity.targetTable,
            fieldMappings,
            strategy: 'skip_duplicates',
            matchFields: getDefaultMatchFields(entity.type),
          });
        }
      }
      setEntityMappings(mappings);
      
      toast({
        title: 'ניתוח הושלם! ✨',
        description: `זוהו ${analysisResult.totalRecords} רשומות ב-${analysisResult.entities.length} קטגוריות`,
      });
      
      setStep('map');
    } catch (error: any) {
      console.error('File analysis error:', error);
      toast({
        title: 'שגיאה בניתוח הקובץ',
        description: error.message || 'לא ניתן לקרוא את הקובץ',
        variant: 'destructive',
      });
      setStep('upload');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Parse Excel workbook to our format
  const parseExcelWorkbook = async (workbook: XLSXTypes.WorkBook): Promise<any> => {
    const XLSX = await import('xlsx');
    const data: Record<string, any[]> = {};
    
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      if (jsonData.length > 0) {
        // Try to map sheet name to entity type
        const entityName = mapSheetNameToEntity(sheetName);
        data[entityName] = jsonData;
      }
    }
    
    return data;
  };
  
  const mapSheetNameToEntity = (sheetName: string): string => {
    const nameLower = sheetName.toLowerCase();
    if (nameLower.includes('client') || nameLower.includes('לקוח')) return 'clients';
    if (nameLower.includes('project') || nameLower.includes('פרויקט')) return 'projects';
    if (nameLower.includes('time') || nameLower.includes('זמן')) return 'time_entries';
    if (nameLower.includes('task') || nameLower.includes('משימ')) return 'tasks';
    if (nameLower.includes('meeting') || nameLower.includes('פגיש')) return 'meetings';
    if (nameLower.includes('quote') || nameLower.includes('הצע')) return 'quotes';
    return sheetName;
  };
  
  // Parse CSV content
  const parseCSVContent = (content: string): any => {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 2) return { data: [] };
    
    const headers = parseCSVLine(lines[0]);
    const records = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const record: Record<string, any> = {};
      headers.forEach((header, idx) => {
        record[header] = values[idx] || '';
      });
      return record;
    });
    
    // Try to determine what type of data this is
    const entityType = guessEntityTypeFromFields(headers);
    return { [entityType]: records };
  };
  
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };
  
  const guessEntityTypeFromFields = (fields: string[]): string => {
    const fieldsLower = fields.map(f => f.toLowerCase());
    if (fieldsLower.some(f => f.includes('client') || f.includes('לקוח'))) return 'clients';
    if (fieldsLower.some(f => f.includes('duration') || f.includes('משך'))) return 'time_entries';
    if (fieldsLower.some(f => f.includes('task') || f.includes('משימ'))) return 'tasks';
    return 'clients'; // Default
  };
  
  const getDefaultMatchFields = (entityType: string): string[] => {
    switch (entityType) {
      case 'clients': return ['name', 'email'];
      case 'time_entries': return ['client_id', 'start_time'];
      case 'tasks': return ['title', 'client_id'];
      case 'meetings': return ['title', 'start_time'];
      case 'projects': return ['name', 'client_id'];
      default: return ['id'];
    }
  };
  
  // Toggle entity selection
  const toggleEntity = (entityType: string) => {
    const newSelected = new Set(selectedEntities);
    if (newSelected.has(entityType)) {
      newSelected.delete(entityType);
    } else {
      newSelected.add(entityType);
    }
    setSelectedEntities(newSelected);
  };
  
  // Execute import
  const executeImport = async () => {
    if (!analysis || !user) return;
    
    setStep('import');
    setIsProcessing(true);
    
    const progress: ImportProgress = {
      phase: 'validating',
      processedCount: 0,
      totalCount: 0,
      successCount: 0,
      errorCount: 0,
      skipCount: 0,
      errors: [],
      startTime: new Date(),
    };
    setImportProgress(progress);
    
    try {
      // Calculate total
      let totalCount = 0;
      for (const entity of analysis.entities) {
        if (selectedEntities.has(entity.type)) {
          totalCount += entity.count;
        }
      }
      progress.totalCount = totalCount;
      
      // Import each selected entity
      for (const entity of analysis.entities) {
        if (!selectedEntities.has(entity.type)) continue;
        
        const mapping = entityMappings.get(entity.type);
        if (!mapping) continue;
        
        progress.phase = 'importing';
        progress.currentEntity = ENTITY_NAMES_HE[entity.type];
        setImportProgress({ ...progress });
        
        // Get the raw data for this entity
        const rawData = getEntityRawData(analysis.rawData, entity.type);
        if (!rawData || rawData.length === 0) continue;
        
        // Import records
        for (const record of rawData) {
          try {
            const result = await importSingleRecord(record, mapping, user.id);
            
            if (result.status === 'success') {
              progress.successCount++;
            } else if (result.status === 'skipped') {
              progress.skipCount++;
            } else {
              progress.errorCount++;
              progress.errors.push({
                entity: entity.type,
                record,
                message: result.message || 'שגיאה לא ידועה',
              });
            }
          } catch (err: any) {
            progress.errorCount++;
            progress.errors.push({
              entity: entity.type,
              record,
              message: err.message,
            });
          }
          
          progress.processedCount++;
          setImportProgress({ ...progress });
        }
      }
      
      progress.phase = 'complete';
      progress.endTime = new Date();
      setImportProgress({ ...progress });
      setStep('complete');
      
      toast({
        title: 'הייבוא הושלם! 🎉',
        description: `יובאו ${progress.successCount} רשומות, ${progress.skipCount} דולגו, ${progress.errorCount} שגיאות`,
      });
      
    } catch (error: any) {
      progress.phase = 'error';
      setImportProgress({ ...progress });
      toast({
        title: 'שגיאה בייבוא',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Get raw data for entity type
  const getEntityRawData = (rawData: any, entityType: string): any[] => {
    // Handle ArchFlow format
    if (rawData.data) {
      const archflowKey = {
        clients: 'Client',
        time_entries: 'TimeLog',
        tasks: 'Task',
        meetings: 'Meeting',
        projects: 'Project',
        quotes: 'Quote',
        users: 'TeamMember',
        custom_tables: 'CustomSpreadsheet',
      }[entityType];
      
      if (archflowKey && rawData.data[archflowKey]) {
        return rawData.data[archflowKey];
      }
    }
    
    // Handle direct/legacy format
    const possibleKeys = [entityType, entityType.replace('_', ''), 
      entityType.charAt(0).toUpperCase() + entityType.slice(1)];
    
    for (const key of possibleKeys) {
      if (Array.isArray(rawData[key])) {
        return rawData[key];
      }
    }
    
    return [];
  };
  
  // Import a single record
  const importSingleRecord = async (
    record: any, 
    mapping: EntityMapping, 
    userId: string
  ): Promise<{ status: 'success' | 'skipped' | 'error'; message?: string }> => {
    const tableName = mapping.targetTable;
    
    // Transform record according to mappings
    const transformedRecord: Record<string, any> = {};
    for (const fieldMapping of mapping.fieldMappings) {
      if (!fieldMapping.targetField) continue;
      
      let value = record[fieldMapping.sourceField];
      
      // Apply transforms
      switch (fieldMapping.transform) {
        case 'date':
          value = value ? new Date(value).toISOString() : null;
          break;
        case 'number':
          value = value ? Number(value) : null;
          break;
        case 'boolean':
          value = value === true || value === 'true' || value === 'כן' || value === '1';
          break;
        case 'json':
          if (typeof value === 'string') {
            try { value = JSON.parse(value); } catch { }
          }
          break;
      }
      
      transformedRecord[fieldMapping.targetField] = value;
    }
    
    // Add metadata
    if (tableName === 'clients' || tableName === 'time_entries' || tableName === 'tasks') {
      transformedRecord.created_by = userId;
    }
    transformedRecord.updated_at = new Date().toISOString();
    
    // Check for duplicates
    if (mapping.strategy !== 'always_insert' && mapping.matchFields.length > 0) {
      const isDuplicate = await checkDuplicate(tableName, transformedRecord, mapping.matchFields);
      
      if (isDuplicate) {
        if (mapping.strategy === 'skip_duplicates') {
          return { status: 'skipped', message: 'כפילות - דולג' };
        }
        // For update_duplicates, we'd update here
      }
    }
    
    // Insert
    const { error } = await (supabase as any)
      .from(tableName)
      .insert(transformedRecord);
    
    if (error) {
      return { status: 'error', message: error.message };
    }
    
    return { status: 'success' };
  };
  
  // Check for duplicate record
  const checkDuplicate = async (
    tableName: string, 
    record: Record<string, any>, 
    matchFields: string[]
  ): Promise<boolean> => {
    let query = (supabase as any).from(tableName).select('id');
    
    for (const field of matchFields) {
      const value = record[field];
      if (value !== null && value !== undefined) {
        query = query.eq(field, value);
      }
    }
    
    const { data } = await query.limit(1);
    return data && data.length > 0;
  };
  
  // Reset to start
  const resetImport = () => {
    setStep('upload');
    setAnalysis(null);
    setSelectedEntities(new Set());
    setEntityMappings(new Map());
    setImportProgress(null);
  };
  
  // Render upload step
  const renderUploadStep = () => (
    <div className="space-y-6">
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
        <CardContent className="p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">העלה קובץ לייבוא</h3>
              <p className="text-muted-foreground text-sm mt-1">
                גרור קובץ לכאן או לחץ לבחירה
              </p>
            </div>
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              בחר קובץ
            </Button>
            
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1">
                <FileJson className="w-3 h-3" /> JSON
              </Badge>
              <Badge variant="outline" className="gap-1">
                <FileSpreadsheet className="w-3 h-3" /> Excel
              </Badge>
              <Badge variant="outline" className="gap-1">
                <TableIcon className="w-3 h-3" /> CSV
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Supported formats info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            פורמטים נתמכים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Badge className="bg-green-100 text-green-800">ArchFlow</Badge>
            <span>גיבוי מערכת tenarch או ArchFlow</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="bg-blue-100 text-blue-800">Supabase</Badge>
            <span>ייצוא ישיר מ-Supabase</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="bg-purple-100 text-purple-800">Excel</Badge>
            <span>קובץ Excel עם גליונות לכל סוג נתון</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="bg-orange-100 text-orange-800">CSV</Badge>
            <span>קובץ CSV עם כותרות בשורה הראשונה</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  // Render analyze/map step
  const renderMapStep = () => (
    <div className="space-y-6">
      {/* Analysis summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              ניתוח הקובץ
            </span>
            <Badge variant="outline">{analysis?.sourceFormat}</Badge>
          </CardTitle>
          <CardDescription>
            נמצאו {analysis?.totalRecords || 0} רשומות ב-{analysis?.entities.length || 0} קטגוריות
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Entity selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">בחר נתונים לייבוא</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis?.entities.map(entity => {
              const Icon = ENTITY_ICONS[entity.type] || FileText;
              const isSelected = selectedEntities.has(entity.type);
              
              return (
                <div 
                  key={entity.type}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleEntity(entity.type)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => toggleEntity(entity.type)}
                    />
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{ENTITY_NAMES_HE[entity.type]}</span>
                      <span className="text-muted-foreground text-sm mr-2">
                        ({entity.count} רשומות)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {entity.type !== 'other' && (
                      <Badge variant="outline" className="text-xs">
                        {entity.fields.length} שדות
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewEntity(entity.type);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Duplicate strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">טיפול בכפילויות</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={duplicateStrategy} onValueChange={(v: any) => setDuplicateStrategy(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skip">דלג על כפילויות</SelectItem>
              <SelectItem value="overwrite">עדכן כפילויות</SelectItem>
              <SelectItem value="merge">מזג נתונים</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={resetImport}>
          התחל מחדש
        </Button>
        <Button 
          onClick={executeImport}
          disabled={selectedEntities.size === 0 || isProcessing}
          className="gap-2"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          התחל ייבוא
        </Button>
      </div>
      
      {/* Preview dialog would go here */}
    </div>
  );
  
  // Render import progress
  const renderImportProgress = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {importProgress?.phase === 'complete' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : importProgress?.phase === 'error' ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            )}
            {importProgress?.phase === 'complete' ? 'הייבוא הושלם' : 
             importProgress?.phase === 'error' ? 'שגיאה בייבוא' : 
             'מייבא נתונים...'}
          </CardTitle>
          {importProgress?.currentEntity && (
            <CardDescription>
              מעבד: {importProgress.currentEntity}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress 
            value={importProgress?.totalCount ? 
              (importProgress.processedCount / importProgress.totalCount) * 100 : 0
            } 
          />
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {importProgress?.successCount || 0}
              </div>
              <div className="text-xs text-green-600">הצליחו</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {importProgress?.skipCount || 0}
              </div>
              <div className="text-xs text-yellow-600">דולגו</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {importProgress?.errorCount || 0}
              </div>
              <div className="text-xs text-red-600">שגיאות</div>
            </div>
          </div>
          
          {importProgress?.errors && importProgress.errors.length > 0 && (
            <ScrollArea className="h-40 border rounded-lg p-2">
              {importProgress.errors.map((err, idx) => (
                <div key={idx} className="text-sm text-red-600 py-1 border-b last:border-0">
                  <span className="font-medium">{ENTITY_NAMES_HE[err.entity]}:</span>{' '}
                  {err.message}
                </div>
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      {importProgress?.phase === 'complete' && (
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={resetImport}>
            <RefreshCw className="w-4 h-4 ml-2" />
            ייבא עוד
          </Button>
          <Button onClick={onComplete}>
            סיום
          </Button>
        </div>
      )}
    </div>
  );
  
  // Main render
  return (
    <div className="p-4 space-y-6">
      {isProcessing && step === 'analyze' && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">מנתח את הקובץ...</p>
          </CardContent>
        </Card>
      )}
      
      {step === 'upload' && renderUploadStep()}
      {step === 'map' && renderMapStep()}
      {(step === 'import' || step === 'complete') && renderImportProgress()}
    </div>
  );
}
