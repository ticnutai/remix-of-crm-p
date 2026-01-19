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
import { TableRowsSplit, FileText, Plus, ArrowLeft } from 'lucide-react';
import { ColumnDef } from '@/components/DataTable/types';
import { cn } from '@/lib/utils';

interface QuickAddRowsDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnDef<T>[];
  onRowsAdd: (rows: Record<string, any>[]) => void;
  databases?: { id: string; name: string }[];
  selectedDatabase?: string;
  onDatabaseChange?: (databaseId: string) => void;
}

const PRESET_COUNTS = [1, 5, 10, 50, 100];

export function QuickAddRowsDialog<T>({
  open,
  onOpenChange,
  columns,
  onRowsAdd,
  databases,
  selectedDatabase,
  onDatabaseChange,
}: QuickAddRowsDialogProps<T>) {
  const [mode, setMode] = useState<'empty' | 'text'>('empty');
  const [emptyCount, setEmptyCount] = useState(5);
  const [customCount, setCustomCount] = useState('');
  const [textContent, setTextContent] = useState('');
  const [targetColumnId, setTargetColumnId] = useState<string>('');

  // Find the rightmost column (first in RTL) or column next to "client" column
  const suggestedColumn = useMemo(() => {
    const editableColumns = columns.filter(c => 
      c.id !== 'actions' && 
      c.id !== 'id' && 
      c.id !== '_row' &&
      c.editable !== false
    );
    
    // Look for client column
    const clientColIndex = editableColumns.findIndex(
      c => c.id?.toLowerCase().includes('client') ||
           (typeof c.header === 'string' && c.header.includes('לקוח'))
    );
    
    // If found client column and there's a column before it (to the right in RTL)
    if (clientColIndex > 0) {
      return editableColumns[clientColIndex - 1]?.id || editableColumns[0]?.id;
    }
    
    // Otherwise return first column (rightmost in RTL)
    return editableColumns[0]?.id;
  }, [columns]);

  // Set default target column
  React.useEffect(() => {
    if (!targetColumnId && suggestedColumn) {
      setTargetColumnId(suggestedColumn);
    }
  }, [suggestedColumn, targetColumnId]);

  // Parse text into rows
  const parsedRows = useMemo(() => {
    if (!textContent.trim()) return [];
    return textContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }, [textContent]);

  // Get final count
  const rowCount = mode === 'empty' 
    ? (customCount ? parseInt(customCount) || 0 : emptyCount)
    : parsedRows.length;

  // Editable columns for target selection
  const editableColumns = useMemo(() => 
    columns.filter(c => 
      c.id !== 'actions' && 
      c.id !== 'id' && 
      c.id !== '_row' &&
      c.editable !== false
    ), [columns]);

  // Handle submit
  const handleSubmit = () => {
    const rows: Record<string, any>[] = [];
    
    if (mode === 'empty') {
      // Create empty rows
      for (let i = 0; i < rowCount; i++) {
        rows.push({});
      }
    } else {
      // Create rows from text
      for (const line of parsedRows) {
        rows.push({
          [targetColumnId]: line,
        });
      }
    }
    
    onRowsAdd(rows);
    handleClose();
  };

  // Handle close
  const handleClose = () => {
    setMode('empty');
    setEmptyCount(5);
    setCustomCount('');
    setTextContent('');
    setTargetColumnId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <TableRowsSplit className="h-5 w-5 text-primary" />
            הוספת שורות מהירה
          </DialogTitle>
          <DialogDescription>
            הוסף מספר שורות בבת אחת - ריקות או מטקסט
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'empty' | 'text')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="empty" className="gap-2">
              <Plus className="h-4 w-4" />
              שורות ריקות
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <FileText className="h-4 w-4" />
              שורות מטקסט
            </TabsTrigger>
          </TabsList>

          {/* Empty Rows Mode */}
          <TabsContent value="empty" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>כמה שורות להוסיף?</Label>
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
                    max={1000}
                  />
                </div>
              </div>
            </div>

            {databases && databases.length > 1 && (
              <div className="space-y-2">
                <Label>מסד נתונים</Label>
                <Select
                  value={selectedDatabase}
                  onValueChange={onDatabaseChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מסד נתונים" />
                  </SelectTrigger>
                  <SelectContent>
                    {databases.map(db => (
                      <SelectItem key={db.id} value={db.id}>
                        {db.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {rowCount > 0 && (
              <div className="rounded-lg border p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  יתווספו <Badge variant="secondary">{rowCount}</Badge> שורות ריקות לטבלה
                </p>
              </div>
            )}
          </TabsContent>

          {/* Text Rows Mode */}
          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>הכנס כל פריט בשורה חדשה:</Label>
              <Textarea
                placeholder="פריט 1&#10;פריט 2&#10;פריט 3&#10;..."
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
                dir="rtl"
              />
            </div>

            {editableColumns.length > 0 && (
              <div className="space-y-2">
                <Label>עמודת יעד (לאן יוכנס הטקסט)</Label>
                <Select
                  value={targetColumnId}
                  onValueChange={setTargetColumnId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {editableColumns.map(col => (
                      <SelectItem key={col.id} value={col.id}>
                        {typeof col.header === 'string' ? col.header : col.id}
                        {col.id === suggestedColumn && (
                          <span className="text-muted-foreground mr-2">(הכי ימנית)</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <Label>תצוגה מקדימה ({parsedRows.length} שורות)</Label>
                <ScrollArea className="h-[120px] rounded-lg border">
                  <div className="p-3 space-y-1">
                    {parsedRows.slice(0, 10).map((row, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 text-sm py-1 border-b border-border/50 last:border-0"
                      >
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {idx + 1}
                        </Badge>
                        <span className="truncate">{row}</span>
                      </div>
                    ))}
                    {parsedRows.length > 10 && (
                      <div className="text-sm text-muted-foreground pt-2">
                        ועוד {parsedRows.length - 10} שורות...
                      </div>
                    )}
                  </div>
                </ScrollArea>
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
            disabled={rowCount === 0}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            הוסף {rowCount} שורות
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
