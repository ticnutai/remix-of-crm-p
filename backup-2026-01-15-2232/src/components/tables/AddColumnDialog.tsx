import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Type, Hash, Calendar, ToggleLeft, List, Link2, Loader2, Trash2, Upload, Palette, GripVertical, Timer, Bell, ClipboardList } from 'lucide-react';

export interface CustomColumn {
  id?: string;
  table_name: string;
  column_key: string;
  column_name: string;
  column_type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'data_type' | 'multi_select' | 'rich_text' | 'file' | 'formula' | 'rating' | 'day_counter';
  column_options?: string[];
  data_type_id?: string;
  is_required?: boolean;
  default_value?: string;
  column_order?: number;
  column_group?: string;
  allow_multiple?: boolean;
  formula?: string;
  max_rating?: number;
}

interface DataType {
  id: string;
  name: string;
  display_name: string;
  source_table: string;
  icon?: string;
  color?: string;
}

interface AddColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  onColumnAdded: (column: CustomColumn) => void;
  existingColumns?: CustomColumn[];
}

const columnTypeConfig = {
  text: { label: 'טקסט', icon: Type, description: 'שדה טקסט חופשי' },
  number: { label: 'מספר', icon: Hash, description: 'ערך מספרי' },
  date: { label: 'תאריך', icon: Calendar, description: 'בחירת תאריך' },
  boolean: { label: 'כן/לא', icon: ToggleLeft, description: 'תיבת סימון' },
  select: { label: 'בחירה', icon: List, description: 'רשימת אפשרויות' },
  multi_select: { label: 'בחירה מרובה', icon: List, description: 'בחירת מספר אפשרויות' },
  data_type: { label: 'סוג נתון', icon: Link2, description: 'קישור לנתון אחר (לקוח, עובד, פרויקט)' },
  day_counter: { label: 'מונה ימים', icon: Timer, description: 'ספירת ימי עבודה מתאריך (ללא שישי-שבת וחגים)' },
};

// Predefined colors for select options
const OPTION_COLORS = [
  { value: '#3B82F6', label: 'כחול' },
  { value: '#10B981', label: 'ירוק' },
  { value: '#F59E0B', label: 'כתום' },
  { value: '#EF4444', label: 'אדום' },
  { value: '#8B5CF6', label: 'סגול' },
  { value: '#EC4899', label: 'ורוד' },
  { value: '#6B7280', label: 'אפור' },
  { value: '#1E3A8A', label: 'נייבי כהה' },
  { value: '#14B8A6', label: 'טורקיז' },
  { value: '#F97316', label: 'כתום בהיר' },
];

interface SelectOptionItem {
  name: string;
  color: string;
}

