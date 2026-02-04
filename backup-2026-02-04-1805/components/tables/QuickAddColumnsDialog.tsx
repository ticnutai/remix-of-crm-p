import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Columns, FileText, Plus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddColumnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingColumns?: { id: string; header?: string | React.ReactNode }[];
  onColumnsAdd: (columns: Array<{ name: string; type: string }>) => void;
}

const PRESET_COUNTS = [1, 3, 5, 10];

const COLUMN_TYPES = [
  { value: 'text', label: 'טקסט' },
  { value: 'number', label: 'מספר' },
  { value: 'date', label: 'תאריך' },
  { value: 'boolean', label: 'כן/לא' },
  { value: 'select', label: 'בחירה' },
];

export function QuickAddColumnsDialog({
  open,
  onOpenChange,
  existingColumns = [],
  onColumnsAdd,
}: QuickAddColumnsDialogProps) {
  const [mode, setMode] = useState<'empty' | 'text'>('empty');
  const [emptyCount, setEmptyCount] = useState(3);
  const [customCount, setCustomCount] = useState('');
  const [textContent, setTextContent] = useState('');
  const [columnType, setColumnType] = useState('text');

  // Parse text into column names
  const parsedColumns = useMemo(() => {
    if (!textContent.trim()) return [];
    return textContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }, [textContent]);

  // Get final count
  const columnCount = mode === 'empty' 
    ? (customCount ? parseInt(customCount) || 0 : emptyCount)
    : parsedColumns.length;

  // Generate auto names for empty columns
  const getAutoColumnName = (index: number): string => {
    const existingCount = existingColumns.length;
    return `עמודה ${existingCount + index + 1}`;
  };

  // Handle submit
  const handleSubmit = () => {
    const columns: Array<{ name: string; type: string }> = [];
    
    if (mode === 'empty') {
      // Create empty columns with auto-generated names
      for (let i = 0; i < columnCount; i++) {
        columns.push({
          name: getAutoColumnName(i),
          type: columnType,
        });
      }
    } else {
      // Create columns from text (reversed for RTL - right to left insertion)
      const reversedColumns = [...parsedColumns].reverse();
      for (const name of reversedColumns) {
        columns.push({
          name,
          type: columnType,
        });
      }
    }
    
    onColumnsAdd(columns);
    handleClose();
  };

  // Handle close
  const handleClose = () => {
    setMode('empty');
    setEmptyCount(3);
    setCustomCount('');
    setTextContent('');
    setColumnType('text');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Columns className="h-5 w-5 text-primary" />
            הוספת עמודות מהירה
          </DialogTitle>
          <DialogDescription>
            הוסף מספר עמודות בבת אחת - ריקות או מטקסט
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'empty' | 'text')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="empty" className="gap-2">
              <Plus className="h-4 w-4" />
              עמודות ריקות
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <FileText className="h-4 w-4" />
              עמודות מטקסט
            </TabsTrigger>
          </TabsList>

          {/* Empty Columns Mode */}
          <TabsContent value="empty" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>כמה עמודות להוסיף?</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COUNTS.map(count => (
                  <Button
                    key={count}
                    type="button"
                    variant={emptyCount === count && !customCount ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setEmptyCount(count);
                      setCustomCount('');
                    }}
                    className={cn(
                      "min-w-[50px]",
                      emptyCount === count && !customCount && "bg-primary text-primary-foreground"
                    )}
                  >
                    {count}
                  </Button>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="מותאם"
                    value={customCount}
                    onChange={e => setCustomCount(e.target.value)}
                    className="w-24"
                    min={1}
                    max={50}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>סוג נתונים</Label>
              <Select
                value={columnType}
                onValueChange={setColumnType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMN_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {columnCount > 0 && (
              <div className="space-y-2">
                <Label>תצוגה מקדימה</Label>
                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {Array.from({ length: Math.min(columnCount, 5) }).map((_, idx) => (
                      <Badge key={idx} variant="outline" className="whitespace-nowrap">
                        {getAutoColumnName(idx)}
                      </Badge>
                    ))}
                    {columnCount > 5 && (
                      <span className="text-sm text-muted-foreground">
                        +{columnCount - 5} עמודות
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                    <span className="text-sm text-muted-foreground">עמודות קיימות</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  עמודות יתווספו מימין לשמאל (RTL)
                </p>
              </div>
            )}
          </TabsContent>

          {/* Text Columns Mode */}
          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>הכנס כל כותרת עמודה בשורה חדשה:</Label>
              <Textarea
                placeholder="סטטוס&#10;תאריך&#10;הערות&#10;..."
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label>סוג נתונים (לכל העמודות)</Label>
              <Select
                value={columnType}
                onValueChange={setColumnType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMN_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {parsedColumns.length > 0 && (
              <div className="space-y-2">
                <Label>תצוגה מקדימה ({parsedColumns.length} עמודות)</Label>
                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {parsedColumns.slice(0, 6).map((col, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="whitespace-nowrap flex-shrink-0"
                      >
                        {col}
                      </Badge>
                    ))}
                    {parsedColumns.length > 6 && (
                      <span className="text-sm text-muted-foreground flex-shrink-0">
                        +{parsedColumns.length - 6}
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">קיימות</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  עמודות יתווספו מימין לשמאל (RTL)
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={columnCount === 0}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            הוסף {columnCount} עמודות
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
