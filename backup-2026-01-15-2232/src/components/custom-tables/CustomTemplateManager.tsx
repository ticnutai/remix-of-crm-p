import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
  Edit2,
  Save,
  X,
  Copy,
  GripVertical,
  Check,
  Sparkles,
  FolderPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { COLUMN_TEMPLATES, ColumnTemplate, TEMPLATE_CATEGORIES } from '@/lib/columnTemplates';
import { supabase } from '@/integrations/supabase/client';

// Data Type interface
interface DataType {
  id: string;
  name: string;
  display_name: string;
  source_table: string;
  icon?: string;
  color?: string;
}

// Custom template interface
interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  category: 'custom';
  columns: ColumnConfig[];
  createdAt: string;
  updatedAt: string;
}

interface ColumnConfig {
  id: string;
  column_key: string;
  column_name: string;
  column_type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea' | 'url' | 'email' | 'phone' | 'data_type' | 'multi_select';
  column_options?: string[];
  default_value?: string;
  is_required: boolean;
  data_type_id?: string;
}

interface CustomTemplateManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  onColumnsAdded: (columns: ColumnConfig[]) => void;
  existingColumns?: string[];
}

// Column type labels in Hebrew
const COLUMN_TYPES = [
  { value: 'text', label: 'טקסט' },
  { value: 'number', label: 'מספר' },
  { value: 'date', label: 'תאריך' },
  { value: 'select', label: 'בחירה מרשימה' },
  { value: 'multi_select', label: 'בחירה מרובה' },
  { value: 'boolean', label: 'כן/לא' },
  { value: 'data_type', label: 'סוג נתון (קישור)' },
  { value: 'textarea', label: 'טקסט ארוך' },
  { value: 'url', label: 'קישור' },
  { value: 'email', label: 'אימייל' },
  { value: 'phone', label: 'טלפון' },
];

// Colors
const COLORS = {
  navy: '#1e3a8a',
  gold: '#D5BC9E',
  gray: '#828388',
  white: '#ffffff',
  lightGold: '#F5EDE4',
};