export function AddColumnDialog({
  open,
  onOpenChange,
  tableName,
  onColumnAdded,
  existingColumns = [],
}: AddColumnDialogProps) {
  const [columnName, setColumnName] = useState('');
  const [columnType, setColumnType] = useState<keyof typeof columnTypeConfig>('text');
  const [selectOptionItems, setSelectOptionItems] = useState<SelectOptionItem[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionColor, setNewOptionColor] = useState(OPTION_COLORS[0].value);
  const [selectedDataType, setSelectedDataType] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataTypes, setDataTypes] = useState<DataType[]>([]);
  const [addAnother, setAddAnother] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Day counter specific options
  const [dayCounterTargetDays, setDayCounterTargetDays] = useState<number>(35);
  const [dayCounterConnectToTask, setDayCounterConnectToTask] = useState(false);
  const [dayCounterConnectToReminder, setDayCounterConnectToReminder] = useState(false);

  // Fetch data types
  useEffect(() => {
    async function fetchDataTypes() {
      const { data } = await supabase
        .from('data_types')
        .select('*')
        .order('display_name');
      
      if (data) {
        setDataTypes(data as DataType[]);
      }
    }
    
    if (open) {
      fetchDataTypes();
    }
  }, [open]);

  const generateColumnKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9א-ת\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  };

  const handleSubmit = async () => {
    if (!columnName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם עמודה',
        variant: 'destructive',
      });
      return;
    }

    const columnKey = generateColumnKey(columnName);
    
    // Check if column key already exists
    if (existingColumns.some(c => c.column_key === columnKey)) {
      toast({
        title: 'שגיאה',
        description: 'עמודה עם שם זה כבר קיימת',
        variant: 'destructive',
      });
      return;
    }

    if (columnType === 'data_type' && !selectedDataType) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור סוג נתון',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newColumn: Partial<CustomColumn> = {
        table_name: tableName,
        column_key: columnKey,
        column_name: columnName.trim(),
        column_type: columnType,
        is_required: isRequired,
        default_value: defaultValue || undefined,
        column_order: existingColumns.length,
      };

      // Convert select option items to array with color info
      const optionsArray = selectOptionItems.length > 0 
        ? selectOptionItems.map(opt => ({ value: opt.name, label: opt.name, color: opt.color }))
        : [];

      if ((columnType === 'select' || columnType === 'multi_select') && selectOptionItems.length > 0) {
        newColumn.column_options = selectOptionItems.map(opt => opt.name);
      }

      if (columnType === 'data_type') {
        newColumn.data_type_id = selectedDataType;
      }

      const insertData = {
        table_name: tableName,
        column_key: columnKey,
        column_name: columnName.trim(),
        column_type: columnType,
        is_required: isRequired,
        default_value: defaultValue || null,
        column_order: existingColumns.length,
        column_options: columnType === 'day_counter' 
          ? [{
              targetDays: dayCounterTargetDays,
              connectToTask: dayCounterConnectToTask,
              connectToReminder: dayCounterConnectToReminder,
            }]
          : optionsArray,
        data_type_id: columnType === 'data_type' ? selectedDataType : null,
        allow_multiple: columnType === 'multi_select' || false,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('table_custom_columns')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'העמודה נוספה',
        description: `העמודה "${columnName}" נוספה בהצלחה`,
      });

      onColumnAdded(data as CustomColumn);
      
      if (addAnother) {
        // Reset form but keep dialog open
        resetForm();
      } else {
        // Close dialog and reset
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error adding column:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף את העמודה',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setColumnName('');
    setColumnType('text');
    setSelectOptionItems([]);
    setNewOptionName('');
    setNewOptionColor(OPTION_COLORS[0].value);
    setSelectedDataType('');
    setIsRequired(false);
    setDefaultValue('');
    setAddAnother(false);
    setDayCounterTargetDays(35);
    setDayCounterConnectToTask(false);
    setDayCounterConnectToReminder(false);
  };

  // Add a new option
  const addOption = () => {
    if (!newOptionName.trim()) return;
    
    // Check if option already exists
    if (selectOptionItems.some(opt => opt.name.toLowerCase() === newOptionName.trim().toLowerCase())) {
      toast({
        title: 'שגיאה',
        description: 'אפשרות זו כבר קיימת',
        variant: 'destructive',
      });
      return;
    }

    setSelectOptionItems(prev => [...prev, { name: newOptionName.trim(), color: newOptionColor }]);
    setNewOptionName('');
    // Cycle to next color
    const currentIndex = OPTION_COLORS.findIndex(c => c.value === newOptionColor);
    setNewOptionColor(OPTION_COLORS[(currentIndex + 1) % OPTION_COLORS.length].value);
  };

  // Remove an option
  const removeOption = (index: number) => {
    setSelectOptionItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update option color
  const updateOptionColor = (index: number, color: string) => {
    setSelectOptionItems(prev => prev.map((opt, i) => 
      i === index ? { ...opt, color } : opt
    ));
  };

  // Import options from TXT file
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      const newOptions: SelectOptionItem[] = lines.map((line, index) => ({
        name: line.trim(),
        color: OPTION_COLORS[index % OPTION_COLORS.length].value,
      }));

      // Filter out duplicates
      const existingNames = selectOptionItems.map(opt => opt.name.toLowerCase());
      const uniqueNewOptions = newOptions.filter(opt => !existingNames.includes(opt.name.toLowerCase()));

      setSelectOptionItems(prev => [...prev, ...uniqueNewOptions]);

      toast({
        title: 'הייבוא הושלם',
        description: `נוספו ${uniqueNewOptions.length} אפשרויות מהקובץ`,
      });
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-white border border-[#D4AF37] shadow-2xl">
        <DialogHeader className="border-b border-[#D4AF37]/40 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-lg bg-[#1e3a8a]/10 border border-[#D4AF37]/30">
              <Plus className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <span className="text-[#1e3a8a] font-bold">
              הוספת עמודה חדשה
            </span>
          </DialogTitle>
          <DialogDescription className="text-[#1e3a8a]/70 text-base mt-2">
            הגדר עמודה מותאמת אישית לטבלה שלך - הוסף סוג נתונים, אפשרויות ועוד
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6">
          {/* Column Name */}
          <div className="grid gap-3 p-4 rounded-lg bg-[#1e3a8a]/5 border border-[#D4AF37]/30">
            <Label htmlFor="column-name" className="text-[#1e3a8a] font-semibold text-base flex items-center gap-2">
              <Type className="h-4 w-4 text-[#D4AF37]" />
              שם העמודה *
            </Label>
            <Input
              id="column-name"
              placeholder="לדוגמה: הערות, עדיפות, תאריך סיום..."
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              className="bg-white border-[#1e3a8a]/20 text-[#1e3a8a] placeholder:text-[#1e3a8a]/50 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 text-base h-11"
            />
          </div>

          {/* Column Type */}
          <div className="grid gap-3 p-4 rounded-lg bg-[#1e3a8a]/5 border border-[#D4AF37]/30">
            <Label className="text-[#1e3a8a] font-semibold text-base flex items-center gap-2">
              <List className="h-4 w-4 text-[#D4AF37]" />
              סוג העמודה *
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(columnTypeConfig).map(([type, config]) => {
                const Icon = config.icon;
                const isSelected = columnType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setColumnType(type as keyof typeof columnTypeConfig)}
                    className={`group p-4 rounded-xl border text-right transition-all duration-300 transform hover:scale-105 ${
                      isSelected 
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-2 ring-[#D4AF37]/30 shadow-lg shadow-[#D4AF37]/20' 
                        : 'border-[#1e3a8a]/20 bg-white hover:border-[#D4AF37] hover:bg-[#1e3a8a]/5 hover:shadow-md'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mb-2 transition-colors ${
                      isSelected ? 'text-[#D4AF37]' : 'text-[#1e3a8a]/60 group-hover:text-[#D4AF37]'
                    }`} />
                    <div className={`text-sm font-semibold mb-1 transition-colors ${
                      isSelected ? 'text-[#1e3a8a]' : 'text-[#1e3a8a]/70 group-hover:text-[#1e3a8a]'
                    }`}>{config.label}</div>
                    <div className="text-xs text-[#1e3a8a]/50">{config.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Options - Enhanced UI */}
          {(columnType === 'select' || columnType === 'multi_select') && (
            <div className="grid gap-4 p-4 rounded-lg bg-gradient-to-br from-[#10B981]/5 to-[#10B981]/10 border-2 border-dashed border-[#10B981]/40 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <Label className="text-[#1e3a8a] font-semibold text-base flex items-center gap-2">
                  <List className="h-4 w-4 text-[#10B981]" />
                  אפשרויות בחירה
                  {columnType === 'multi_select' && <Badge variant="secondary">רב-בחירה</Badge>}
                </Label>
                
                {/* Import from TXT */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".txt"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 text-[#1e3a8a] border-[#10B981]/30 hover:bg-[#10B981]/10"
                  >
                    <Upload className="h-4 w-4" />
                    ייבוא מ-TXT
                  </Button>
                </div>
              </div>

              {/* Add new option input */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white border-2 border-dashed border-[#10B981]/50">
                <Button
                  type="button"
                  size="sm"
                  onClick={addOption}
                  disabled={!newOptionName.trim()}
                  className="bg-[#10B981] hover:bg-[#10B981]/90 text-white shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                {/* Color Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1 border-[#1e3a8a]/20"
                    >
                      <div 
                        className="w-4 h-4 rounded-full border border-white shadow-sm" 
                        style={{ backgroundColor: newOptionColor }}
                      />
                      <span className="sr-only">בחר צבע</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="grid grid-cols-5 gap-1">
                      {OPTION_COLORS.map(color => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setNewOptionColor(color.value)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            newOptionColor === color.value 
                              ? 'border-[#1e3a8a] scale-110' 
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Input
                  placeholder="שם האפשרות (לדוגמה: שמעון)"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                  className="flex-1 bg-white border-[#1e3a8a]/20 text-[#1e3a8a] placeholder:text-[#1e3a8a]/40"
                />
              </div>

              {/* Options list */}
              {selectOptionItems.length > 0 ? (
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2">
                    {selectOptionItems.map((option, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#1e3a8a]/10 hover:border-[#10B981]/30 transition-colors group"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-50 cursor-grab" />
                        
                        {/* Color Picker for existing option */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="w-6 h-6 rounded-full border border-white shadow-sm shrink-0 hover:scale-110 transition-transform"
                              style={{ backgroundColor: option.color }}
                              title="שנה צבע"
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="start">
                            <div className="grid grid-cols-5 gap-1">
                              {OPTION_COLORS.map(color => (
                                <button
                                  key={color.value}
                                  type="button"
                                  onClick={() => updateOptionColor(index, color.value)}
                                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                                    option.color === color.value 
                                      ? 'border-[#1e3a8a] scale-110' 
                                      : 'border-transparent hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  title={color.label}
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        
                        <span className="flex-1 text-[#1e3a8a] font-medium">{option.name}</span>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-[#10B981] text-center py-2">
                  הוסף לפחות אפשרות אחת
                </p>
              )}
            </div>
          )}

          {/* Data Type Selection */}
          {columnType === 'data_type' && (
            <div className="grid gap-3 p-4 rounded-lg bg-[#1e3a8a]/5 border border-[#D4AF37]/30 animate-in slide-in-from-top-2 duration-300">
              <Label className="text-[#1e3a8a] font-semibold text-base flex items-center gap-2">
                <Link2 className="h-4 w-4 text-[#D4AF37]" />
                סוג הנתון המקושר *
              </Label>
              <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                <SelectTrigger className="bg-white border-[#1e3a8a]/20 text-[#1e3a8a] focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 h-11 text-base">
                  <SelectValue placeholder="בחר סוג נתון..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#D4AF37]">
                  {dataTypes.map((dt) => (
                    <SelectItem 
                      key={dt.id} 
                      value={dt.id}
                      className="text-[#1e3a8a] hover:bg-[#1e3a8a]/10 focus:bg-[#1e3a8a]/10"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: dt.color || '#D4AF37' }}
                        />
                        {dt.display_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[#1e3a8a]/60">
                ניתן ליצור סוגי נתונים חדשים דרך ניהול סוגי נתונים בסרגל הצד
              </p>
            </div>
          )}

          {/* Day Counter Configuration - מונה ימים */}
          {columnType === 'day_counter' && (
            <div className="grid gap-4 p-4 rounded-lg bg-gradient-to-br from-[#8B5CF6]/5 to-[#8B5CF6]/10 border-2 border-dashed border-[#8B5CF6]/40 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-[#8B5CF6]" />
                <Label className="text-[#1e3a8a] font-semibold text-base">
                  הגדרות מונה ימים
                </Label>
              </div>
              
              <p className="text-sm text-[#1e3a8a]/70">
                מונה ימי עבודה בלבד (ללא שישי-שבת, חגים וערבי חגים)
              </p>
              
              {/* Target Days */}
              <div className="grid gap-2">
                <Label htmlFor="target-days" className="text-[#1e3a8a]/80 font-medium">
                  יעד ימי עבודה (י"ע)
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="target-days"
                    type="number"
                    min={1}
                    max={365}
                    value={dayCounterTargetDays}
                    onChange={(e) => setDayCounterTargetDays(parseInt(e.target.value) || 35)}
                    className="w-24 bg-white border-[#1e3a8a]/20 text-[#1e3a8a] text-center font-bold"
                  />
                  <span className="text-[#1e3a8a]/60">ימי עבודה</span>
                </div>
                <p className="text-xs text-[#1e3a8a]/50">
                  לדוגמה: תיק מידע = 35 י"ע, ועדה = 21 י"ע
                </p>
              </div>

              {/* Connect to Tasks */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/40 transition-colors">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-[#8B5CF6]" />
                  <div>
                    <Label htmlFor="connect-task" className="text-[#1e3a8a] font-medium cursor-pointer">
                      חיבור למשימות
                    </Label>
                    <p className="text-xs text-[#1e3a8a]/60">יצירת משימה אוטומטית כשמתקרב הזמן</p>
                  </div>
                </div>
                <Switch
                  id="connect-task"
                  checked={dayCounterConnectToTask}
                  onCheckedChange={setDayCounterConnectToTask}
                  className="data-[state=checked]:bg-[#8B5CF6]"
                />
              </div>

              {/* Connect to Reminders */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/40 transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-[#8B5CF6]" />
                  <div>
                    <Label htmlFor="connect-reminder" className="text-[#1e3a8a] font-medium cursor-pointer">
                      חיבור לתזכורות
                    </Label>
                    <p className="text-xs text-[#1e3a8a]/60">תזכורת אוטומטית לפני תום הזמן</p>
                  </div>
                </div>
                <Switch
                  id="connect-reminder"
                  checked={dayCounterConnectToReminder}
                  onCheckedChange={setDayCounterConnectToReminder}
                  className="data-[state=checked]:bg-[#8B5CF6]"
                />
              </div>

              <div className="p-3 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/30">
                <p className="text-sm text-[#1e3a8a] font-medium">
                  💡 המונה יציג:
                </p>
                <ul className="text-xs text-[#1e3a8a]/70 mt-1 space-y-1 pr-4">
                  <li>• ימי עבודה שעברו / יעד</li>
                  <li>• ימים רגילים (כולל סופ"ש)</li>
                  <li>• התראה צבעונית כשמתקרב הזמן</li>
                </ul>
              </div>
            </div>
          )}

          {/* Default Value */}
          {columnType !== 'data_type' && columnType !== 'boolean' && (
            <div className="grid gap-3 p-4 rounded-lg bg-[#1e3a8a]/5 border border-[#D4AF37]/30">
              <Label htmlFor="default" className="text-[#1e3a8a]/80 font-medium text-base">
                ערך ברירת מחדל (אופציונלי)
              </Label>
              <Input
                id="default"
                placeholder="ערך ברירת מחדל לרשומות חדשות"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                className="bg-white border-[#1e3a8a]/20 text-[#1e3a8a] placeholder:text-[#1e3a8a]/50 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 text-base h-11"
              />
            </div>
          )}

          {/* Required Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1e3a8a]/5 border border-[#D4AF37]/30 hover:bg-[#1e3a8a]/10 transition-colors">
            <div>
              <Label htmlFor="required" className="text-[#1e3a8a] font-medium text-base cursor-pointer">
                שדה חובה
              </Label>
              <p className="text-sm text-[#1e3a8a]/60 mt-1">חובה למלא שדה זה</p>
            </div>
            <Switch
              id="required"
              checked={isRequired}
              onCheckedChange={setIsRequired}
              className="data-[state=checked]:bg-[#D4AF37]"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-[#D4AF37]/40 pt-6 gap-3 flex-col sm:flex-row">
          <div className="flex items-center gap-2 flex-1">
            <Checkbox
              id="add-another"
              checked={addAnother}
              onCheckedChange={(checked) => setAddAnother(checked as boolean)}
              className="data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
            />
            <Label htmlFor="add-another" className="text-sm text-[#1e3a8a]/70 cursor-pointer">
              המשך להוסיף עמודות נוספות
            </Label>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              className="bg-white border-[#1e3a8a]/30 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 hover:text-[#1e3a8a] hover:border-[#D4AF37] transition-all duration-200 h-11 text-base"
            >
              ביטול
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="bg-gradient-to-r from-[#D4AF37] via-[#F4BF37] to-[#D4AF37] hover:from-[#F4BF37] hover:via-[#D4AF37] hover:to-[#F4BF37] text-[#1e3a8a] font-bold shadow-lg shadow-[#D4AF37]/30 hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all duration-200 h-11 text-base disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  {addAnother ? 'מוסיף...' : 'מוסיף...'}
                </>
              ) : (
                <>
                  <Plus className="ml-2 h-5 w-5" />
                  {addAnother ? 'הוסף ועוד' : 'הוסף עמודה'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
