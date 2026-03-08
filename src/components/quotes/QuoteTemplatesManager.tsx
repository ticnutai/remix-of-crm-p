// תבניות הצעות מחיר
// מערכת ניהול תבניות להצעות מחיר

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  FileText,
  DollarSign,
  Save,
  X,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// טיפוסים
interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

interface QuoteTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  items: QuoteItem[];
  terms?: string;
  notes?: string;
  validity_days: number;
  created_at: string;
  updated_at: string;
}

// יחידות מידה נפוצות
const UNITS = [
  { value: 'יח׳', label: 'יחידה' },
  { value: 'מ״ר', label: 'מטר מרובע' },
  { value: 'מ״א', label: 'מטר אורך' },
  { value: 'שעה', label: 'שעה' },
  { value: 'יום', label: 'יום' },
  { value: 'קומפלט', label: 'קומפלט' },
  { value: 'חודש', label: 'חודש' },
];

// קטגוריות
const CATEGORIES = [
  { value: 'היתר_בניה', label: 'היתר בניה' },
  { value: 'תכנון_פנים', label: 'תכנון פנים' },
  { value: 'שיפוץ', label: 'שיפוץ' },
  { value: 'פיקוח', label: 'פיקוח' },
  { value: 'ייעוץ', label: 'ייעוץ' },
  { value: 'אחר', label: 'אחר' },
];

