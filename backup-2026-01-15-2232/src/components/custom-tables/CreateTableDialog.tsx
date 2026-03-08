import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  FileSpreadsheet,
  Users,
  FolderKanban,
  Package,
  Briefcase,
  Building,
  Car,
  ShoppingCart,
  Wallet,
  FileText,
  Calendar,
  Clock,
  Star,
  Heart,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { TableColumn, useCustomTables } from '@/hooks/useCustomTables';
import { cn } from '@/lib/utils';

const AVAILABLE_ICONS = [
  { name: 'Table', icon: Table },
  { name: 'FileSpreadsheet', icon: FileSpreadsheet },
  { name: 'Users', icon: Users },
  { name: 'FolderKanban', icon: FolderKanban },
  { name: 'Package', icon: Package },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Building', icon: Building },
  { name: 'Car', icon: Car },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Wallet', icon: Wallet },
  { name: 'FileText', icon: FileText },
  { name: 'Calendar', icon: Calendar },
  { name: 'Clock', icon: Clock },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
];

const COLUMN_TYPES = [
  { value: 'text', label: 'טקסט' },
  { value: 'number', label: 'מספר' },
  { value: 'boolean', label: 'כן/לא' },
  { value: 'date', label: 'תאריך' },
  { value: 'select', label: 'בחירה מרשימה' },
  { value: 'client', label: 'לקוח' },
];

interface CreateTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTableDialog({ open, onOpenChange, onSuccess }: CreateTableDialogProps) {
  const { createTable } = useCustomTables();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    icon: 'Table',
    description: '',
  });

  const [columns, setColumns] = useState<TableColumn[]>([
    { id: crypto.randomUUID(), name: 'name', displayName: 'שם', type: 'text', required: true },
  ]);

  const [newColumnOptions, setNewColumnOptions] = useState<Record<string, string>>({});

  const handleAddColumn = () => {
    setColumns(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `column_${prev.length + 1}`,
        displayName: '',
        type: 'text',
        required: false,
      },
    ]);
  };

  const handleRemoveColumn = (id: string) => {
    setColumns(prev => prev.filter(col => col.id !== id));
  };

  const handleColumnChange = (id: string, field: keyof TableColumn, value: any) => {
    setColumns(prev => prev.map(col => {
      if (col.id !== id) return col;
      
      // Auto-generate name from displayName if name is empty
      if (field === 'displayName' && !col.name.startsWith('column_')) {
        return { ...col, [field]: value };
      }
      
      if (field === 'displayName') {
        const name = value.toLowerCase()
          .replace(/[^a-zA-Z0-9א-ת\s]/g, '')
          .replace(/\s+/g, '_');
        return { ...col, displayName: value, name: name || col.name };
      }
      
      return { ...col, [field]: value };
    }));
  };

  const handleAddOption = (columnId: string) => {
    const option = newColumnOptions[columnId]?.trim();
    if (!option) return;

    setColumns(prev => prev.map(col => {
      if (col.id !== columnId) return col;
      return {
        ...col,
        options: [...(col.options || []), option],
      };
    }));

    setNewColumnOptions(prev => ({ ...prev, [columnId]: '' }));
  };

  const handleRemoveOption = (columnId: string, optionIndex: number) => {
    setColumns(prev => prev.map(col => {
      if (col.id !== columnId) return col;
      return {
        ...col,
        options: col.options?.filter((_, i) => i !== optionIndex),
      };
    }));
  };

  const handleSubmit = async () => {
    if (!formData.display_name.trim()) return;
    if (columns.length === 0) return;
    if (columns.some(col => !col.displayName.trim())) return;

    setIsSubmitting(true);
    
    const name = formData.display_name.toLowerCase()
      .replace(/[^a-zA-Z0-9א-ת\s]/g, '')
      .replace(/\s+/g, '_');

    const result = await createTable({
      name,
      display_name: formData.display_name,
      icon: formData.icon,
      description: formData.description || undefined,
      columns,
    });

    setIsSubmitting(false);

    if (result) {
      // Reset form
      setFormData({ name: '', display_name: '', icon: 'Table', description: '' });
      setColumns([{ id: crypto.randomUUID(), name: 'name', displayName: 'שם', type: 'text', required: true }]);
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const SelectedIcon = AVAILABLE_ICONS.find(i => i.name === formData.icon)?.icon || Table;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] border-2 border-primary/50" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center justify-end gap-2 text-primary">
            יצירת טבלה חדשה
            <Plus className="h-5 w-5" />
          </DialogTitle>
          <DialogDescription className="text-right">
            הגדר טבלה חדשה עם העמודות שאתה צריך
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-right">
                <Label>שם הטבלה *</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="למשל: ספקים, מלאי, הזמנות..."
                  className="border-primary/30 focus:border-primary text-right"
                />
              </div>
              
              <div className="space-y-2">
                <Label>אייקון</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <SelectedIcon className="h-4 w-4" />
                        {formData.icon}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 text-right">
              <Label>תיאור (אופציונלי)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תיאור קצר של הטבלה..."
                rows={2}
                className="border-primary/30 focus:border-primary text-right"
              />
            </div>

            {/* Columns */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">עמודות</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddColumn}
                >
                  <Plus className="h-4 w-4 ml-1" />
                  הוסף עמודה
                </Button>
              </div>

              <div className="space-y-3">
                {columns.map((column, index) => (
                  <div
                    key={column.id}
                    className="p-4 border border-primary/30 rounded-lg bg-muted/30 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                      
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">שם העמודה *</Label>
                          <Input
                            value={column.displayName}
                            onChange={(e) => handleColumnChange(column.id, 'displayName', e.target.value)}
                            placeholder="שם העמודה"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">סוג</Label>
                          <Select
                            value={column.type}
                            onValueChange={(value) => handleColumnChange(column.id, 'type', value as TableColumn['type'])}
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

                        <div className="flex items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`required-${column.id}`}
                              checked={column.required}
                              onCheckedChange={(checked) => handleColumnChange(column.id, 'required', checked)}
                            />
                            <Label htmlFor={`required-${column.id}`} className="text-xs">
                              חובה
                            </Label>
                          </div>

                          {columns.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleRemoveColumn(column.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Options for select type */}
                    {column.type === 'select' && (
                      <div className="mr-8 space-y-2">
                        <Label className="text-xs">אפשרויות בחירה</Label>
                        <div className="flex flex-wrap gap-2">
                          {column.options?.map((option, optionIndex) => (
                            <Badge
                              key={optionIndex}
                              variant="secondary"
                              className="gap-1"
                            >
                              {option}
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(column.id, optionIndex)}
                                className="hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newColumnOptions[column.id] || ''}
                            onChange={(e) => setNewColumnOptions(prev => ({ ...prev, [column.id]: e.target.value }))}
                            placeholder="הוסף אפשרות..."
                            className="flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddOption(column.id);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddOption(column.id)}
                          >
                            הוסף
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.display_name.trim() || columns.some(c => !c.displayName.trim())}
          >
            {isSubmitting ? 'יוצר...' : 'צור טבלה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
