// מנהל תבניות הצעות מחיר מתקדם
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  FileText,
  Eye,
  Search,
  Layers,
  Upload,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  QuoteTemplate, 
  CATEGORIES, 
  createEmptyTemplate,
  DEFAULT_DESIGN_SETTINGS 
} from './types';
import { AdvancedTemplateDialog } from './AdvancedTemplateDialog';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';
import { HtmlTemplateEditor } from './HtmlTemplateEditor';
import { importHtmlFile } from './htmlTemplateParser';

export function QuoteTemplatesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingTemplate, setEditingTemplate] = useState<Partial<QuoteTemplate> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<QuoteTemplate | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [htmlEditorTemplate, setHtmlEditorTemplate] = useState<QuoteTemplate | null>(null);

  // שליפת תבניות
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['quote-templates-advanced'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('quote_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match interface
      return (data || []).map((t: any) => ({
        ...t,
        items: t.items || [],
        stages: t.stages || [],
        payment_schedule: t.payment_schedule || [],
        timeline: t.timeline || [],
        important_notes: t.important_notes || [],
        design_settings: t.design_settings || DEFAULT_DESIGN_SETTINGS,
        validity_days: t.validity_days || 30,
        show_vat: t.show_vat ?? true,
        vat_rate: t.vat_rate || 17,
        html_content: t.html_content || null,
        text_boxes: t.text_boxes || [],
        upgrades: t.upgrades || [],
        project_details: t.project_details || {},
        pricing_tiers: t.pricing_tiers || [],
        base_price: t.base_price || 0,
      })) as QuoteTemplate[];
    },
  });

  // שמירת תבנית
  const saveMutation = useMutation({
    mutationFn: async (template: Partial<QuoteTemplate>) => {
      const payload = {
        name: template.name,
        description: template.description,
        category: template.category,
        items: template.items || [],
        stages: template.stages || [],
        payment_schedule: template.payment_schedule || [],
        timeline: template.timeline || [],
        terms: template.terms,
        notes: template.notes,
        important_notes: template.important_notes || [],
        validity_days: template.validity_days || 30,
        design_settings: template.design_settings || DEFAULT_DESIGN_SETTINGS,
        show_vat: template.show_vat ?? true,
        vat_rate: template.vat_rate || 17,
        is_active: template.is_active ?? true,
        html_content: template.html_content || null,
        text_boxes: template.text_boxes || [],
        upgrades: template.upgrades || [],
        project_details: template.project_details || {},
        base_price: template.base_price || 0,
        pricing_tiers: template.pricing_tiers || [],
        updated_at: new Date().toISOString(),
      };

      if (template.id) {
        const { error } = await (supabase as any)
          .from('quote_templates')
          .update(payload)
          .eq('id', template.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('quote_templates')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-templates-advanced'] });
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
      queryClient.invalidateQueries({ queryKey: ['quote-templates-advanced'] });
      toast({
        title: 'נמחק',
        description: 'התבנית נמחקה',
      });
    },
  });

  // ייבוא קובץ HTML
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
        failCount++;
        continue;
      }

      try {
        const template = await importHtmlFile(file);
        if (template) {
          await saveMutation.mutateAsync(template);
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error('Error importing file:', file.name, err);
        failCount++;
      }
    }

    setIsImporting(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (successCount > 0) {
      toast({
        title: 'יובאו בהצלחה',
        description: `${successCount} תבניות יובאו${failCount > 0 ? `, ${failCount} נכשלו` : ''}`,
      });
    } else if (failCount > 0) {
      toast({
        title: 'שגיאה בייבוא',
        description: 'לא ניתן היה לייבא את הקבצים',
        variant: 'destructive',
      });
    }
  };

  // פונקציות פעולה
  const handleNew = () => {
    setEditingTemplate(createEmptyTemplate());
    setIsDialogOpen(true);
  };

  const handleEdit = (template: QuoteTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleDuplicate = (template: QuoteTemplate) => {
    setEditingTemplate({
      ...template,
      id: undefined,
      name: `${template.name} (העתק)`,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('למחוק את התבנית?')) {
      deleteMutation.mutate(id);
    }
  };

  // סינון
  const filteredTemplates = templates.filter(t => {
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // חישוב סה"כ
  const calculateTotal = (template: QuoteTemplate) => {
    return (template.items || []).reduce((sum, item) => sum + (item.total || 0), 0);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm"
        multiple
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-[#d8ac27]" />
            תבניות הצעות מחיר
          </h2>
          <p className="text-muted-foreground">
            נהל תבניות מוכנות עם שלבים, לוח תשלומים ועיצוב מותאם
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleImportClick}
            variant="outline"
            disabled={isImporting}
            className="border-[#d8ac27] text-[#d8ac27] hover:bg-[#d8ac27]/10"
          >
            {isImporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#d8ac27] border-t-transparent ml-2" />
            ) : (
              <Upload className="h-4 w-4 ml-2" />
            )}
            יבוא HTML
          </Button>
          <Button 
            onClick={handleNew}
            className="bg-[#d8ac27] hover:bg-[#c49b22] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            תבנית חדשה
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש תבניות..."
            className="pr-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
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
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d8ac27] mx-auto" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">אין תבניות עדיין</h3>
            <p className="text-muted-foreground mb-6">
              צור תבנית ראשונה עם שלבים, לוח תשלומים ועיצוב מותאם
            </p>
            <Button 
              onClick={handleNew}
              variant="outline"
              className="border-[#d8ac27] text-[#d8ac27] hover:bg-[#d8ac27]/10"
            >
              <Plus className="h-4 w-4 ml-2" />
              צור תבנית ראשונה
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const primaryColor = template.design_settings?.primary_color || '#d8ac27';
            const stagesCount = (template.stages || []).length;
            const itemsCount = (template.stages || []).reduce(
              (sum, stage) => sum + (stage.items || []).length, 
              0
            ) + (template.items || []).length;
            
            return (
              <Card 
                key={template.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Color bar */}
                <div 
                  className="h-2"
                  style={{ backgroundColor: primaryColor }}
                />
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {template.description || 'ללא תיאור'}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: primaryColor,
                        color: primaryColor,
                      }}
                    >
                      {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{stagesCount} שלבים</span>
                      <span>•</span>
                      <span>{itemsCount} פריטים</span>
                      <span>•</span>
                      <span>{template.validity_days} יום</span>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="font-medium">סה״כ:</span>
                      <span 
                        className="font-bold text-lg"
                        style={{ color: primaryColor }}
                      >
                        ₪{calculateTotal(template).toLocaleString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {/* Open in Visual Editor button - primary action */}
                      <Button
                        size="sm"
                        className="flex-1 bg-[#d8ac27] hover:bg-[#c49b22] text-white"
                        onClick={() => setHtmlEditorTemplate(template)}
                      >
                        <ExternalLink className="h-4 w-4 ml-1" />
                        פתח בעורך
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="h-4 w-4" />
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
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <AdvancedTemplateDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSave={(t) => saveMutation.mutateAsync(t)}
        isSaving={saveMutation.isPending}
      />

      {previewTemplate && (
        <TemplatePreviewDialog
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* HTML Visual Editor */}
      {htmlEditorTemplate && (
        <HtmlTemplateEditor
          open={!!htmlEditorTemplate}
          onClose={() => setHtmlEditorTemplate(null)}
          template={htmlEditorTemplate}
          onSave={async (t) => {
            await saveMutation.mutateAsync(t);
            setHtmlEditorTemplate(null);
          }}
        />
      )}
    </div>
  );
}

export default QuoteTemplatesManager;
