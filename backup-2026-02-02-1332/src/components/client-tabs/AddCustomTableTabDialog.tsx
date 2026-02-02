// Dialog for creating a new custom table tab for client
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  GripVertical,
  Table,
  LayoutGrid,
  List,
  Database,
  FileText,
  Calendar,
  Hash,
  ToggleLeft,
  ListChecks,
  AlignLeft,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TabColumn } from '@/hooks/useClientTabData';

interface AddCustomTableTabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  onSuccess?: () => void;
}

const COLUMN_TYPES = [
  { value: 'text', label: 'טקסט', icon: AlignLeft },
  { value: 'number', label: 'מספר', icon: Hash },
  { value: 'date', label: 'תאריך', icon: Calendar },
  { value: 'boolean', label: 'כן/לא', icon: ToggleLeft },
  { value: 'select', label: 'בחירה', icon: ListChecks },
  { value: 'textarea', label: 'טקסט ארוך', icon: FileText },
];

const ICONS = [
  { value: 'Database', label: 'מסד נתונים' },
  { value: 'Table', label: 'טבלה' },
  { value: 'FileText', label: 'מסמך' },
  { value: 'Calendar', label: 'לוח שנה' },
  { value: 'List', label: 'רשימה' },
];

export function AddCustomTableTabDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: AddCustomTableTabDialogProps) {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [icon, setIcon] = useState('Database');
  const [displayMode, setDisplayMode] = useState<'table' | 'cards' | 'both'>('table');
  const [isGlobal, setIsGlobal] = useState(true);
  const [showSummary, setShowSummary] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [allowFiles, setAllowFiles] = useState(true);
  
  // Columns
  const [columns, setColumns] = useState<TabColumn[]>([
    { id: 'col_1', name: 'כותרת', type: 'text', required: true },
    { id: 'col_2', name: 'תיאור', type: 'textarea' },
  ]);

  // Add column
  const addColumn = () => {
    const newId = `col_${Date.now()}`;
    setColumns(prev => [...prev, { id: newId, name: '', type: 'text' }]);
  };

  // Update column
  const updateColumn = (id: string, updates: Partial<TabColumn>) => {
    setColumns(prev => prev.map(col => col.id === id ? { ...col, ...updates } : col));
  };

  // Remove column
  const removeColumn = (id: string) => {
    setColumns(prev => prev.filter(col => col.id !== id));
  };

  // Reset form
  const resetForm = () => {
    setDisplayName('');
    setIcon('Database');
    setDisplayMode('table');
    setIsGlobal(true);
    setShowSummary(true);
    setShowAnalysis(true);
    setAllowFiles(true);
    setColumns([
      { id: 'col_1', name: 'כותרת', type: 'text', required: true },
      { id: 'col_2', name: 'תיאור', type: 'textarea' },
    ]);
  };

  // Submit
  const handleSubmit = async () => {
    if (!displayName.trim()) {
      toast({ title: 'שגיאה', description: 'חובה להזין שם לטאב', variant: 'destructive' });
      return;
    }
    
    if (columns.filter(c => c.name.trim()).length === 0) {
      toast({ title: 'שגיאה', description: 'חובה להוסיף לפחות עמודה אחת', variant: 'destructive' });
      return;
    }

    if (!user) return;

    setIsCreating(true);
    try {
      // First, create a placeholder data type for this custom table tab
      const { data: dataType, error: dtError } = await supabase
        .from('data_types')
        .insert({
          name: `custom_table_${Date.now()}`,
          display_name: displayName,
          source_type: 'custom',
          icon,
          created_by: user.id,
        })
        .select()
        .single();

      if (dtError) throw dtError;

      // Create the tab with custom table type
      const validColumns = columns.filter(c => c.name.trim());
      
      const { error: tabError } = await supabase
        .from('client_custom_tabs')
        .insert({
          data_type_id: dataType.id,
          display_name: displayName,
          icon,
          display_mode: displayMode,
          is_global: isGlobal,
          client_id: isGlobal ? null : (clientId || null),
          created_by: user.id,
          tab_type: 'custom_table',
          table_columns: validColumns,
          show_summary: showSummary,
          show_analysis: showAnalysis,
          allow_files: allowFiles,
        } as any);

      if (tabError) throw tabError;

      toast({
        title: 'הטאב נוצר בהצלחה',
        description: `"${displayName}" נוסף לפרופילי הלקוחות`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating custom table tab:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן ליצור את הטאב',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle>יצירת טאב טבלה מותאם</DialogTitle>
          <DialogDescription>
            צור טאב חדש עם טבלה מותאמת אישית שתופיע בכל פרופילי הלקוחות
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>שם הטאב *</Label>
                <Input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="לדוגמה: הצעות מחיר"
                />
              </div>
              
              <div className="space-y-2">
                <Label>אייקון</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICONS.map(i => (
                      <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Display Mode */}
            <div className="space-y-2">
              <Label>מצב תצוגה</Label>
              <div className="flex gap-2">
                {[
                  { value: 'table', label: 'טבלה', icon: Table },
                  { value: 'cards', label: 'כרטיסים', icon: LayoutGrid },
                  { value: 'both', label: 'שניהם', icon: List },
                ].map(mode => (
                  <Button
                    key={mode.value}
                    variant={displayMode === mode.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDisplayMode(mode.value as any)}
                    className="gap-1"
                  >
                    <mode.icon className="h-4 w-4" />
                    {mode.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>גלובלי (לכל הלקוחות)</Label>
                <Switch checked={isGlobal} onCheckedChange={setIsGlobal} />
              </div>
              <div className="flex items-center justify-between">
                <Label>הצג סיכום</Label>
                <Switch checked={showSummary} onCheckedChange={setShowSummary} />
              </div>
              <div className="flex items-center justify-between">
                <Label>הצג ניתוח</Label>
                <Switch checked={showAnalysis} onCheckedChange={setShowAnalysis} />
              </div>
              <div className="flex items-center justify-between">
                <Label>אפשר העלאת קבצים</Label>
                <Switch checked={allowFiles} onCheckedChange={setAllowFiles} />
              </div>
            </div>

            <Separator />

            {/* Columns */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">עמודות הטבלה</Label>
                <Button variant="outline" size="sm" onClick={addColumn} className="gap-1">
                  <Plus className="h-4 w-4" />
                  הוסף עמודה
                </Button>
              </div>

              <div className="space-y-3">
                {columns.map((col, index) => (
                  <div key={col.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    
                    <Input
                      value={col.name}
                      onChange={e => updateColumn(col.id, { name: e.target.value })}
                      placeholder="שם העמודה"
                      className="flex-1"
                    />
                    
                    <Select
                      value={col.type}
                      onValueChange={value => updateColumn(col.id, { type: value as any })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLUMN_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {col.type === 'select' && (
                      <Input
                        value={(col.options || []).join(', ')}
                        onChange={e => updateColumn(col.id, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="אפשרויות (מופרד בפסיק)"
                        className="flex-1"
                      />
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={col.required || false}
                        onCheckedChange={checked => updateColumn(col.id, { required: checked })}
                      />
                      <span className="text-xs text-muted-foreground">חובה</span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeColumn(col.id)}
                      disabled={columns.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            {columns.filter(c => c.name.trim()).length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-base">תצוגה מקדימה</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {columns.filter(c => c.name.trim()).map(col => (
                            <th key={col.id} className="text-right px-3 py-2 font-medium">
                              {col.name}
                              {col.required && <span className="text-destructive mr-1">*</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          {columns.filter(c => c.name.trim()).map(col => (
                            <td key={col.id} className="px-3 py-2 text-muted-foreground">
                              {col.type === 'select' && col.options?.[0] ? col.options[0] : `[${col.type}]`}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? 'יוצר...' : 'צור טאב'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
