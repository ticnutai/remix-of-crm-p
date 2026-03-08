import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Download,
  MoreVertical,
  Upload,
  ArrowRight,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Quote template type
interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  price?: number;
  createdAt: string;
  updatedAt: string;
  previewHtml?: string;
  data?: any;
}

// Sample templates based on your HTML files
const sampleTemplates: QuoteTemplate[] = [
  {
    id: 'template-1',
    name: 'הצעת מחיר לתוספת בניה',
    description: 'הוצאת היתר בניה לתוספת בניה למבנה מגורים קיים',
    category: 'בניה',
    price: 35000,
    createdAt: '2026-02-04',
    updatedAt: '2026-02-04',
  },
  {
    id: 'template-2',
    name: 'הצעת מחיר להרחבה צפונית',
    description: 'הוצאת היתר בניה ליחידת דיור אחת במגרש בהרחבה',
    category: 'בניה',
    price: 37000,
    createdAt: '2026-02-04',
    updatedAt: '2026-02-04',
  },
  {
    id: 'template-3',
    name: 'הצעת מחיר לרישוי בלבד',
    description: 'הוצאת היתר בניה עם קבלת תוכנית וגרמושקא מאדריכל מתכנן',
    category: 'רישוי',
    price: 30000,
    createdAt: '2026-02-04',
    updatedAt: '2026-02-04',
  },
];

export default function QuoteTemplatesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [templates, setTemplates] = useState<QuoteTemplate[]>(sampleTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<QuoteTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<QuoteTemplate | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, QuoteTemplate[]> = {};
    filteredTemplates.forEach((template) => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    return groups;
  }, [filteredTemplates]);

  // Handle template actions
  const handleEditTemplate = (template: QuoteTemplate) => {
    navigate(`/document-editor?type=quote&templateId=${template.id}`);
  };

  const handleDuplicateTemplate = (template: QuoteTemplate) => {
    const newTemplate: QuoteTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (עותק)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTemplates((prev) => [newTemplate, ...prev]);
    toast({
      title: 'התבנית שוכפלה',
      description: `נוצר עותק של "${template.name}"`,
    });
  };

  const handleDeleteTemplate = (template: QuoteTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete.id));
      toast({
        title: 'התבנית נמחקה',
        description: `"${templateToDelete.name}" נמחקה בהצלחה`,
      });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handlePreviewTemplate = (template: QuoteTemplate) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleCreateFromTemplate = (template: QuoteTemplate) => {
    navigate(`/document-editor?type=quote&fromTemplate=${template.id}`);
  };

  const handleExportTemplate = (template: QuoteTemplate) => {
    // Create JSON export
    const exportData = JSON.stringify(template, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'התבנית יוצאה',
      description: 'הקובץ הורד בהצלחה',
    });
  };

  const handleImportTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.html';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          
          if (file.name.endsWith('.json')) {
            const templateData = JSON.parse(content);
            const newTemplate: QuoteTemplate = {
              ...templateData,
              id: `template-${Date.now()}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setTemplates((prev) => [newTemplate, ...prev]);
            toast({
              title: 'התבנית יובאה',
              description: `"${newTemplate.name}" נוספה בהצלחה`,
            });
          } else if (file.name.endsWith('.html')) {
            // Parse HTML template
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const title = doc.querySelector('title')?.textContent || file.name.replace('.html', '');
            const h1 = doc.querySelector('h1')?.textContent || title;
            
            const newTemplate: QuoteTemplate = {
              id: `template-${Date.now()}`,
              name: h1,
              description: title,
              category: 'מיובא',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              previewHtml: content,
            };
            setTemplates((prev) => [newTemplate, ...prev]);
            toast({
              title: 'התבנית יובאה',
              description: `"${newTemplate.name}" נוספה בהצלחה`,
            });
          }
        } catch (error) {
          toast({
            title: 'שגיאה בייבוא',
            description: 'הקובץ אינו תקין',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleCreateNewTemplate = () => {
    navigate('/document-editor?type=quote&new=true');
  };

  return (
    <div className="h-screen flex flex-col" dir="rtl">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/quotes')}>
              <ArrowRight className="h-4 w-4 ml-1" />
              חזור
            </Button>
            <div className="flex items-center gap-2">
              <FileCode className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">תבניות הצעות מחיר</h1>
                <p className="text-sm text-muted-foreground">
                  {templates.length} תבניות זמינות
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleImportTemplate}>
              <Upload className="h-4 w-4 ml-2" />
              ייבוא
            </Button>
            <Button onClick={handleCreateNewTemplate}>
              <Plus className="h-4 w-4 ml-2" />
              תבנית חדשה
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 max-w-md">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש תבניות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {category}
                <Badge variant="secondary">{categoryTemplates.length}</Badge>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base font-semibold">
                          {template.name}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                              <Eye className="h-4 w-4 ml-2" />
                              תצוגה מקדימה
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                              <Pencil className="h-4 w-4 ml-2" />
                              עריכה
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateFromTemplate(template)}>
                              <FileText className="h-4 w-4 ml-2" />
                              צור הצעה חדשה
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                              <Copy className="h-4 w-4 ml-2" />
                              שכפל
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportTemplate(template)}>
                              <Download className="h-4 w-4 ml-2" />
                              ייצוא
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteTemplate(template)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              מחיקה
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {template.description}
                      </p>
                      {template.price && (
                        <Badge variant="outline" className="mb-3">
                          ₪{template.price.toLocaleString()}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          תצוגה
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleCreateFromTemplate(template)}
                        >
                          <Plus className="h-4 w-4 ml-1" />
                          צור הצעה
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">אין תבניות</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'לא נמצאו תבניות התואמות לחיפוש' : 'צור תבנית חדשה או ייבא תבנית קיימת'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={handleImportTemplate}>
                  <Upload className="h-4 w-4 ml-2" />
                  ייבוא תבנית
                </Button>
                <Button onClick={handleCreateNewTemplate}>
                  <Plus className="h-4 w-4 ml-2" />
                  תבנית חדשה
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4">
            {selectedTemplate?.previewHtml ? (
              <iframe
                srcDoc={selectedTemplate.previewHtml}
                className="w-full h-full border-0 rounded"
                title="Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>תצוגה מקדימה לא זמינה</p>
                  <p className="text-sm">לחץ על "עריכה" כדי לראות את התבנית</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              סגור
            </Button>
            <Button onClick={() => {
              if (selectedTemplate) {
                handleCreateFromTemplate(selectedTemplate);
              }
            }}>
              <Plus className="h-4 w-4 ml-2" />
              צור הצעה מתבנית זו
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת תבנית</DialogTitle>
          </DialogHeader>
          <p>האם אתה בטוח שברצונך למחוק את התבנית "{templateToDelete?.name}"?</p>
          <p className="text-sm text-muted-foreground">פעולה זו אינה ניתנת לביטול.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
