// Data Type Manager - Create and manage custom data types with Navy Elegant Style
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  Users,
  UserCog,
  FolderKanban,
  Loader2,
  Save,
  X,
  Lock,
  Sparkles,
  Link,
  List,
} from 'lucide-react';
import { useDataTypes, useCustomTables } from '@/hooks/useDataTypes';
import { SYSTEM_DATA_TYPES, SystemDataType, DataTypeSelectOption, DataTypeMode } from '@/types/dataTypes';
import { toast } from '@/hooks/use-toast';

interface DataTypeManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVAILABLE_ICONS = [
  { id: 'Database', label: 'מסד נתונים' },
  { id: 'Users', label: 'אנשים' },
  { id: 'FolderKanban', label: 'פרויקט' },
  { id: 'Building', label: 'בניין' },
  { id: 'Package', label: 'מוצר' },
  { id: 'Truck', label: 'משלוח' },
  { id: 'FileText', label: 'מסמך' },
  { id: 'Tag', label: 'תגית' },
  { id: 'Briefcase', label: 'תיק' },
  { id: 'ShoppingCart', label: 'עגלה' },
];

const AVAILABLE_COLORS = [
  { id: '#1e3a5f', label: 'נייבי כהה' },
  { id: '#2563eb', label: 'כחול' },
  { id: '#22c55e', label: 'ירוק' },
  { id: '#f59e0b', label: 'כתום' },
  { id: '#ef4444', label: 'אדום' },
  { id: '#ec4899', label: 'ורוד' },
  { id: '#14b8a6', label: 'טורקיז' },
  { id: '#8b5cf6', label: 'סגול' },
];

const OPTION_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#6366f1', '#84cc16', '#f97316',
];

const SYSTEM_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  UserCog,
  FolderKanban,
  Database,
};

interface FormData {
  name: string;
  display_name: string;
  icon: string;
  source_table: string;
  display_field: string;
  color: string;
  type_mode: DataTypeMode;
  options: DataTypeSelectOption[];
}

