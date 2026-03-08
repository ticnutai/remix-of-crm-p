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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CustomColumn } from '@/components/tables/AddColumnDialog';
import { COLUMN_TEMPLATES, TEMPLATE_CATEGORIES, ColumnTemplate } from '@/lib/columnTemplates';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Trash2,
  Eye,
  Sparkles,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import './template-colors.css';

interface BulkColumnWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  onColumnsAdded: (columns: CustomColumn[], groupName?: string) => void;
  existingColumns?: CustomColumn[];
}

type WizardStep = 'select' | 'customize' | 'preview';

export function BulkColumnWizard({
  open,
  onOpenChange,
  tableName,
  onColumnsAdded,
  existingColumns = [],
}: BulkColumnWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<ColumnTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [columns, setColumns] = useState<Omit<CustomColumn, 'id' | 'table_name' | 'column_order'>[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let filtered = COLUMN_TEMPLATES;

    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.name_en.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery]);

  // Handle template selection
  const handleTemplateSelect = (template: ColumnTemplate) => {
    setSelectedTemplate(template);
    setColumns(template.columns);
    setGroupName(template.name);
    setCurrentStep('customize');
  };

  // Handle column update
  const updateColumn = (index: number, updates: Partial<typeof columns[0]>) => {
    setColumns(prev => {
      const newColumns = [...prev];
      newColumns[index] = { ...newColumns[index], ...updates };
      return newColumns;
    });
  };

  // Handle column removal
  const removeColumn = (index: number) => {
    setColumns(prev => prev.filter((_, i) => i !== index));
  };

  // Add new custom column
  const addCustomColumn = () => {
    setColumns(prev => [
      ...prev,
      {
        column_key: '',
        column_name: '',
        column_type: 'text',
        is_required: false,
      },
    ]);
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (columns.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      const columnsWithTable: CustomColumn[] = columns.map((col, index) => ({
        ...col,
        table_name: tableName,
        column_order: (existingColumns.length || 0) + index,
        column_group: groupName || undefined,
      }));

      await onColumnsAdded(columnsWithTable, groupName || undefined);
      
      // Reset state
      setCurrentStep('select');
      setSelectedTemplate(null);
      setColumns([]);
      setGroupName('');
      setSearchQuery('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding columns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation
  const goToNext = () => {
    if (currentStep === 'select' && selectedTemplate) {
      setCurrentStep('customize');
    } else if (currentStep === 'customize') {
      setCurrentStep('preview');
    }
  };

  const goToPrevious = () => {
    if (currentStep === 'customize') {
      setCurrentStep('select');
    } else if (currentStep === 'preview') {
      setCurrentStep('customize');
    }
  };

  // Get icon component
  const getIcon = (iconName: string): React.ComponentType<{ className?: string }> => {
    const IconsObj = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    return IconsObj[iconName] || Icons.Database;
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
        currentStep === 'select' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      )}>
        1
      </div>
      <div className={cn(
        "h-[2px] w-16 transition-colors",
        currentStep !== 'select' ? 'bg-primary' : 'bg-muted'
      )} />
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
        currentStep === 'customize' ? 'bg-primary text-primary-foreground' : 
        currentStep === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      )}>
        2
      </div>
      <div className={cn(
        "h-[2px] w-16 transition-colors",
        currentStep === 'preview' ? 'bg-primary' : 'bg-muted'
      )} />
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
        currentStep === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      )}>
        3
      </div>
    </div>
  );

  // Step 1: Template Selection
  const renderSelectStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש תבניות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs value={selectedCategory || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? null : v)}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="all">הכל</TabsTrigger>
          {TEMPLATE_CATEGORIES.map(cat => {
            const Icon = getIcon(cat.icon);
            return (
              <TabsTrigger key={cat.value} value={cat.value} className="gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{cat.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <ScrollArea className="h-[400px] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTemplates.map(template => {
            const Icon = getIcon(template.icon);
            return (
              <Card
                key={template.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
                  selectedTemplate?.id === template.id && "ring-2 ring-primary"
                )}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-2 rounded-lg bg-opacity-10"
                        data-bg-color={template.color}
                      >
                        <Icon className="h-5 w-5" data-color={template.color} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-xs">{template.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {template.columns.slice(0, 4).map((col, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {col.column_name}
                      </Badge>
                    ))}
                    {template.columns.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.columns.length - 4}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>לא נמצאו תבניות מתאימות</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // Step 2: Customize Columns
  const renderCustomizeStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="groupName">שם קבוצה (אופציונלי)</Label>
        <Input
          id="groupName"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="לדוגמה: פרטי קשר, כתובת..."
        />
        <p className="text-xs text-muted-foreground">
          קבוצת עמודות תאפשר לך לנהל ולהציג את העמודות יחד
        </p>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label>עמודות ({columns.length})</Label>
        <Button variant="outline" size="sm" onClick={addCustomColumn}>
          <Plus className="h-4 w-4 mr-1" />
          הוסף עמודה
        </Button>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {columns.map((column, index) => (
            <Card key={index}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">שם העמודה</Label>
                      <Input
                        value={column.column_name}
                        onChange={(e) => updateColumn(index, { 
                          column_name: e.target.value,
                          column_key: column.column_key || e.target.value.toLowerCase().replace(/\s+/g, '_')
                        })}
                        placeholder="שם..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">מפתח</Label>
                      <Input
                        value={column.column_key}
                        onChange={(e) => updateColumn(index, { column_key: e.target.value })}
                        placeholder="column_key"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeColumn(index)}
                    className="mr-2"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">שדה חובה</Label>
                    <Switch
                      checked={column.is_required}
                      onCheckedChange={(checked) => updateColumn(index, { is_required: checked })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ברירת מחדל</Label>
                    <Input
                      value={column.default_value || ''}
                      onChange={(e) => updateColumn(index, { default_value: e.target.value })}
                      placeholder="ערך..."
                    />
                  </div>
                </div>

                {column.column_type === 'select' && (
                  <div className="space-y-1">
                    <Label className="text-xs">אפשרויות (מופרדות בפסיקים)</Label>
                    <Textarea
                      value={column.column_options?.join(', ') || ''}
                      onChange={(e) => updateColumn(index, { 
                        column_options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="אופציה 1, אופציה 2, אופציה 3"
                      rows={2}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  // Step 3: Preview
  const renderPreviewStep = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">סיכום</CardTitle>
          <CardDescription>
            {groupName && `קבוצה: ${groupName} • `}
            {columns.length} עמודות יתווספו
          </CardDescription>
        </CardHeader>
      </Card>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {columns.map((column, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{column.column_name}</div>
                    <div className="text-sm text-muted-foreground">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {column.column_key}
                      </code>
                      <span className="mx-2">•</span>
                      <span>{column.column_type}</span>
                      {column.is_required && (
                        <>
                          <span className="mx-2">•</span>
                          <Badge variant="destructive" className="text-xs">חובה</Badge>
                        </>
                      )}
                    </div>
                    {column.default_value && (
                      <div className="text-xs text-muted-foreground mt-1">
                        ברירת מחדל: {column.default_value}
                      </div>
                    )}
                    {column.column_options && column.column_options.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {column.column_options.map((opt, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {opt}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {currentStep === 'select' && 'בחר תבנית עמודות'}
            {currentStep === 'customize' && 'התאם אישית'}
            {currentStep === 'preview' && 'תצוגה מקדימה'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'select' && 'בחר תבנית מוכנה או צור קבוצת עמודות משלך'}
            {currentStep === 'customize' && 'ערוך את העמודות והתאם אותן לצרכים שלך'}
            {currentStep === 'preview' && 'בדוק את העמודות לפני ההוספה'}
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        {currentStep === 'select' && renderSelectStep()}
        {currentStep === 'customize' && renderCustomizeStep()}
        {currentStep === 'preview' && renderPreviewStep()}

        <DialogFooter className="flex items-center justify-between">
          <div>
            {currentStep !== 'select' && (
              <Button variant="outline" onClick={goToPrevious}>
                <ChevronRight className="h-4 w-4 mr-1" />
                חזור
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            {currentStep === 'preview' ? (
              <Button onClick={handleSubmit} disabled={isLoading || columns.length === 0}>
                {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                הוסף {columns.length} עמודות
              </Button>
            ) : (
              <Button
                onClick={goToNext}
                disabled={currentStep === 'select' && !selectedTemplate}
              >
                המשך
                <ChevronLeft className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