export function QuoteTemplatesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // שליפת תבניות
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['quote-templates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('quote_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as QuoteTemplate[];
    },
  });

  // שמירת תבנית
  const saveMutation = useMutation({
    mutationFn: async (template: Partial<QuoteTemplate>) => {
      if (template.id) {
        const { error } = await (supabase as any)
          .from('quote_templates')
          .update({
            name: template.name,
            description: template.description,
            category: template.category,
            items: template.items,
            terms: template.terms,
            notes: template.notes,
            validity_days: template.validity_days,
            updated_at: new Date().toISOString(),
          })
          .eq('id', template.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('quote_templates')
          .insert([{
            name: template.name,
            description: template.description,
            category: template.category,
            items: template.items || [],
            terms: template.terms,
            notes: template.notes,
            validity_days: template.validity_days || 30,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-templates'] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      toast({
        title: 'נשמר בהצלחה',
        description: 'התבנית נשמרה',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // מחיקת תבנית
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('quote_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-templates'] });
      toast({
        title: 'נמחק',
        description: 'התבנית נמחקה',
      });
    },
  });

  // שכפול תבנית
  const handleDuplicate = (template: QuoteTemplate) => {
    setEditingTemplate({
      ...template,
      id: '',
      name: `${template.name} (העתק)`,
    } as any);
    setIsDialogOpen(true);
  };

  // פתיחת דיאלוג עריכה
  const handleEdit = (template: QuoteTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  // יצירת תבנית חדשה
  const handleNew = () => {
    setEditingTemplate({
      id: '',
      name: '',
      description: '',
      category: 'היתר_בניה',
      items: [],
      terms: 'ההצעה בתוקף ל-30 יום מיום הפקתה.',
      notes: '',
      validity_days: 30,
      created_at: '',
      updated_at: '',
    });
    setIsDialogOpen(true);
  };

  // סינון לפי קטגוריה
  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  // חישוב סה"כ תבנית
  const calculateTotal = (items: QuoteItem[]) => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* כותרת ופעולות */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            תבניות הצעות מחיר
          </h2>
          <p className="text-muted-foreground">
            נהל תבניות מוכנות להצעות מחיר
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="כל הקטגוריות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 ml-2" />
            תבנית חדשה
          </Button>
        </div>
      </div>

      {/* רשימת תבניות */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">אין תבניות עדיין</p>
            <Button onClick={handleNew} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 ml-2" />
              צור תבנית ראשונה
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description || 'ללא תיאור'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* פרטי פריטים */}
                  <div className="text-sm text-muted-foreground">
                    {template.items.length} פריטים
                  </div>
                  
                  {/* סה"כ */}
                  <div className="flex items-center justify-between py-2 border-t">
                    <span className="font-medium">סה״כ:</span>
                    <span className="font-bold text-lg">
                      ₪{calculateTotal(template.items).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* כפתורי פעולה */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      עריכה
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('למחוק את התבנית?')) {
                          deleteMutation.mutate(template.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* דיאלוג עריכה */}
      <QuoteTemplateDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        template={editingTemplate}
        onSave={(template) => saveMutation.mutate(template)}
        isSaving={saveMutation.isPending}
      />
    </div>
  );
}

// דיאלוג עריכת תבנית
function QuoteTemplateDialog({
  open,
  onOpenChange,
  template,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: QuoteTemplate | null;
  onSave: (template: Partial<QuoteTemplate>) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<QuoteTemplate>>({});
  const [items, setItems] = useState<QuoteItem[]>([]);

  // אתחול בפתיחה
  React.useEffect(() => {
    if (template) {
      setFormData(template);
      setItems(template.items || []);
    }
  }, [template]);

  // עדכון שדה
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // הוספת פריט
  const addItem = () => {
    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unit: 'יח׳',
      unit_price: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  // עדכון פריט
  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = updated.quantity * updated.unit_price;
      }
      return updated;
    }));
  };

  // מחיקת פריט
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // הזזת פריט
  const moveItem = (id: string, direction: 'up' | 'down') => {
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    
    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    setItems(newItems);
  };

  // שמירה
  const handleSave = () => {
    onSave({
      ...formData,
      items,
    });
  };

  // חישוב סה"כ
  const total = items.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {formData.id ? 'עריכת תבנית' : 'תבנית חדשה'}
          </DialogTitle>
          <DialogDescription>
            הגדר את פרטי התבנית והפריטים
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* פרטי תבנית */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>שם התבנית *</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="לדוגמה: הצעת מחיר להיתר בניה"
              />
            </div>
            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <Select
                value={formData.category || 'היתר_בניה'}
                onValueChange={(v) => updateField('category', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>תיאור</Label>
              <Input
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="תיאור קצר של התבנית"
              />
            </div>
          </div>

          {/* פריטים */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>פריטים</Label>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 ml-1" />
                הוסף פריט
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>תיאור</TableHead>
                    <TableHead className="w-20">כמות</TableHead>
                    <TableHead className="w-24">יחידה</TableHead>
                    <TableHead className="w-28">מחיר יח׳</TableHead>
                    <TableHead className="w-28">סה״כ</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        אין פריטים. לחץ על "הוסף פריט" להתחיל
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => moveItem(item.id, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => moveItem(item.id, 'down')}
                              disabled={index === items.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="תיאור הפריט"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min={0}
                            step={0.1}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.unit}
                            onValueChange={(v) => updateItem(item.id, 'unit', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNITS.map(u => (
                                <SelectItem key={u.value} value={u.value}>
                                  {u.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            min={0}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          ₪{item.total.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* סיכום */}
              {items.length > 0 && (
                <div className="border-t bg-muted/50 p-4 flex justify-end">
                  <div className="text-lg">
                    <span className="text-muted-foreground">סה״כ: </span>
                    <span className="font-bold">₪{total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* תנאים והערות */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>תנאים</Label>
              <Textarea
                value={formData.terms || ''}
                onChange={(e) => updateField('terms', e.target.value)}
                rows={4}
                placeholder="תנאי ההצעה..."
              />
            </div>
            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={4}
                placeholder="הערות נוספות..."
              />
            </div>
          </div>

          {/* תוקף */}
          <div className="w-48">
            <Label>תוקף ההצעה (ימים)</Label>
            <Input
              type="number"
              value={formData.validity_days || 30}
              onChange={(e) => updateField('validity_days', parseInt(e.target.value) || 30)}
              min={1}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !formData.name}>
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
            ) : (
              <Save className="h-4 w-4 ml-2" />
            )}
            שמור תבנית
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default QuoteTemplatesManager;