export function DataTypeManager({ open, onOpenChange }: DataTypeManagerProps) {
  const { dataTypes, isLoading, createDataType, updateDataType, deleteDataType } = useDataTypes();
  const { customTables } = useCustomTables();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    display_name: '',
    icon: 'Database',
    source_table: '',
    display_field: '',
    color: '#1e3a5f',
    type_mode: 'linked',
    options: [],
  });
  
  // New option state
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionColor, setNewOptionColor] = useState('#3b82f6');

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      icon: 'Database',
      source_table: '',
      display_field: '',
      color: '#1e3a5f',
      type_mode: 'linked',
      options: [],
    });
    setNewOptionLabel('');
    setNewOptionColor('#3b82f6');
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      name: '',
      display_name: '',
      icon: 'Database',
      source_table: '',
      display_field: '',
      color: '#1e3a5f',
      type_mode: 'linked',
      options: [],
    });
  };

  const handleEdit = (dataType: typeof dataTypes[0]) => {
    setIsCreating(false);
    setEditingId(dataType.id);
    setFormData({
      name: dataType.name,
      display_name: dataType.display_name,
      icon: dataType.icon || 'Database',
      source_table: dataType.source_table || '',
      display_field: dataType.display_field || '',
      color: dataType.color || '#1e3a5f',
      type_mode: dataType.type_mode || 'linked',
      options: dataType.options || [],
    });
  };

  const addOption = () => {
    if (!newOptionLabel.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם לאפשרות',
        variant: 'destructive',
      });
      return;
    }
    
    const newOption: DataTypeSelectOption = {
      value: newOptionLabel.toLowerCase().replace(/\s+/g, '_'),
      label: newOptionLabel.trim(),
      color: newOptionColor,
    };
    
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, newOption],
    }));
    setNewOptionLabel('');
    // Rotate to next color
    const currentIndex = OPTION_COLORS.indexOf(newOptionColor);
    setNewOptionColor(OPTION_COLORS[(currentIndex + 1) % OPTION_COLORS.length]);
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || !formData.display_name) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא את השם הטכני ושם התצוגה',
        variant: 'destructive',
      });
      return;
    }

    if (formData.type_mode === 'linked' && (!formData.source_table || !formData.display_field)) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור טבלת מקור ושדה תצוגה',
        variant: 'destructive',
      });
      return;
    }

    if (formData.type_mode === 'options' && formData.options.length === 0) {
      toast({
        title: 'שגיאה',
        description: 'יש להוסיף לפחות אפשרות אחת',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      if (isCreating) {
        await createDataType({
          name: formData.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: formData.display_name,
          icon: formData.icon,
          color: formData.color,
          type_mode: formData.type_mode,
          source_table: formData.type_mode === 'linked' ? formData.source_table : null,
          display_field: formData.type_mode === 'linked' ? formData.display_field : null,
          options: formData.type_mode === 'options' ? formData.options : undefined,
        });
        toast({
          title: '✨ נוצר בהצלחה',
          description: `סוג נתון "${formData.display_name}" נוצר`,
        });
      } else if (editingId) {
        await updateDataType(editingId, {
          display_name: formData.display_name,
          icon: formData.icon,
          color: formData.color,
          type_mode: formData.type_mode,
          source_table: formData.type_mode === 'linked' ? formData.source_table : null,
          display_field: formData.type_mode === 'linked' ? formData.display_field : null,
          options: formData.type_mode === 'options' ? formData.options : [],
        });
        toast({
          title: '✅ עודכן בהצלחה',
          description: `סוג נתון "${formData.display_name}" עודכן`,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving data type:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את סוג הנתון',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDataType(id);
      toast({
        title: '🗑️ נמחק בהצלחה',
        description: 'סוג הנתון נמחק',
      });
    } catch (error) {
      console.error('Error deleting data type:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק את סוג הנתון',
        variant: 'destructive',
      });
    }
  };

  // Get columns for selected table
  const getTableColumns = (tableName: string) => {
    const systemColumns: Record<string, string[]> = {
      clients: ['name', 'email', 'company', 'phone'],
      profiles: ['full_name', 'email', 'position'],
      projects: ['name', 'description', 'status'],
    };

    if (systemColumns[tableName]) {
      return systemColumns[tableName];
    }

    const customTable = customTables.find(t => t.name === tableName);
    if (customTable && Array.isArray(customTable.columns)) {
      return customTable.columns.map((col: any) => col.id || col.name);
    }

    return [];
  };

  // Combine system and custom data types for display
  const systemDataTypesForDisplay = Object.entries(SYSTEM_DATA_TYPES).map(([key, value]) => ({
    id: key,
    name: key,
    display_name: value.display_name,
    icon: value.icon,
    source_table: value.source_table,
    display_field: value.display_field,
    source_type: 'system' as const,
    color: value.color,
    type_mode: 'linked' as DataTypeMode,
    options: [] as DataTypeSelectOption[],
  }));

  const allDataTypes = [...systemDataTypesForDisplay, ...dataTypes.filter(dt => dt.source_type === 'custom')];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col border-2 border-[hsl(222,47%,25%)]/30 bg-gradient-to-br from-white to-[hsl(222,47%,98%)]">
        <DialogHeader className="border-b border-[hsl(222,47%,25%)]/20 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3 justify-end">
            <div>
              <DialogTitle className="text-xl font-bold text-[hsl(222,47%,25%)] text-right">
                ניהול סוגי נתונים
              </DialogTitle>
              <DialogDescription className="text-right text-[hsl(222,47%,25%)]/60 mt-1">
                צור וערוך סוגי נתונים מותאמים שיקושרו אוטומטית בכל הטבלאות
              </DialogDescription>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(222,47%,20%)] to-[hsl(222,47%,30%)] text-white shadow-lg">
              <Database className="h-6 w-6" />
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="space-y-4 px-1">
          {/* Create/Edit Form */}
          {(isCreating || editingId) && (
            <div className="p-5 rounded-xl border-2 border-[hsl(222,47%,25%)]/20 bg-gradient-to-l from-[hsl(222,47%,97%)] to-[hsl(222,47%,99%)] space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={resetForm}
                  className="hover:bg-[hsl(222,47%,25%)]/10 rounded-lg"
                >
                  <X className="h-4 w-4 text-[hsl(222,47%,25%)]" />
                </Button>
                <h4 className="font-semibold text-[hsl(222,47%,25%)] flex items-center gap-2">
                  {isCreating ? (
                    <>
                      יצירת סוג נתון חדש
                      <Sparkles className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      עריכת סוג נתון
                      <Edit2 className="h-4 w-4" />
                    </>
                  )}
                </h4>
              </div>

              {/* Mode Selection */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant={formData.type_mode === 'linked' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, type_mode: 'linked' }))}
                  className={formData.type_mode === 'linked' 
                    ? 'bg-[hsl(222,47%,20%)] text-white hover:bg-[hsl(222,47%,25%)]' 
                    : 'border-[hsl(222,47%,25%)]/30'}
                  disabled={!!editingId}
                >
                  <Link className="h-4 w-4 ml-2" />
                  מקושר לטבלה
                </Button>
                <Button
                  variant={formData.type_mode === 'options' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, type_mode: 'options' }))}
                  className={formData.type_mode === 'options' 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                    : 'border-emerald-300 text-emerald-700'}
                  disabled={!!editingId}
                >
                  <List className="h-4 w-4 ml-2" />
                  רשימת בחירה
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-right">
                  <Label className="text-[hsl(222,47%,25%)]">שם טכני (אנגלית)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="supplier"
                    disabled={!!editingId}
                    className="text-right border-[hsl(222,47%,25%)]/30 focus:border-[hsl(222,47%,25%)]/60 focus:ring-[hsl(222,47%,25%)]/20"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2 text-right">
                  <Label className="text-[hsl(222,47%,25%)]">שם תצוגה</Label>
                  <Input
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="ספק"
                    className="text-right border-[hsl(222,47%,25%)]/30 focus:border-[hsl(222,47%,25%)]/60 focus:ring-[hsl(222,47%,25%)]/20"
                  />
                </div>

                {/* LINKED MODE: Source table and display field */}
                {formData.type_mode === 'linked' && (
                  <>
                    <div className="space-y-2 text-right">
                      <Label className="text-[hsl(222,47%,25%)]">טבלת מקור</Label>
                      <Select
                        value={formData.source_table}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          source_table: value,
                          display_field: '',
                        }))}
                        disabled={!!editingId}
                      >
                        <SelectTrigger className="text-right border-[hsl(222,47%,25%)]/30 focus:border-[hsl(222,47%,25%)]/60">
                          <SelectValue placeholder="בחר טבלה" />
                        </SelectTrigger>
                        <SelectContent className="border-[hsl(222,47%,25%)]/30 bg-white z-50">
                          <SelectItem value="clients">לקוחות (clients)</SelectItem>
                          <SelectItem value="profiles">עובדים (profiles)</SelectItem>
                          <SelectItem value="projects">פרויקטים (projects)</SelectItem>
                          {customTables.map(table => (
                            <SelectItem key={table.id} value={table.name}>
                              {table.display_name} ({table.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 text-right">
                      <Label className="text-[hsl(222,47%,25%)]">שדה תצוגה</Label>
                      <Select
                        value={formData.display_field}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, display_field: value }))}
                        disabled={!formData.source_table}
                      >
                        <SelectTrigger className="text-right border-[hsl(222,47%,25%)]/30 focus:border-[hsl(222,47%,25%)]/60">
                          <SelectValue placeholder="בחר שדה" />
                        </SelectTrigger>
                        <SelectContent className="border-[hsl(222,47%,25%)]/30 bg-white z-50">
                          {getTableColumns(formData.source_table).map(col => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-2 text-right">
                  <Label className="text-[hsl(222,47%,25%)]">אייקון</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                  >
                    <SelectTrigger className="text-right border-[hsl(222,47%,25%)]/30 focus:border-[hsl(222,47%,25%)]/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[hsl(222,47%,25%)]/30 bg-white z-50">
                      {AVAILABLE_ICONS.map(icon => (
                        <SelectItem key={icon.id} value={icon.id}>
                          {icon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 text-right">
                  <Label className="text-[hsl(222,47%,25%)]">צבע</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
                  >
                    <SelectTrigger className="text-right border-[hsl(222,47%,25%)]/30 focus:border-[hsl(222,47%,25%)]/60">
                      <SelectValue>
                        <div className="flex items-center gap-2 justify-end">
                          {AVAILABLE_COLORS.find(c => c.id === formData.color)?.label}
                          <div 
                            className="w-4 h-4 rounded-full border border-white shadow-sm" 
                            style={{ backgroundColor: formData.color }}
                          />
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="border-[hsl(222,47%,25%)]/30 bg-white z-50">
                      {AVAILABLE_COLORS.map(color => (
                        <SelectItem key={color.id} value={color.id}>
                          <div className="flex items-center gap-2 justify-end">
                            {color.label}
                            <div 
                              className="w-4 h-4 rounded-full border border-white shadow-sm" 
                              style={{ backgroundColor: color.id }}
                            />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* OPTIONS MODE: Option list management */}
              {formData.type_mode === 'options' && (
                <div className="space-y-3 p-4 rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50">
                  <Label className="text-emerald-800 font-semibold flex items-center gap-2 justify-end">
                    <List className="h-4 w-4" />
                    אפשרויות בחירה
                  </Label>
                  
                  {/* Existing options list */}
                  {formData.options.length > 0 && (
                    <div className="space-y-2">
                      {formData.options.map((option, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-emerald-200 shadow-sm"
                        >
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => removeOption(index)}
                            className="h-7 w-7 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: option.color }}
                          />
                          <span className="text-right flex-1 font-medium text-[hsl(222,47%,25%)]">
                            {option.label}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {option.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add new option */}
                  <div className="flex gap-2 items-center p-3 bg-white/70 rounded-lg border-2 border-dashed border-emerald-300">
                    <Button 
                      onClick={addOption} 
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Select value={newOptionColor} onValueChange={setNewOptionColor}>
                      <SelectTrigger className="w-16 border-emerald-200">
                        <div 
                          className="w-5 h-5 rounded-full mx-auto"
                          style={{ backgroundColor: newOptionColor }}
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {OPTION_COLORS.map(color => (
                          <SelectItem key={color} value={color}>
                            <div 
                              className="w-5 h-5 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input 
                      value={newOptionLabel}
                      onChange={(e) => setNewOptionLabel(e.target.value)}
                      placeholder="שם האפשרות (לדוגמה: שמעון)"
                      className="text-right flex-1 border-emerald-200"
                      onKeyDown={(e) => e.key === 'Enter' && addOption()}
                    />
                  </div>
                  
                  {formData.options.length === 0 && (
                    <p className="text-sm text-emerald-600 text-right">
                      הוסף לפחות אפשרות אחת
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-start gap-2 pt-2">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[hsl(222,47%,20%)] to-[hsl(222,47%,30%)] text-white border border-[hsl(222,47%,35%)] hover:from-[hsl(222,47%,25%)] hover:to-[hsl(222,47%,35%)] shadow-md"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Save className="h-4 w-4 ml-2" />
                  )}
                  שמור
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  className="border-[hsl(222,47%,25%)]/30 hover:bg-[hsl(222,47%,25%)]/10 hover:border-[hsl(222,47%,25%)]/50"
                >
                  ביטול
                </Button>
              </div>
            </div>
          )}

          {/* Data Types List Header */}
          <div className="flex items-center justify-between px-1">
            {!isCreating && !editingId && (
              <Button 
                onClick={handleCreate} 
                size="sm"
                className="bg-gradient-to-r from-[hsl(222,47%,20%)] to-[hsl(222,47%,30%)] text-white border border-[hsl(222,47%,35%)] hover:from-[hsl(222,47%,25%)] hover:to-[hsl(222,47%,35%)] shadow-md"
              >
                <Plus className="h-4 w-4 ml-2" />
                סוג נתון חדש
              </Button>
            )}
            <h4 className="font-semibold text-[hsl(222,47%,25%)] flex items-center gap-2">
              <Link className="h-4 w-4" />
              סוגי נתונים קיימים
            </h4>
          </div>

          {/* Data Types Table */}
          <ScrollArea className="h-[320px] rounded-xl border-2 border-[hsl(222,47%,25%)]/20 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-[hsl(222,47%,25%)]" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gradient-to-r from-[hsl(222,47%,20%)] to-[hsl(222,47%,28%)] sticky top-0">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-right text-white font-semibold">שם</TableHead>
                    <TableHead className="text-right text-white font-semibold">מקור/אפשרויות</TableHead>
                    <TableHead className="text-right text-white font-semibold">סוג</TableHead>
                    <TableHead className="text-left text-white font-semibold">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allDataTypes.map((dt, index) => {
                    const IconComponent = SYSTEM_ICON_MAP[dt.icon || ''] || Database;
                    const isSystem = dt.source_type === 'system';
                    const isOptionsMode = dt.type_mode === 'options';
                    
                    return (
                      <TableRow 
                        key={dt.id}
                        className={`
                          hover:bg-[hsl(222,47%,25%)]/5 transition-all duration-200
                          ${index % 2 === 0 ? 'bg-[hsl(222,47%,98%)]' : 'bg-white'}
                        `}
                      >
                        <TableCell className="text-right">
                          <div className="flex items-center gap-3 justify-end">
                            <div className="text-right">
                              <p className="font-semibold text-[hsl(222,47%,25%)]">{dt.display_name}</p>
                              <p className="text-xs text-[hsl(222,47%,25%)]/50 font-mono">{dt.name}</p>
                            </div>
                            <div 
                              className="p-2 rounded-lg shadow-sm"
                              style={{ backgroundColor: dt.color ? `${dt.color}15` : 'hsl(222,47%,95%)' }}
                            >
                              <IconComponent 
                                className="h-5 w-5" 
                                style={{ color: dt.color || 'hsl(222,47%,25%)' }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {isOptionsMode ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {(dt.options || []).slice(0, 3).map((opt, i) => (
                                <Badge 
                                  key={i}
                                  variant="outline"
                                  className="text-xs"
                                  style={{ 
                                    borderColor: opt.color, 
                                    backgroundColor: `${opt.color}15`,
                                    color: opt.color 
                                  }}
                                >
                                  {opt.label}
                                </Badge>
                              ))}
                              {(dt.options || []).length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{(dt.options || []).length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <code className="text-xs bg-[hsl(222,47%,25%)]/10 text-[hsl(222,47%,25%)] px-2 py-1 rounded-md font-mono">
                              {dt.source_table}.{dt.display_field}
                            </code>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isSystem ? (
                            <Badge className="bg-[hsl(222,47%,25%)]/10 text-[hsl(222,47%,25%)] border border-[hsl(222,47%,25%)]/30 hover:bg-[hsl(222,47%,25%)]/15">
                              <Lock className="h-3 w-3 ml-1" />
                              מערכת
                            </Badge>
                          ) : isOptionsMode ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">
                              <List className="h-3 w-3 ml-1" />
                              רשימה
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                              <Link className="h-3 w-3 ml-1" />
                              מקושר
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!isSystem && (
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-[hsl(222,47%,25%)]/10 rounded-lg"
                                onClick={() => handleEdit(dt)}
                              >
                                <Edit2 className="h-4 w-4 text-[hsl(222,47%,25%)]" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="border-2 border-red-200">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-right">מחיקת סוג נתון</AlertDialogTitle>
                                    <AlertDialogDescription className="text-right">
                                      האם למחוק את סוג הנתון "{dt.display_name}"? 
                                      העמודות שמשתמשות בסוג זה יאבדו את הקישור שלהן.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-row-reverse gap-2">
                                    <AlertDialogCancel className="border-[hsl(222,47%,25%)]/30">ביטול</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(dt.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      מחק
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-[hsl(222,47%,25%)]/20 pt-4 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-[hsl(222,47%,25%)]/30 hover:bg-[hsl(222,47%,25%)]/10 hover:border-[hsl(222,47%,25%)]/50"
          >
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