// Sortable Column Item Component
function SortableColumnItem({
  column,
  index,
  onUpdate,
  onDelete,
  isEditing,
  setEditingId,
  dataTypes = [],
}: {
  column: ColumnConfig;
  index: number;
  onUpdate: (id: string, updates: Partial<ColumnConfig>) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  setEditingId: (id: string | null) => void;
  dataTypes?: DataType[];
}) {
  // Debug log
  if (column.column_type === 'data_type') {
    console.log('🎯 SortableColumnItem dataTypes:', dataTypes);
  }
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border transition-all duration-200",
        "bg-white hover:shadow-md",
        isEditing ? "border-[#D5BC9E] shadow-lg" : "border-[#D5BC9E]/30 hover:border-[#D5BC9E]"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-[#828388] hover:text-[#1e3a8a] pt-1"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Column Content */}
        <div className="flex-1 space-y-3" dir="rtl">
          {isEditing ? (
            // Edit Mode
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#1e3a8a] font-medium">שם העמודה</Label>
                  <Input
                    value={column.column_name}
                    onChange={(e) => onUpdate(column.id, { 
                      column_name: e.target.value,
                      column_key: column.column_key || e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '')
                    })}
                    placeholder="שם העמודה..."
                    className="border-[#D5BC9E]/50 focus:border-[#D5BC9E] focus:ring-[#D5BC9E]/20"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#1e3a8a] font-medium">סוג נתון</Label>
                  <Select
                    value={column.column_type}
                    onValueChange={(value: ColumnConfig['column_type']) => onUpdate(column.id, { column_type: value })}
                  >
                    <SelectTrigger className="border-[#D5BC9E]/50 focus:border-[#D5BC9E]">
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#1e3a8a] font-medium">מפתח (לתכנות)</Label>
                  <Input
                    value={column.column_key}
                    onChange={(e) => onUpdate(column.id, { column_key: e.target.value })}
                    placeholder="column_key"
                    className="border-[#D5BC9E]/50 focus:border-[#D5BC9E]"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#1e3a8a] font-medium">ערך ברירת מחדל</Label>
                  <Input
                    value={column.default_value || ''}
                    onChange={(e) => onUpdate(column.id, { default_value: e.target.value })}
                    placeholder="ערך..."
                    className="border-[#D5BC9E]/50 focus:border-[#D5BC9E]"
                    dir="rtl"
                  />
                </div>
              </div>

              {column.column_type === 'select' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#1e3a8a] font-medium">אפשרויות בחירה (מופרדות בפסיקים)</Label>
                  <Textarea
                    value={column.column_options?.join(', ') || ''}
                    onChange={(e) => onUpdate(column.id, { 
                      column_options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="אפשרות 1, אפשרות 2, אפשרות 3..."
                    className="border-[#D5BC9E]/50 focus:border-[#D5BC9E] min-h-[60px]"
                    dir="rtl"
                  />
                </div>
              )}

              {column.column_type === 'multi_select' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#1e3a8a] font-medium">אפשרויות בחירה (מופרדות בפסיקים)</Label>
                  <Textarea
                    value={column.column_options?.join(', ') || ''}
                    onChange={(e) => onUpdate(column.id, { 
                      column_options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="אפשרות 1, אפשרות 2, אפשרות 3..."
                    className="border-[#D5BC9E]/50 focus:border-[#D5BC9E] min-h-[60px]"
                    dir="rtl"
                  />
                </div>
              )}

              {column.column_type === 'data_type' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#1e3a8a] font-medium">סוג הנתון המקושר *</Label>
                  {dataTypes.length > 0 ? (
                    <Select
                      value={column.data_type_id || ''}
                      onValueChange={(value) => onUpdate(column.id, { data_type_id: value })}
                    >
                      <SelectTrigger className="border-[#D5BC9E]/50 focus:border-[#D5BC9E]">
                        <SelectValue placeholder="בחר סוג נתון..." />
                      </SelectTrigger>
                      <SelectContent>
                        {dataTypes.map(dt => (
                          <SelectItem key={dt.id} value={dt.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: dt.color || '#3b82f6' }}
                              />
                              <span>{dt.display_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-amber-600 p-2 bg-amber-50 rounded border border-amber-200">
                      טוען סוגי נתונים...
                    </div>
                  )}
                  <p className="text-xs text-[#828388]">
                    קישור לרשומה אחרת במערכת (לקוח, עובד, פרויקט וכו')
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={column.is_required}
                    onChange={(e) => onUpdate(column.id, { is_required: e.target.checked })}
                    className="w-4 h-4 rounded border-[#D5BC9E] text-[#1e3a8a] focus:ring-[#D5BC9E]"
                  />
                  <span className="text-sm text-[#1e3a8a]">שדה חובה</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                  className="text-[#828388] hover:text-[#1e3a8a]"
                >
                  <Check className="h-4 w-4 ml-1" />
                  סיום עריכה
                </Button>
              </div>
            </>
          ) : (
            // View Mode
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#1e3a8a]">{column.column_name}</span>
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-[#F5EDE4] text-[#1e3a8a] border-[#D5BC9E]"
                  >
                    {COLUMN_TYPES.find(t => t.value === column.column_type)?.label || column.column_type}
                  </Badge>
                  {column.is_required && (
                    <Badge variant="destructive" className="text-xs">חובה</Badge>
                  )}
                </div>
                <div className="text-xs text-[#828388] mt-1">
                  <code className="bg-gray-50 px-1 py-0.5 rounded text-[10px]">{column.column_key}</code>
                  {column.default_value && (
                    <span className="mr-2">• ברירת מחדל: {column.default_value}</span>
                  )}
                </div>
              </div>

              {/* Hover Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(column.id)}
                  className="h-8 w-8 p-0 text-[#1e3a8a] hover:bg-[#F5EDE4]"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(column.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CustomTemplateManager({
  open,
  onOpenChange,
  tableName,
  onColumnsAdded,
  existingColumns = [],
}: CustomTemplateManagerProps) {
  // State
  const [activeTab, setActiveTab] = useState<'templates' | 'create'>('templates');
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ColumnTemplate | CustomTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Create/Edit template state
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data types state (for data_type column type)
  const [dataTypes, setDataTypes] = useState<DataType[]>([]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch data types from Supabase
  useEffect(() => {
    async function fetchDataTypes() {
      console.log('🔍 Fetching data types...');
      const { data, error } = await supabase
        .from('data_types')
        .select('*')
        .order('display_name');
      
      console.log('📦 Data types result:', { data, error });
      
      if (data) {
        setDataTypes(data as DataType[]);
      }
    }
    
    if (open) {
      fetchDataTypes();
    }
  }, [open]);

  // Load custom templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customColumnTemplates');
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load custom templates:', e);
      }
    }
  }, []);

  // Save custom templates to localStorage
  const saveCustomTemplates = useCallback((templates: CustomTemplate[]) => {
    localStorage.setItem('customColumnTemplates', JSON.stringify(templates));
    setCustomTemplates(templates);
  }, []);

  // Filter templates
  const filteredTemplates = [...COLUMN_TEMPLATES, ...customTemplates].filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Generate unique ID
  const generateId = () => `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add new column
  const addColumn = () => {
    const newColumn: ColumnConfig = {
      id: generateId(),
      column_key: '',
      column_name: '',
      column_type: 'text',
      is_required: false,
    };
    setColumns(prev => [...prev, newColumn]);
    setEditingColumnId(newColumn.id);
  };

  // Update column
  const updateColumn = (id: string, updates: Partial<ColumnConfig>) => {
    setColumns(prev => prev.map(col => 
      col.id === id ? { ...col, ...updates } : col
    ));
  };

  // Delete column
  const deleteColumn = (id: string) => {
    setColumns(prev => prev.filter(col => col.id !== id));
    if (editingColumnId === id) {
      setEditingColumnId(null);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setColumns(prev => {
        const oldIndex = prev.findIndex(col => col.id === active.id);
        const newIndex = prev.findIndex(col => col.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  // Save template
  const saveTemplate = () => {
    console.log('💾 Saving template...');
    console.log('📝 Template name:', templateName);
    console.log('📊 Columns:', columns);
    
    if (!templateName.trim() || columns.length === 0) {
      console.warn('❌ Cannot save: missing name or columns');
      return;
    }

    const template: CustomTemplate = {
      id: editingTemplateId || generateId(),
      name: templateName,
      description: templateDescription,
      category: 'custom',
      columns: columns,
      createdAt: editingTemplateId ? customTemplates.find(t => t.id === editingTemplateId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('✅ Template created:', template);

    if (editingTemplateId) {
      console.log('🔄 Updating existing template');
      saveCustomTemplates(customTemplates.map(t => t.id === editingTemplateId ? template : t));
    } else {
      console.log('➕ Adding new template');
      saveCustomTemplates([...customTemplates, template]);
    }

    // Reset form
    resetForm();
    setActiveTab('templates');
  };

  // Delete template
  const deleteTemplate = (templateId: string) => {
    saveCustomTemplates(customTemplates.filter(t => t.id !== templateId));
    if (selectedTemplate && 'id' in selectedTemplate && selectedTemplate.id === templateId) {
      setSelectedTemplate(null);
    }
  };

  // Edit template
  const editTemplate = (template: CustomTemplate) => {
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateDescription(template.description);
    setColumns(template.columns.map(col => ({
      ...col,
      id: col.id || generateId(),
    })));
    setActiveTab('create');
  };

  // Use template
  const useTemplate = (template: ColumnTemplate | CustomTemplate) => {
    console.log('🎯 Using template:', template.name);
    console.log('📋 Template columns:', template.columns);
    console.log('🔍 Existing columns:', existingColumns);
    
    setIsLoading(true);
    const columnsToAdd = template.columns.map(col => ({
      ...col,
      id: ('id' in col && col.id) ? col.id : generateId(),
      column_key: col.column_key,
      column_name: col.column_name,
      column_type: col.column_type as ColumnConfig['column_type'],
      is_required: col.is_required || false,
    })).filter(col => !existingColumns.includes(col.column_key));

    console.log('➕ Columns to add:', columnsToAdd);
    console.log('📊 Number of columns to add:', columnsToAdd.length);

    setTimeout(() => {
      console.log('🚀 Calling onColumnsAdded with:', columnsToAdd);
      onColumnsAdded(columnsToAdd);
      setIsLoading(false);
      onOpenChange(false);
    }, 500);
  };

  // Reset form
  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setColumns([]);
    setEditingColumnId(null);
    setEditingTemplateId(null);
  };

  // Duplicate template
  const duplicateTemplate = (template: ColumnTemplate | CustomTemplate) => {
    setEditingTemplateId(null);
    setTemplateName(`${template.name} (העתק)`);
    setTemplateDescription(template.description);
    setColumns(template.columns.map(col => ({
      ...col,
      id: generateId(),
      column_key: col.column_key,
      column_name: col.column_name,
      column_type: col.column_type as ColumnConfig['column_type'],
      is_required: col.is_required || false,
    })));
    setActiveTab('create');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-5xl max-h-[90vh] p-0 flex flex-col overflow-hidden"
        style={{ backgroundColor: COLORS.white }}
        dir="rtl"
      >
        {/* Header */}
        <DialogHeader 
          className="px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: COLORS.gold }}
        >
          <DialogTitle 
            className="text-2xl font-bold text-right"
            style={{ color: COLORS.navy }}
            dir="rtl"
          >
            <div className="flex items-center gap-3 justify-end">
              <span>מערכת תבניות עמודות</span>
              <Settings2 className="h-6 w-6" style={{ color: COLORS.gold }} />
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Tabs */}
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as 'templates' | 'create')}
            className="flex-1 flex flex-col overflow-hidden"
            dir="rtl"
          >
            <div className="px-6 pt-4 flex-shrink-0">
              <TabsList 
                className="w-full grid grid-cols-2 h-12"
                style={{ 
                  backgroundColor: COLORS.lightGold,
                  border: `1px solid ${COLORS.gold}`,
                }}
              >
                <TabsTrigger 
                  value="templates"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] font-medium"
                >
                  <Sparkles className="h-4 w-4 ml-2" />
                  תבניות קיימות
                </TabsTrigger>
                <TabsTrigger 
                  value="create"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] font-medium"
                >
                  <FolderPlus className="h-4 w-4 ml-2" />
                  {editingTemplateId ? 'עריכת תבנית' : 'יצירת תבנית חדשה'}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Templates Tab */}
            <TabsContent value="templates" className="flex-1 mt-0 overflow-hidden flex flex-col">
              <div className="flex-1 flex flex-col gap-4 overflow-hidden p-6">
                {/* Search & Filter */}
                <div className="flex gap-3" dir="rtl">
                  <div className="relative flex-1">
                    <Search 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                      style={{ color: COLORS.gray }}
                    />
                    <Input
                      placeholder="חיפוש תבניות..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                      style={{ 
                        borderColor: `${COLORS.gold}50`,
                        backgroundColor: COLORS.white,
                      }}
                      dir="rtl"
                    />
                  </div>
                  <Select value={selectedCategory || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? null : v)}>
                    <SelectTrigger 
                      className="w-40"
                      style={{ borderColor: `${COLORS.gold}50` }}
                    >
                      <SelectValue placeholder="כל הקטגוריות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הקטגוריות</SelectItem>
                      {TEMPLATE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                      <SelectItem value="custom">תבניות מותאמות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Templates List */}
                <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                    {filteredTemplates.map(template => {
                      const isCustom = 'createdAt' in template;
                      return (
                        <div
                          key={template.id}
                          className={cn(
                            "group relative rounded-lg p-4 cursor-pointer transition-all duration-200",
                            "hover:shadow-lg border",
                            selectedTemplate?.id === template.id 
                              ? "shadow-lg" 
                              : "hover:border-[#D5BC9E]"
                          )}
                          style={{ 
                            backgroundColor: COLORS.white,
                            borderColor: selectedTemplate?.id === template.id ? COLORS.gold : `${COLORS.gold}30`,
                          }}
                          onClick={() => setSelectedTemplate(template)}
                          dir="rtl"
                        >
                          {/* Template Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 
                                className="font-semibold text-lg"
                                style={{ color: COLORS.navy }}
                              >
                                {template.name}
                              </h3>
                              <p 
                                className="text-sm mt-1"
                                style={{ color: COLORS.gray }}
                              >
                                {template.description}
                              </p>
                            </div>
                            {isCustom && (
                              <Badge 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: COLORS.lightGold,
                                  color: COLORS.navy,
                                  border: `1px solid ${COLORS.gold}`,
                                }}
                              >
                                מותאם אישית
                              </Badge>
                            )}
                          </div>

                          {/* Columns Preview */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {template.columns.slice(0, 4).map((col, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline"
                                className="text-xs"
                                style={{ 
                                  backgroundColor: `${COLORS.gold}15`,
                                  borderColor: COLORS.gold,
                                  color: COLORS.navy,
                                }}
                              >
                                {col.column_name}
                              </Badge>
                            ))}
                            {template.columns.length > 4 && (
                              <Badge 
                                variant="outline"
                                className="text-xs"
                                style={{ 
                                  borderColor: COLORS.gold,
                                  color: COLORS.gray,
                                }}
                              >
                                +{template.columns.length - 4}
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                useTemplate(template);
                              }}
                              className="flex-1"
                              style={{ 
                                backgroundColor: COLORS.navy,
                                color: COLORS.white,
                              }}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 ml-1" />
                                  השתמש
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateTemplate(template);
                              }}
                              style={{ borderColor: COLORS.gold, color: COLORS.navy }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {isCustom && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editTemplate(template as CustomTemplate);
                                  }}
                                  style={{ borderColor: COLORS.gold, color: COLORS.navy }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTemplate(template.id);
                                  }}
                                  className="text-red-500 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {filteredTemplates.length === 0 && (
                      <div className="col-span-2 text-center py-12">
                        <Sparkles 
                          className="h-12 w-12 mx-auto mb-3 opacity-50"
                          style={{ color: COLORS.gold }}
                        />
                        <p style={{ color: COLORS.gray }}>לא נמצאו תבניות מתאימות</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Create/Edit Tab */}
            <TabsContent value="create" className="flex-1 mt-0 overflow-y-auto">
              <div className="flex flex-col gap-4 p-6">
                {/* Template Details */}
                <div className="grid grid-cols-2 gap-4" dir="rtl">
                  <div className="space-y-2">
                    <Label 
                      className="font-medium"
                      style={{ color: COLORS.navy }}
                    >
                      שם התבנית *
                    </Label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="לדוגמה: פרטי קשר מורחבים"
                      style={{ 
                        borderColor: `${COLORS.gold}50`,
                        backgroundColor: COLORS.white,
                      }}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label 
                      className="font-medium"
                      style={{ color: COLORS.navy }}
                    >
                      תיאור
                    </Label>
                    <Input
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="תיאור קצר של התבנית..."
                      style={{ 
                        borderColor: `${COLORS.gold}50`,
                        backgroundColor: COLORS.white,
                      }}
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Columns Header */}
                <div className="flex items-center justify-between" dir="rtl">
                  <Label 
                    className="font-medium text-lg"
                    style={{ color: COLORS.navy }}
                  >
                    עמודות ({columns.length})
                  </Label>
                  <Button
                    onClick={addColumn}
                    style={{ 
                      backgroundColor: COLORS.navy,
                      color: COLORS.white,
                    }}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף עמודה
                  </Button>
                </div>

                {/* Columns List */}
                <div className="-mx-2 px-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={columns.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3 pb-4">
                        {columns.map((column, index) => (
                          <SortableColumnItem
                            key={column.id}
                            column={column}
                            index={index}
                            onUpdate={updateColumn}
                            onDelete={deleteColumn}
                            isEditing={editingColumnId === column.id}
                            setEditingId={setEditingColumnId}
                            dataTypes={dataTypes}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {columns.length === 0 && (
                    <div 
                      className="text-center py-12 rounded-lg border-2 border-dashed"
                      style={{ borderColor: `${COLORS.gold}50` }}
                      dir="rtl"
                    >
                      <FolderPlus 
                        className="h-12 w-12 mx-auto mb-3 opacity-50"
                        style={{ color: COLORS.gold }}
                      />
                      <p style={{ color: COLORS.gray }}>הוסף עמודות לתבנית</p>
                      <Button
                        onClick={addColumn}
                        variant="outline"
                        className="mt-4"
                        style={{ 
                          borderColor: COLORS.gold,
                          color: COLORS.navy,
                        }}
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        הוסף עמודה ראשונה
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <DialogFooter 
          className="px-6 py-4 border-t flex items-center justify-between flex-shrink-0"
          style={{ borderColor: COLORS.gold }}
        >
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              style={{ color: COLORS.gray }}
            >
              סגירה
            </Button>
            {activeTab === 'create' && (
              <Button
                variant="outline"
                onClick={resetForm}
                style={{ 
                  borderColor: COLORS.gold,
                  color: COLORS.navy,
                }}
              >
                <X className="h-4 w-4 ml-1" />
                אפס טופס
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {activeTab === 'create' && (
              <Button
                onClick={saveTemplate}
                disabled={!templateName.trim() || columns.length === 0}
                style={{ 
                  backgroundColor: COLORS.navy,
                  color: COLORS.white,
                }}
              >
                <Save className="h-4 w-4 ml-2" />
                {editingTemplateId ? 'עדכן תבנית' : 'שמור תבנית'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CustomTemplateManager;
